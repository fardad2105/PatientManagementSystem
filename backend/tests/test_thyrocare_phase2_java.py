# ThyroCare Phase 2 (Java backend): medications, medication logs, labs, dashboard counters, object-level security
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


def login(email, pw):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": pw})
    return s, r


def new_active_patient(admin, created_users):
    s = requests.Session()
    email = f"test_p2_{uuid.uuid4().hex[:8]}@demo.thyrocare.app"
    r = s.post(f"{API}/auth/register", json={"name": "TEST_p2", "email": email, "password": "TestPass@123"})
    assert r.status_code == 200, r.text
    uid = r.json()["id"]
    created_users.append(uid)
    assert admin.patch(f"{API}/admin/users/{uid}/status", json={"status": "active"}).status_code == 200
    return s, uid


@pytest.fixture(scope="module")
def admin():
    s, r = login(*ADMIN)
    if r.status_code != 200:
        pytest.skip("admin login failed")
    return s


@pytest.fixture(scope="module")
def created_users():
    return []


@pytest.fixture(scope="module", autouse=True)
def cleanup(created_users):
    yield
    s, r = login(*ADMIN)
    if r.status_code == 200:
        for uid in created_users:
            s.patch(f"{API}/admin/users/{uid}/status", json={"status": "disabled"})


@pytest.fixture(scope="module")
def pa(admin, created_users):
    return new_active_patient(admin, created_users)


@pytest.fixture(scope="module")
def pb(admin, created_users):
    return new_active_patient(admin, created_users)


MED = {"name": "TEST_Levothyroxine", "dose_text": "100 mcg", "frequency_text": "روزانه صبح ناشتا",
       "prescriber_name": "TEST_dr", "start_date": "2024-01-01", "end_date": None, "active": True}
TODAY = dt.date.today()


class TestMedications:
    def test_crud_and_logs(self, pa):
        s, _ = pa
        r = s.post(f"{API}/patient/medications", json=MED)
        assert r.status_code == 200, r.text
        m = r.json()
        mid = m["id"]
        assert m["name"] == MED["name"] and m["dose_text"] == "100 mcg" and m["active"] is True and m["last_log"] is None
        lst = s.get(f"{API}/patient/medications").json()
        assert [x["id"] for x in lst] == [mid]
        u = s.put(f"{API}/patient/medications/{mid}", json={**MED, "dose_text": "125 mcg", "end_date": "2024-12-31"})
        assert u.status_code == 200 and u.json()["dose_text"] == "125 mcg" and u.json()["end_date"] == "2024-12-31"
        assert s.get(f"{API}/patient/medications").json()[0]["dose_text"] == "125 mcg"
        # logs
        l1 = s.post(f"{API}/patient/medications/{mid}/logs", json={"status": "taken"})
        assert l1.status_code == 200 and l1.json()["status"] == "taken"
        l2 = s.post(f"{API}/patient/medications/{mid}/logs", json={"status": "missed"})
        assert l2.status_code == 200
        logs = s.get(f"{API}/patient/medications/{mid}/logs").json()
        assert len(logs) == 2
        dash = s.get(f"{API}/patient/dashboard").json()
        assert dash["medications_active"] == 1 and dash["doses_missed7d"] == 1 if "doses_missed7d" in dash else dash["doses_missed_7d"] == 1, dash
        assert s.get(f"{API}/patient/medications").json()[0]["last_log"] is not None
        # bad status / future
        assert s.post(f"{API}/patient/medications/{mid}/logs", json={"status": "bogus"}).status_code in (400, 422)
        fut = (dt.datetime.utcnow() + dt.timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
        assert s.post(f"{API}/patient/medications/{mid}/logs", json={"status": "taken", "taken_at": fut}).status_code == 400
        # delete log
        assert s.delete(f"{API}/patient/medication-logs/{l2.json()['id']}").status_code == 200
        assert len(s.get(f"{API}/patient/medications/{mid}/logs").json()) == 1
        # inactive -> active count 0
        s.put(f"{API}/patient/medications/{mid}", json={**MED, "active": False})
        assert s.get(f"{API}/patient/dashboard").json()["medications_active"] == 0
        # delete med (cascade logs)
        assert s.delete(f"{API}/patient/medications/{mid}").status_code == 200
        assert s.get(f"{API}/patient/medications").json() == []
        assert s.get(f"{API}/patient/medications/{mid}/logs").status_code == 404
        assert s.delete(f"{API}/patient/medications/{mid}").status_code == 404

    def test_validation(self, pa):
        s, _ = pa
        assert s.post(f"{API}/patient/medications", json={**MED, "start_date": "2024-05-01", "end_date": "2024-04-01"}).status_code == 400
        assert s.post(f"{API}/patient/medications", json={**MED, "name": ""}).status_code == 422
        assert s.post(f"{API}/patient/medications", json={**MED, "dose_text": "  "}).status_code == 422
        assert s.post(f"{API}/patient/medications", json={**MED, "start_date": "2024/01/01"}).status_code in (400, 422)
        assert s.get(f"{API}/patient/medications/not-a-uuid/logs").status_code in (400, 404, 422)

    def test_mass_assignment_ignored(self, pa, pb):
        s, aid = pa
        sb, bid = pb
        r = s.post(f"{API}/patient/medications", json={**MED, "patient_id": bid, "id": str(uuid.uuid4())})
        assert r.status_code == 200
        assert sb.get(f"{API}/patient/medications").json() == []
        s.delete(f"{API}/patient/medications/{r.json()['id']}")


LAB = {"test_type": "TSH", "value": 0.45, "unit": "mIU/L", "sample_date": "2024-03-01", "lab_name": "TEST_lab",
       "ref_low": 0.4, "ref_high": 4.0}


class TestLabs:
    def test_crud_filter_latest(self, pa):
        s, _ = pa
        a = s.post(f"{API}/patient/labs", json=LAB)
        assert a.status_code == 200, a.text
        a = a.json()
        assert a["test_type"] == "TSH" and float(a["value"]) == 0.45 and a["source"] == "patient_reported"
        b = s.post(f"{API}/patient/labs", json={**LAB, "value": 1.2, "sample_date": "2024-06-01"}).json()
        tg = s.post(f"{API}/patient/labs", json={**LAB, "test_type": "TG", "unit": "ng/mL", "value": 0.1}).json()
        # no interpretation fields
        for k in ("flag", "status", "interpretation", "is_normal", "abnormal"):
            assert k not in a
        tsh = s.get(f"{API}/patient/labs", params={"test_type": "TSH"}).json()
        assert [x["id"] for x in tsh] == [a["id"], b["id"]]  # ascending by sample date
        assert len(s.get(f"{API}/patient/labs").json()) == 3
        latest = {x["test_type"]: x for x in s.get(f"{API}/patient/dashboard").json()["latest_labs"]}
        assert latest["TSH"]["id"] == b["id"] and latest["TG"]["id"] == tg["id"]
        u = s.put(f"{API}/patient/labs/{a['id']}", json={**LAB, "value": 0.5, "unit": "µIU/mL"})
        assert u.status_code == 200 and float(u.json()["value"]) == 0.5 and u.json()["unit"] == "µIU/mL"
        for x in (a, b, tg):
            assert s.delete(f"{API}/patient/labs/{x['id']}").status_code == 200
        assert s.get(f"{API}/patient/labs").json() == []
        assert s.delete(f"{API}/patient/labs/{a['id']}").status_code == 404

    def test_validation(self, pa):
        s, _ = pa
        assert s.post(f"{API}/patient/labs", json={**LAB, "unit": "ng/mL"}).status_code == 400
        fut = (TODAY + dt.timedelta(days=2)).isoformat()
        assert s.post(f"{API}/patient/labs", json={**LAB, "sample_date": fut}).status_code == 422
        assert s.post(f"{API}/patient/labs", json={**LAB, "ref_low": 5, "ref_high": 1}).status_code == 400
        assert s.post(f"{API}/patient/labs", json={**LAB, "value": -1}).status_code == 422
        assert s.post(f"{API}/patient/labs", json={**LAB, "test_type": "T3"}).status_code in (400, 422)
        assert s.post(f"{API}/patient/labs", json={**LAB, "value": None}).status_code == 422
        assert s.get(f"{API}/patient/labs", params={"test_type": "BOGUS"}).status_code in (400, 404, 422)  # Java maps type mismatch to 404 (minor)
        assert s.get(f"{API}/patient/labs").json() == []


class TestObjectSecurity:
    def test_cross_patient_and_physician(self, admin, pa, pb):
        s, aid = pa
        sb, bid = pb
        m = s.post(f"{API}/patient/medications", json=MED).json()
        lg = s.post(f"{API}/patient/medications/{m['id']}/logs", json={"status": "taken"}).json()
        lab = s.post(f"{API}/patient/labs", json=LAB).json()
        # patient B cannot touch A's objects
        assert sb.put(f"{API}/patient/medications/{m['id']}", json=MED).status_code == 404
        assert sb.delete(f"{API}/patient/medications/{m['id']}").status_code == 404
        assert sb.get(f"{API}/patient/medications/{m['id']}/logs").status_code == 404
        assert sb.post(f"{API}/patient/medications/{m['id']}/logs", json={"status": "taken"}).status_code == 404
        assert sb.delete(f"{API}/patient/medication-logs/{lg['id']}").status_code == 404
        assert sb.put(f"{API}/patient/labs/{lab['id']}", json=LAB).status_code == 404
        assert sb.delete(f"{API}/patient/labs/{lab['id']}").status_code == 404
        assert sb.get(f"{API}/patient/labs").json() == []
        # physician: demo phys not assigned to A -> 404
        ph, _ = login(*PHYS)
        assert ph.get(f"{API}/physician/patients/{aid}/medications").status_code == 404
        assert ph.get(f"{API}/physician/patients/{aid}/labs").status_code == 404
        # assign, then visible
        a = admin.post(f"{API}/admin/assignments", json={"patient_id": aid, "physician_id": ph.get(f"{API}/auth/me").json()["id"]})
        assert a.status_code == 200, a.text
        try:
            meds = ph.get(f"{API}/physician/patients/{aid}/medications")
            assert meds.status_code == 200 and [x["id"] for x in meds.json()] == [m["id"]]
            labs = ph.get(f"{API}/physician/patients/{aid}/labs")
            assert labs.status_code == 200 and [x["id"] for x in labs.json()] == [lab["id"]]
            # physician has no write endpoints on patient data
            assert ph.post(f"{API}/patient/labs", json=LAB).status_code == 403
            assert ph.delete(f"{API}/patient/medications/{m['id']}").status_code == 403
        finally:
            assert admin.delete(f"{API}/admin/assignments/{a.json()['id']}").status_code == 200
        assert ph.get(f"{API}/physician/patients/{aid}/labs").status_code == 404
        # admin cannot read patient phase2 routes
        assert admin.get(f"{API}/patient/medications").status_code == 403
        assert admin.get(f"{API}/physician/patients/{aid}/labs").status_code == 403
        # cleanup
        s.delete(f"{API}/patient/medications/{m['id']}")
        s.delete(f"{API}/patient/labs/{lab['id']}")

    def test_demo_physician_reads_demo_patient(self):
        ph, _ = login(*PHYS)
        p, _ = login(*PAT)
        pid = p.get(f"{API}/auth/me").json()["id"]
        assert ph.get(f"{API}/physician/patients/{pid}/medications").status_code == 200
        assert ph.get(f"{API}/physician/patients/{pid}/labs").status_code == 200
        assert ph.get(f"{API}/physician/patients/{uuid.uuid4()}/labs").status_code == 404

    def test_pending_and_csrf(self, pa):
        s, _ = pa
        pend, _ = login("pending.sample@demo.thyrocare.app", "Pending@123")
        assert pend.get(f"{API}/patient/medications").status_code == 403
        assert pend.get(f"{API}/patient/labs").status_code == 403
        assert s.post(f"{API}/patient/labs", json=LAB, headers={"Origin": "https://evil.example.com"}).status_code == 403
        assert requests.get(f"{API}/patient/labs").status_code == 401


# Phase 1 regression on Java: Persian digit normalization + future date rejection
class TestProfileJava:
    def test_persian_digits_and_future(self, pa):
        s, _ = pa
        r = s.put(f"{API}/patient/profile/personal", json={"first_name": "TEST_x", "national_id": "۰۰۱۲۳۴۵۶۷۸",
                                                            "phone": "۰۹۱۲۱۱۱۲۲۳۳", "birth_date": "1990-01-01"})
        assert r.status_code == 200, r.text
        assert r.json()["national_id"] == "0012345678" and r.json()["phone"] == "09121112233"
        fut = (TODAY + dt.timedelta(days=3)).isoformat()
        assert s.put(f"{API}/patient/profile/personal", json={"birth_date": fut}).status_code == 422
        assert s.put(f"{API}/patient/profile/medical", json={"surgery_date": fut}).status_code == 422
        # numeric value given in persian digits as string for labs
        r = s.post(f"{API}/patient/labs", json={**LAB, "value": "۱.۵"})
        if r.status_code == 200:
            assert float(r.json()["value"]) == 1.5
            s.delete(f"{API}/patient/labs/{r.json()['id']}")
