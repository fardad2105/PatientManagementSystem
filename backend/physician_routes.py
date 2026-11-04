from fastapi import APIRouter, Depends, HTTPException

from core import User, audit, db, require_role, to_oid
from profiles import completeness, load_profiles

router = APIRouter(prefix="/api/physician")
physician_only = require_role("physician")


@router.get("/patients")
async def list_patients(user: User = Depends(physician_only)):
    links = await db.physician_assignments.find({"physician_id": user.id}).to_list(1000)
    ids = [to_oid(link["patient_id"]) for link in links]
    patients = await db.users.find({"_id": {"$in": ids}, "role": "patient", "status": "active"}).sort("name", 1).to_list(1000)
    medical = {m["patient_id"]: m for m in await db.medical_profiles.find(
        {"patient_id": {"$in": [str(i) for i in ids]}}).to_list(1000)}
    result = []
    for p in patients:
        pid = str(p["_id"])
        m = medical.get(pid, {})
        result.append({
            "id": pid, "name": p["name"], "email": p["email"], "status": p["status"],
            "cancer_type": m.get("cancer_type"), "surgery_date": m.get("surgery_date"),
            "profile_updated_at": m.get("updated_at"),
        })
    return result


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str, user: User = Depends(physician_only)):
    link = await db.physician_assignments.find_one({"physician_id": user.id, "patient_id": patient_id})
    patient = await db.users.find_one({"_id": to_oid(patient_id), "role": "patient", "status": "active"}) if link else None
    if not patient:
        await audit(user, "view", "patient_record", patient_id, "deny", "not assigned")
        raise HTTPException(status_code=404, detail="بیمار یافت نشد")
    profiles = await load_profiles(patient_id)
    await audit(user, "view", "patient_record", patient_id)
    return {
        "patient": {"id": patient_id, "name": patient["name"], "email": patient["email"],
                    "phone": patient.get("phone"), "status": patient["status"]},
        "profile": profiles,
        "completeness": completeness(profiles),
    }
