from typing import Literal, Optional

from pydantic import BaseModel, Field

from core import BaseDocument, DateStr, db

Tri = Optional[Literal["yes", "no", "unknown"]]


class PersonalIn(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=60)
    last_name: Optional[str] = Field(default=None, max_length=60)
    national_id: Optional[str] = Field(default=None, pattern=r"^\d{10}$")
    birth_date: DateStr
    gender: Optional[Literal["male", "female", "other"]] = None
    phone: Optional[str] = Field(default=None, pattern=r"^[0-9+\-\s]{7,20}$")
    city: Optional[str] = Field(default=None, max_length=60)
    address: Optional[str] = Field(default=None, max_length=300)
    emergency_contact_name: Optional[str] = Field(default=None, max_length=80)
    emergency_contact_relation: Optional[str] = Field(default=None, max_length=40)
    emergency_contact_phone: Optional[str] = Field(default=None, pattern=r"^[0-9+\-\s]{7,20}$")


class MedicalIn(BaseModel):
    cancer_type: Optional[Literal["papillary", "follicular", "unknown"]] = None
    diagnosis_date: DateStr
    surgery_date: DateStr
    surgery_type: Optional[Literal["total", "near_total", "lobectomy", "completion", "unknown"]] = None
    lymph_node_dissection: Tri = None
    rai_received: Tri = None
    rai_sessions: Optional[int] = Field(default=None, ge=0, le=20)
    last_rai_date: DateStr
    staging_text: Optional[str] = Field(default=None, max_length=200)
    other_conditions: Optional[str] = Field(default=None, max_length=500)
    allergies: Optional[str] = Field(default=None, max_length=300)
    notes: Optional[str] = Field(default=None, max_length=1000)


class PersonalProfile(BaseDocument, PersonalIn):
    patient_id: str
    updated_at: Optional[str] = None


class MedicalProfile(BaseDocument, MedicalIn):
    patient_id: str
    source: str = "patient_reported"
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None


PERSONAL_KEYS = ["first_name", "last_name", "birth_date", "gender", "phone", "emergency_contact_name", "emergency_contact_phone"]
MEDICAL_KEYS = ["cancer_type", "diagnosis_date", "surgery_date", "surgery_type", "rai_received", "staging_text"]


async def load_profiles(patient_id: str) -> dict:
    personal = PersonalProfile.from_mongo(await db.patient_profiles.find_one({"patient_id": patient_id}))
    medical = MedicalProfile.from_mongo(await db.medical_profiles.find_one({"patient_id": patient_id}))
    return {
        "personal": personal.model_dump() if personal else None,
        "medical": medical.model_dump() if medical else None,
    }


def completeness(profiles: dict) -> int:
    keys = [(profiles["personal"] or {}, k) for k in PERSONAL_KEYS] + [(profiles["medical"] or {}, k) for k in MEDICAL_KEYS]
    filled = sum(1 for doc, k in keys if doc.get(k) not in (None, ""))
    return round(100 * filled / len(keys))
