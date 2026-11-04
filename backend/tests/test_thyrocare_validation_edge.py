# ThyroCare validation edge cases: impossible dates, non-ASCII digits, future dates (uses a fresh TEST_ patient)
import os
import uuid

import pytest
import requests

API = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/") + "/api"
ADMIN = ("gillianarchuleta90119@outlook.com", "ThyroAdmin#2026")


@pytest.fixture(scope="module")
def patient():
    s = requests.Session()
    email = f"test_edge_{uuid.uuid4().hex[:8]}@demo.thyrocare.app"
    uid = s.post(f"{API}/auth/register", json={"name": "TEST_edge", "email": email, "password": "TestPass@123"}).json()["id"]
    a = requests.Session()
    a.post(f"{API}/auth/login", json={"email": ADMIN[0], "password": ADMIN[1]})
    a.patch(f"{API}/admin/users/{uid}/status", json={"status": "active"})
    yield s
    a.patch(f"{API}/admin/users/{uid}/status", json={"status": "disabled"})


def test_impossible_calendar_date_rejected(patient):
    r = patient.put(f"{API}/patient/profile/personal", json={"birth_date": "2023-13-45"})
    assert r.status_code == 422, f"impossible date accepted: {r.status_code} {r.text[:200]}"


def test_persian_digits_national_id_rejected(patient):
    r = patient.put(f"{API}/patient/profile/personal", json={"national_id": "۰۰۱۲۳۴۵۶۷۸"})
    assert r.status_code == 422, f"persian digits accepted: {r.status_code} {r.text[:200]}"


def test_persian_digits_date_rejected(patient):
    r = patient.put(f"{API}/patient/profile/medical", json={"surgery_date": "۲۰۲۳-۰۱-۰۱"})
    assert r.status_code == 422, f"persian-digit date accepted: {r.status_code} {r.text[:200]}"


def test_future_surgery_date_rejected(patient):
    r = patient.put(f"{API}/patient/profile/medical", json={"surgery_date": "2099-01-01"})
    assert r.status_code == 422, f"future date accepted: {r.status_code}"
