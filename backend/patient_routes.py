from fastapi import APIRouter, Depends

from core import User, audit, db, now_iso, require_role, to_oid
from profiles import MedicalIn, PersonalIn, completeness, load_profiles

router = APIRouter(prefix="/api/patient")
patient_only = require_role("patient")

UPCOMING_MODULES = ["medications", "labs", "appointments", "symptoms", "timeline", "documents", "education"]


async def care_team(patient_id: str) -> list:
    links = await db.physician_assignments.find({"patient_id": patient_id}).to_list(50)
    ids = [to_oid(link["physician_id"]) for link in links]
    docs = await db.users.find({"_id": {"$in": ids}, "role": "physician", "status": "active"}).to_list(50)
    return [{"id": str(d["_id"]), "name": d["name"], "specialty": d.get("specialty")} for d in docs]


@router.get("/profile")
async def get_profile(user: User = Depends(patient_only)):
    return await load_profiles(user.id)


@router.put("/profile/personal")
async def update_personal(body: PersonalIn, user: User = Depends(patient_only)):
    data = {**body.model_dump(), "patient_id": user.id, "updated_at": now_iso()}
    await db.patient_profiles.update_one({"patient_id": user.id}, {"$set": data}, upsert=True)
    await audit(user, "update", "patient_profile", user.id)
    return (await load_profiles(user.id))["personal"]


@router.put("/profile/medical")
async def update_medical(body: MedicalIn, user: User = Depends(patient_only)):
    data = {**body.model_dump(), "patient_id": user.id, "source": "patient_reported",
            "updated_at": now_iso(), "updated_by": user.id}
    await db.medical_profiles.update_one({"patient_id": user.id}, {"$set": data}, upsert=True)
    await audit(user, "update", "medical_profile", user.id)
    return (await load_profiles(user.id))["medical"]


@router.get("/dashboard")
async def dashboard(user: User = Depends(patient_only)):
    profiles = await load_profiles(user.id)
    return {
        "user": user.public(),
        "profile": profiles,
        "completeness": completeness(profiles),
        "care_team": await care_team(user.id),
        "upcoming_modules": UPCOMING_MODULES,
    }
