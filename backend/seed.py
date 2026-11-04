import os

from core import User, db, hash_password, now_iso

DEMO_PHYSICIAN = ("dr.sample@demo.thyrocare.app", "Physician@123", "دکتر نمونه (پزشک آزمایشی)")
DEMO_PATIENT = ("patient.sample@demo.thyrocare.app", "Patient@123", "بیمار نمونه (داده‌ی ساختگی)")
DEMO_PENDING = ("pending.sample@demo.thyrocare.app", "Pending@123", "بیمار در انتظار (داده‌ی ساختگی)")


async def ensure_user(email: str, password: str, name: str, role: str, status: str, **extra) -> str:
    existing = await db.users.find_one({"email": email})
    if existing:
        return str(existing["_id"])
    user = User(email=email, name=name, role=role, status=status, password_hash=hash_password(password), **extra)
    result = await db.users.insert_one(user.to_mongo())
    return str(result.inserted_id)


async def seed() -> None:
    await ensure_user(os.environ["ADMIN_EMAIL"].lower(), os.environ["ADMIN_PASSWORD"], "مدیر سیستم", "admin", "active")
    if os.environ.get("SEED_DEMO_DATA") != "true":
        return
    physician_id = await ensure_user(*DEMO_PHYSICIAN, "physician", "active", specialty="فوق‌تخصص غدد درون‌ریز")
    patient_id = await ensure_user(*DEMO_PATIENT, "patient", "active")
    await ensure_user(*DEMO_PENDING, "patient", "pending")
    if not await db.patient_profiles.find_one({"patient_id": patient_id}):
        await db.patient_profiles.insert_one({
            "patient_id": patient_id, "first_name": "سارا", "last_name": "نمونه", "birth_date": "1985-03-21",
            "gender": "female", "phone": "09120000000", "city": "تهران",
            "emergency_contact_name": "علی نمونه", "emergency_contact_relation": "همسر",
            "emergency_contact_phone": "09120000001", "updated_at": now_iso()})
    if not await db.medical_profiles.find_one({"patient_id": patient_id}):
        await db.medical_profiles.insert_one({
            "patient_id": patient_id, "cancer_type": "papillary", "diagnosis_date": "2023-01-10",
            "surgery_date": "2023-02-15", "surgery_type": "total", "lymph_node_dissection": "yes",
            "rai_received": "yes", "rai_sessions": 1, "last_rai_date": "2023-05-01",
            "staging_text": "نمونه‌ی ساختگی — مرحله توسط پزشک ثبت می‌شود", "source": "patient_reported",
            "updated_at": now_iso(), "updated_by": patient_id})
    if not await db.physician_assignments.find_one({"patient_id": patient_id, "physician_id": physician_id}):
        await db.physician_assignments.insert_one({
            "patient_id": patient_id, "physician_id": physician_id, "assigned_by": "seed", "created_at": now_iso()})
