from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

from core import User, audit, db, hash_password, now_iso, require_role, to_oid

router = APIRouter(prefix="/api/admin")
admin_only = require_role("admin")


class StatusIn(BaseModel):
    status: Literal["active", "rejected", "disabled"]


class PhysicianIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    specialty: Optional[str] = Field(default="فوق‌تخصص غدد درون‌ریز", max_length=80)
    phone: Optional[str] = Field(default=None, pattern=r"^[0-9+\-\s]{7,20}$")


class ResetPasswordIn(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


class AssignmentIn(BaseModel):
    patient_id: str
    physician_id: str


async def get_user_or_404(user_id: str) -> User:
    user = User.from_mongo(await db.users.find_one({"_id": to_oid(user_id)}))
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    return user


@router.get("/stats")
async def stats(_: User = Depends(admin_only)):
    async def count(q):
        return await db.users.count_documents(q)
    return {
        "patients_active": await count({"role": "patient", "status": "active"}),
        "patients_pending": await count({"role": "patient", "status": "pending"}),
        "physicians_active": await count({"role": "physician", "status": "active"}),
        "assignments": await db.physician_assignments.count_documents({}),
    }


@router.get("/users")
async def list_users(role: Optional[str] = None, status: Optional[str] = None, q: Optional[str] = None,
                     _: User = Depends(admin_only)):
    query = {}
    if role:
        query["role"] = role
    if status:
        query["status"] = status
    docs = await db.users.find(query).sort("created_at", -1).to_list(1000)
    users = [User.from_mongo(d).public() for d in docs]
    if q:
        needle = q.strip().lower()
        users = [u for u in users if needle in u["name"].lower() or needle in u["email"]]
    return users


@router.patch("/users/{user_id}/status")
async def set_status(user_id: str, body: StatusIn, admin: User = Depends(admin_only)):
    target = await get_user_or_404(user_id)
    if target.role == "admin":
        raise HTTPException(status_code=403, detail="وضعیت حساب مدیر قابل تغییر نیست")
    await db.users.update_one({"_id": to_oid(user_id)}, {"$set": {"status": body.status, "status_changed_at": now_iso()}})
    await audit(admin, f"set_status:{body.status}", "user", user_id)
    return (await get_user_or_404(user_id)).public()


@router.post("/users/{user_id}/reset-password")
async def reset_password(user_id: str, body: ResetPasswordIn, admin: User = Depends(admin_only)):
    target = await get_user_or_404(user_id)
    if target.role == "admin":
        raise HTTPException(status_code=403, detail="رمز مدیر از این بخش قابل تغییر نیست")
    await db.users.update_one({"_id": to_oid(user_id)}, {"$set": {"password_hash": hash_password(body.new_password)}})
    await audit(admin, "reset_password", "user", user_id)
    return {"ok": True}


@router.post("/physicians")
async def create_physician(body: PhysicianIn, admin: User = Depends(admin_only)):
    user = User(email=body.email.lower(), name=body.name.strip(), role="physician", status="active",
                specialty=body.specialty, phone=body.phone, password_hash=hash_password(body.password))
    try:
        result = await db.users.insert_one(user.to_mongo())
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="این ایمیل قبلاً ثبت شده است")
    user.id = str(result.inserted_id)
    await audit(admin, "create_physician", "user", user.id)
    return user.public()


@router.get("/assignments")
async def list_assignments(_: User = Depends(admin_only)):
    links = await db.physician_assignments.find({}).sort("created_at", -1).to_list(2000)
    ids = {to_oid(link[k]) for link in links for k in ("patient_id", "physician_id")}
    names = {str(d["_id"]): d["name"] for d in await db.users.find({"_id": {"$in": list(ids)}}).to_list(4000)}
    return [{
        "id": str(link["_id"]), "patient_id": link["patient_id"], "physician_id": link["physician_id"],
        "patient_name": names.get(link["patient_id"], "—"), "physician_name": names.get(link["physician_id"], "—"),
        "created_at": link["created_at"],
    } for link in links]


@router.post("/assignments")
async def create_assignment(body: AssignmentIn, admin: User = Depends(admin_only)):
    patient = await get_user_or_404(body.patient_id)
    physician = await get_user_or_404(body.physician_id)
    if patient.role != "patient" or patient.status != "active":
        raise HTTPException(status_code=400, detail="فقط بیماران فعال قابل تخصیص هستند")
    if physician.role != "physician" or physician.status != "active":
        raise HTTPException(status_code=400, detail="پزشک انتخاب‌شده معتبر یا فعال نیست")
    try:
        result = await db.physician_assignments.insert_one({
            "patient_id": patient.id, "physician_id": physician.id, "assigned_by": admin.id, "created_at": now_iso()})
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="این بیمار قبلاً به این پزشک تخصیص داده شده است")
    await audit(admin, "assign", "physician_assignment", str(result.inserted_id), details=f"{patient.id}->{physician.id}")
    return {"id": str(result.inserted_id)}


@router.delete("/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str, admin: User = Depends(admin_only)):
    result = await db.physician_assignments.delete_one({"_id": to_oid(assignment_id)})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="تخصیص یافت نشد")
    await audit(admin, "unassign", "physician_assignment", assignment_id)
    return {"ok": True}


@router.get("/audit-logs")
async def audit_logs(limit: int = Query(100, ge=1, le=500), _: User = Depends(admin_only)):
    docs = await db.audit_logs.find({}).sort("created_at", -1).limit(limit).to_list(limit)
    return [{**{k: v for k, v in d.items() if k != "_id"}, "id": str(d["_id"])} for d in docs]
