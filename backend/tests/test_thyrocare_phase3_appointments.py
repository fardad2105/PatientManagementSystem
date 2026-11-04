# ThyroCare Phase 3 (Java backend): appointments CRUD/status/scope, reminders window, validation, object security, medication log custom taken_at
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


def iso(delta):
    return (dt.datetime.now(dt.timezone.utc) + delta).strftime("%Y-%m-%dT%H:%M:%SZ")


def new_active_patient(admin, created_users):
    s = requests.Session()
    email = f"test_p3_{uuid.uuid4().hex[:8]}@demo.thyrocare.app"
    r = s.post(f"{API}/auth/register", json={"name": "TEST_p3", "email": email, "password": "TestPass@123"})
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


def appt(**kw):
    base = {"title": "TEST_visit", "appointment_type": "visit", "scheduled_at": iso(dt.timedelta(hours=2)),
            "location": "TEST_clinic", "physician_name": "TEST_dr", "notes": "n", "remind_before_minutes": 1440}
    base.update(kw)
    return base


class TestAppointments:
    def test_crud_status_scope(self, pa):
        s, _ = pa
        r = s.post(f"{API}/patient/appointments", json=appt())
        assert r.status_code == 200, r.text
        a = r.json()
        aid = a["id"]
        assert a["title"] == "TEST_visit" and a["status"] == "scheduled" and a["remind_before_minutes"] == 1440
        assert a["reminder_at"] is not None
        assert [x["id"] for x in s.get(f"{API}/patient/appointments?scope=upcoming").json()] == [aid]
        assert s.get(f"{API}/patient/appointments?scope=past").json() == []
        # update
        u = s.put(f"{API}/patient/appointments/{aid}", json=appt(title="TEST_visit2", appointment_type="lab"))
        assert u.status_code == 200 and u.json()["title"] == "TEST_visit2" and u.json()["appointment_type"] == "lab"
        assert s.get(f"{API}/patient/appointments").json()[0]["title"] == "TEST_visit2"
        # status done -> past
        st = s.patch(f"{API}/patient/appointments/{aid}/status", json={"status": "done"})
        assert st.status_code == 200 and st.json()["status"] == "done"
        assert s.get(f"{API}/patient/appointments?scope=upcoming").json() == []
        assert [x["id"] for x in s.get(f"{API}/patient/appointments?scope=past").json()] == [aid]
        assert s.get(f"{API}/patient/reminders").json() == []
        # reopen
        assert s.patch(f"{API}/patient/appointments/{aid}/status", json={"status": "scheduled"}).json()["status"] == "scheduled"
        assert s.patch(f"{API}/patient/appointments/{aid}/status", json={"status": "bogus"}).status_code in (400, 422)
        # delete
        assert s.delete(f"{API}/patient/appointments/{aid}").status_code == 200
        assert s.get(f"{API}/patient/appointments").json() == []
        assert s.delete(f"{API}/patient/appointments/{aid}").status_code == 404

    def test_reminders_window(self, pa):
        s, _ = pa
        due = s.post(f"{API}/patient/appointments", json=appt(title="TEST_due")).json()
        far = s.post(f"{API}/patient/appointments", json=appt(title="TEST_far", scheduled_at=iso(dt.timedelta(days=5)),
                                                               remind_before_minutes=60)).json()
        none = s.post(f"{API}/patient/appointments", json=appt(title="TEST_none", remind_before_minutes=None)).json()
        past = s.post(f"{API}/patient/appointments", json=appt(title="TEST_past", scheduled_at=iso(-dt.timedelta(hours=1)))).json()
        cancelled = s.post(f"{API}/patient/appointments", json=appt(title="TEST_canc")).json()
        s.patch(f"{API}/patient/appointments/{cancelled['id']}/status", json={"status": "cancelled"})
        try:
            rem = s.get(f"{API}/patient/reminders")
            assert rem.status_code == 200
            assert [x["id"] for x in rem.json()] == [due["id"]], rem.json()
            dash = s.get(f"{API}/patient/dashboard").json()
            print("dashboard keys:", list(dash.keys()))
            past_ids = [x["id"] for x in s.get(f"{API}/patient/appointments?scope=past").json()]
            assert set(past_ids) == {past["id"], cancelled["id"]}
        finally:
            for x in (due, far, none, past, cancelled):
                s.delete(f"{API}/patient/appointments/{x['id']}")

    def test_validation(self, pa):
        s, _ = pa
        P = f"{API}/patient/appointments"
        assert s.post(P, json=appt(title="")).status_code == 422
        assert s.post(P, json=appt(title="   ")).status_code == 422
        b = appt(); b.pop("scheduled_at")
        assert s.post(P, json=b).status_code == 422
        assert s.post(P, json=appt(appointment_type="dentist")).status_code == 422
        assert s.post(P, json=appt(remind_before_minutes=20161)).status_code == 422
        assert s.post(P, json=appt(remind_before_minutes=-1)).status_code == 422
        assert s.post(P, json=appt(scheduled_at="not-a-date")).status_code in (400, 422)
        assert s.post(P, json=appt(title="x" * 121)).status_code == 422
        assert s.get(f"{API}/patient/appointments").json() == []

    def test_cross_patient_and_physician(self, admin, pa, pb):
        s, aid = pa
        sb, _ = pb
        a = s.post(f"{API}/patient/appointments", json=appt()).json()
        try:
            assert sb.put(f"{API}/patient/appointments/{a['id']}", json=appt()).status_code == 404
            assert sb.patch(f"{API}/patient/appointments/{a['id']}/status", json={"status": "done"}).status_code == 404
            assert sb.delete(f"{API}/patient/appointments/{a['id']}").status_code == 404
            assert sb.get(f"{API}/patient/appointments").json() == []
            assert sb.get(f"{API}/patient/reminders").json() == []
            ph, _ = login(*PHYS)
            assert ph.get(f"{API}/physician/patients/{aid}/appointments").status_code == 404
            asg = admin.post(f"{API}/admin/assignments", json={"patient_id": aid, "physician_id": ph.get(f"{API}/auth/me").json()["id"]})
            assert asg.status_code == 200, asg.text
            try:
                r = ph.get(f"{API}/physician/patients/{aid}/appointments")
                assert r.status_code == 200 and [x["id"] for x in r.json()] == [a["id"]]
                assert ph.post(f"{API}/patient/appointments", json=appt()).status_code == 403
            finally:
                admin.delete(f"{API}/admin/assignments/{asg.json()['id']}")
            assert ph.get(f"{API}/physician/patients/{aid}/appointments").status_code == 404
            assert admin.get(f"{API}/patient/appointments").status_code == 403
        finally:
            s.delete(f"{API}/patient/appointments/{a['id']}")

    def test_unauth(self):
        assert requests.get(f"{API}/patient/appointments").status_code == 401
        assert requests.get(f"{API}/patient/reminders").status_code == 401

    def test_demo_patient_seeded_reminder(self):
        s, r = login(*PAT)
        assert r.status_code == 200
        rem = s.get(f"{API}/patient/reminders").json()
        assert len(rem) >= 1, rem


class TestMedLogCustomTime:
    def test_custom_taken_at(self, pa):
        s, _ = pa
        m = s.post(f"{API}/patient/medications", json={"name": "TEST_Levo", "dose_text": "100 mcg", "frequency_text": "daily",
                                                        "start_date": "2024-01-01", "active": True}).json()
        try:
            t = iso(-dt.timedelta(days=2, hours=3))
            l = s.post(f"{API}/patient/medications/{m['id']}/logs", json={"status": "taken", "taken_at": t, "note": "TEST"})
            assert l.status_code == 200, l.text
            assert l.json()["taken_at"].startswith(t[:16])
            assert s.post(f"{API}/patient/medications/{m['id']}/logs", json={"status": "taken", "taken_at": iso(dt.timedelta(hours=1))}).status_code == 400
            q = s.post(f"{API}/patient/medications/{m['id']}/logs", json={"status": "missed"})
            assert q.status_code == 200
            logs = s.get(f"{API}/patient/medications/{m['id']}/logs").json()
            assert len(logs) == 2
            assert logs[0]["status"] == "missed"  # newest first
        finally:
            s.delete(f"{API}/patient/medications/{m['id']}")
