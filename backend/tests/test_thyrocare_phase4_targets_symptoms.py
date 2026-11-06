# ThyroCare Phase 4 (Java backend): physician dashboard, target ranges/alerts, patient symptom check-ins, RBAC
import os
import uuid
import datetime as dt

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN = ("gillianarchuleta90119@outlook.com", "ThyroAdmin#2026")
PHYS = ("dr.sample@demo.thyrocare.app", "Physician@123")
PAT = ("patient.sample@demo.thyrocare.app", "Patient@123")
KEYS = ["fatigue", "palpitations", "anxiety", "weight_change", "neck_pain", "swallowing", "hair_loss",
        "cold_sensitivity", "mood_swings"]
D1, D2 = "2026-10-01", "2026-10-02"


def login(email, pw):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": pw})
    return s, r


@pytest.fixture(scope="module")
def phys():
    s, r = login(*PHYS)
    if r.status_code != 200:
        pytest.skip("physician login failed")
    return s


@pytest.fixture(scope="module")
def pat():
    s, r = login(*PAT)
    if r.status_code != 200:
        pytest.skip("patient login failed")
    return s


@pytest.fixture(scope="module")
def admin():
    s, r = login(*ADMIN)
    if r.status_code != 200:
        pytest.skip("admin login failed")
    return s


@pytest.fixture(scope="module")
def pid(phys):
    lst = phys.get(f"{API}/physician/patients").json()
    demo = [p for p in lst if p["email"] == PAT[0]]
    assert demo, "demo patient not assigned"
    return demo[0]["id"]


@pytest.fixture(scope="module", autouse=True)
def restore(phys, pid, pat):
    original = phys.get(f"{API}/physician/patients/{pid}/targets").json()
    created_sym = []
    yield created_sym
    # restore targets: clear all, then reapply originals
    phys.put(f"{API}/physician/patients/{pid}/targets", json={"targets": [
        {"test_type": t, "unit": u, "target_low": None, "target_high": None}
        for t, u in [("TSH", "mIU/L"), ("FT4", "ng/dL"), ("Tg", "ng/mL"), ("TgAb", "IU/mL")]]})
    if original:
        phys.put(f"{API}/physician/patients/{pid}/targets", json={"targets": [
            {k: t[k] for k in ("test_type", "unit", "target_low", "target_high")} for t in original]})
    for e in pat.get(f"{API}/patient/symptoms?days=730").json():
        if e["entry_date"] in (D1, D2) or (e.get("notes") or "").startswith("TEST_"):
            pat.delete(f"{API}/patient/symptoms/{e['id']}")


# --- Dashboard ---
class TestDashboard:
    def test_dashboard_shape(self, phys):
        r = phys.get(f"{API}/physician/dashboard")
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("physician", "active_patients", "today_appointments", "needs_attention", "attention", "today", "recent_labs"):
            assert k in d, k
        assert d["needs_attention"] == len(d["attention"])
        assert d["today_appointments"] == len(d["today"])
        assert d["active_patients"] >= 1
        assert "password" not in str(d["physician"]).lower()
        for rl in d["recent_labs"]:
            assert rl["item"]["flag"] in ("no_target", "unit_mismatch", "below", "above", "in_range")


# --- Targets & alerts ---
class TestTargets:
    def test_set_out_of_range_target_creates_alert(self, phys, pid):
        r = phys.put(f"{API}/physician/patients/{pid}/targets", json={"targets": [
            {"test_type": "TSH", "unit": "mIU/L", "target_low": 0.01, "target_high": 0.02}]})
        assert r.status_code == 200, r.text
        tsh = [t for t in r.json() if t["test_type"] == "TSH"][0]
        assert float(tsh["target_high"]) == 0.02
        alerts = phys.get(f"{API}/physician/alerts").json()
        a = [p for p in alerts if p["id"] == pid]
        assert a, "patient should be in alerts"
        assert any(f["lab"]["test_type"] == "TSH" and f["flag"] == "above" for f in a[0]["out_of_range"])
        d = phys.get(f"{API}/physician/dashboard").json()
        assert any(p["id"] == pid for p in d["attention"])

    def test_in_range_target_removes_alert(self, phys, pid):
        r = phys.put(f"{API}/physician/patients/{pid}/targets", json={"targets": [
            {"test_type": "TSH", "unit": "mIU/L", "target_low": 0, "target_high": 1000}]})
        assert r.status_code == 200
        lst = phys.get(f"{API}/physician/patients").json()
        p = [x for x in lst if x["id"] == pid][0]
        tsh = [f for f in p["latest"] if f["lab"]["test_type"] == "TSH"]
        if tsh:
            assert tsh[0]["flag"] == "in_range"
        assert not any(f["lab"]["test_type"] == "TSH" for f in p["out_of_range"])

    def test_clear_target(self, phys, pid):
        r = phys.put(f"{API}/physician/patients/{pid}/targets", json={"targets": [
            {"test_type": "TSH", "unit": "mIU/L", "target_low": None, "target_high": None}]})
        assert r.status_code == 200
        assert not any(t["test_type"] == "TSH" for t in r.json())
        g = phys.get(f"{API}/physician/patients/{pid}/targets").json()
        assert not any(t["test_type"] == "TSH" for t in g)

    def test_low_gt_high_400(self, phys, pid):
        r = phys.put(f"{API}/physician/patients/{pid}/targets", json={"targets": [
            {"test_type": "TSH", "unit": "mIU/L", "target_low": 5, "target_high": 1}]})
        assert r.status_code == 400

    def test_invalid_unit_400(self, phys, pid):
        r = phys.put(f"{API}/physician/patients/{pid}/targets", json={"targets": [
            {"test_type": "TSH", "unit": "ng/mL", "target_low": 1, "target_high": 2}]})
        assert r.status_code == 400

    def test_negative_and_bad_type_400(self, phys, pid):
        r = phys.put(f"{API}/physician/patients/{pid}/targets", json={"targets": [
            {"test_type": "TSH", "unit": "mIU/L", "target_low": -1, "target_high": 2}]})
        assert r.status_code == 400
        r = phys.put(f"{API}/physician/patients/{pid}/targets", json={"targets": [
            {"test_type": "XYZ", "unit": "mIU/L", "target_low": 1, "target_high": 2}]})
        assert r.status_code == 400, f"bad enum -> {r.status_code} {r.text[:200]}"

    def test_unassigned_patient_404(self, phys, admin):
        email = f"test_p4_{uuid.uuid4().hex[:8]}@demo.thyrocare.app"
        r = requests.post(f"{API}/auth/register", json={"name": "TEST_p4", "email": email, "password": "TestPass@123"})
        assert r.status_code == 200, r.text
        uid = r.json()["id"]
        admin.patch(f"{API}/admin/users/{uid}/status", json={"status": "active"})
        try:
            assert phys.get(f"{API}/physician/patients/{uid}/targets").status_code == 404
            assert phys.put(f"{API}/physician/patients/{uid}/targets", json={"targets": []}).status_code == 404
            assert phys.get(f"{API}/physician/patients/{uid}/symptoms").status_code == 404
            assert phys.get(f"{API}/physician/patients/{uuid.uuid4()}/symptoms").status_code == 404
        finally:
            admin.patch(f"{API}/admin/users/{uid}/status", json={"status": "disabled"})


# --- Symptoms ---
class TestSymptoms:
    def test_upsert_and_list(self, pat, phys, pid):
        body = {"entry_date": D1, "mood": "fair", "scores": {k: 3 for k in KEYS}, "notes": "TEST_one"}
        r = pat.put(f"{API}/patient/symptoms", json=body)
        assert r.status_code == 200, r.text
        e1 = r.json()
        assert e1["mood"] == "fair" and e1["scores"]["fatigue"] == 3
        body2 = {**body, "mood": "bad", "scores": {"fatigue": 9}}
        r2 = pat.put(f"{API}/patient/symptoms", json=body2)
        assert r2.status_code == 200
        assert r2.json()["id"] == e1["id"]
        lst = pat.get(f"{API}/patient/symptoms?days=730").json()
        same = [e for e in lst if e["entry_date"] == D1]
        assert len(same) == 1
        assert same[0]["mood"] == "bad" and same[0]["scores"] == {"fatigue": 9}
        # physician read-only view
        ph = phys.get(f"{API}/physician/patients/{pid}/symptoms?days=730")
        assert ph.status_code == 200
        assert any(e["entry_date"] == D1 for e in ph.json())

    def test_validation(self, pat):
        base = {"entry_date": D2, "mood": "good", "scores": {"fatigue": 1}}
        assert pat.put(f"{API}/patient/symptoms", json={**base, "scores": {"bogus": 1}}).status_code == 400
        assert pat.put(f"{API}/patient/symptoms", json={**base, "scores": {"fatigue": 11}}).status_code == 400
        assert pat.put(f"{API}/patient/symptoms", json={**base, "scores": {"fatigue": -1}}).status_code == 400
        assert pat.put(f"{API}/patient/symptoms", json={**base, "mood": "great"}).status_code == 400
        fut = (dt.date.today() + dt.timedelta(days=3)).isoformat()
        assert pat.put(f"{API}/patient/symptoms", json={**base, "entry_date": fut}).status_code == 400
        assert pat.put(f"{API}/patient/symptoms", json={**base, "notes": "x" * 501}).status_code == 400

    def test_delete(self, pat):
        r = pat.put(f"{API}/patient/symptoms", json={"entry_date": D2, "mood": "good", "scores": {}, "notes": "TEST_del"})
        assert r.status_code == 200
        eid = r.json()["id"]
        assert pat.delete(f"{API}/patient/symptoms/{eid}").status_code == 200
        assert pat.delete(f"{API}/patient/symptoms/{eid}").status_code == 404
        assert not any(e["id"] == eid for e in pat.get(f"{API}/patient/symptoms?days=730").json())


# --- RBAC ---
class TestRBAC:
    def test_patient_forbidden_on_physician(self, pat, pid):
        for path in ("/physician/dashboard", "/physician/alerts", f"/physician/patients/{pid}/targets",
                     f"/physician/patients/{pid}/symptoms"):
            assert pat.get(f"{API}{path}").status_code == 403, path

    def test_physician_forbidden_on_patient_symptoms(self, phys):
        assert phys.get(f"{API}/patient/symptoms").status_code == 403

    def test_anonymous_401(self, pid):
        for path in ("/physician/dashboard", "/physician/alerts", "/patient/symptoms"):
            assert requests.get(f"{API}{path}").status_code == 401, path
        assert requests.put(f"{API}/patient/symptoms", json={}).status_code == 401
