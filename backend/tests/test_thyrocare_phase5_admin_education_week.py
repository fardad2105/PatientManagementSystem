# ThyroCare Phase 5 (Java backend): admin dashboard, user edit/delete, education CRUD, weekly medication view, audit fields
import os
import uuid
import datetime as dt
from zoneinfo import ZoneInfo

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN = ("gillianarchuleta90119@outlook.com", "ThyroAdmin#2026")
PHYS = ("dr.sample@demo.thyrocare.app", "Physician@123")
PAT = ("patient.sample@demo.thyrocare.app", "Patient@123")
TZ = ZoneInfo("Asia/Tehran")


def login(email, pw):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": pw})
    return s, r


@pytest.fixture(scope="module")
def admin():
    s, r = login(*ADMIN)
    if r.status_code != 200:
        pytest.skip("admin login failed")
    return s


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
def created():
    d = {"users": [], "edu": []}
    yield d
    s, r = login(*ADMIN)
    for e in d["edu"]:
        s.delete(f"{API}/admin/education/{e}")
    for u in d["users"]:
        s.delete(f"{API}/admin/users/{u}")


def new_active_patient(admin, created):
    email = f"test_p5_{uuid.uuid4().hex[:8]}@example.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"name": "TEST_p5", "email": email, "password": "TestPass@123"})
    assert r.status_code == 200, r.text
    uid = [u for u in admin.get(f"{API}/admin/users", params={"q": email}).json() if u["email"] == email][0]["id"]
    created["users"].append(uid)
    assert admin.patch(f"{API}/admin/users/{uid}/status", json={"status": "active"}).status_code == 200
    s2, r2 = login(email, "TestPass@123")
    assert r2.status_code == 200, r2.text
    return s2, uid, email


# ---------- admin dashboard ----------
class TestAdminDashboard:
    def test_dashboard_shape(self, admin):
        r = admin.get(f"{API}/admin/dashboard")
        assert r.status_code == 200, r.text
        d = r.json()
        print(list(d.keys()))
        assert isinstance(d.get("recent_activity", d.get("recent")), list)
        regs = d.get("registrations") or d.get("registrations_daily")
        logins = d.get("logins") or d.get("logins_daily")
        assert regs is not None and len(regs) == 180
        assert logins is not None and len(logins) == 14
        assert d["database_healthy"] is True

    def test_dashboard_rbac(self, phys, pat):
        assert phys.get(f"{API}/admin/dashboard").status_code == 403
        assert pat.get(f"{API}/admin/dashboard").status_code == 403
        assert requests.get(f"{API}/admin/dashboard").status_code == 401

    def test_last_login_updated(self, admin):
        before = dt.datetime.now(dt.timezone.utc) - dt.timedelta(seconds=30)
        login(*PHYS)
        u = [x for x in admin.get(f"{API}/admin/users").json() if x["email"] == PHYS[0]][0]
        assert u.get("last_login_at"), u
        ts = dt.datetime.fromisoformat(u["last_login_at"].replace("Z", "+00:00"))
        assert ts >= before

    def test_audit_has_actor_and_ip(self, admin):
        logs = admin.get(f"{API}/admin/audit-logs", params={"limit": 20}).json()
        assert logs
        print(logs[0])
        assert any(l.get("actor_name") for l in logs)
        assert any(l.get("ip_address") for l in logs)


# ---------- admin user edit/delete ----------
class TestAdminUsers:
    def test_edit_user_persist(self, admin, created):
        _, uid, email = new_active_patient(admin, created)
        r = admin.patch(f"{API}/admin/users/{uid}", json={"name": "TEST_p5 edited", "phone": "09121234567", "specialty": "x"})
        assert r.status_code == 200, r.text
        assert r.json()["name"] == "TEST_p5 edited"
        u = [x for x in admin.get(f"{API}/admin/users", params={"q": email}).json() if x["id"] == uid][0]
        assert u["name"] == "TEST_p5 edited" and u["phone"] == "09121234567"
        assert u.get("specialty") in (None, "")  # specialty only for physicians

    def test_edit_validation(self, admin, created):
        uid = created["users"][0]
        assert admin.patch(f"{API}/admin/users/{uid}", json={"name": ""}).status_code in (400, 422)
        assert admin.patch(f"{API}/admin/users/{uid}", json={"name": "TEST ok", "phone": "abc"}).status_code in (400, 422)
        assert admin.patch(f"{API}/admin/users/{uuid.uuid4()}", json={"name": "TEST ok"}).status_code == 404

    def test_admin_cannot_be_deleted_or_disabled(self, admin):
        me = admin.get(f"{API}/auth/me").json()
        mid = me.get("id") or me.get("user", {}).get("id")
        assert admin.delete(f"{API}/admin/users/{mid}").status_code == 403
        assert admin.patch(f"{API}/admin/users/{mid}/status", json={"status": "disabled"}).status_code == 403

    def test_delete_patient_with_data(self, admin, created):
        s, uid, email = new_active_patient(admin, created)
        m = s.post(f"{API}/patient/medications", json={"name": "TEST_med", "dose_text": "50 mcg", "frequency_text": "daily",
                                                     "start_date": "2024-01-01", "active": True})
        assert m.status_code == 200, m.text
        assert s.post(f"{API}/patient/medications/{m.json()['id']}/logs", json={"status": "taken"}).status_code == 200
        r = admin.delete(f"{API}/admin/users/{uid}")
        assert r.status_code == 200, r.text
        assert not [x for x in admin.get(f"{API}/admin/users", params={"q": email}).json() if x["id"] == uid]
        assert admin.delete(f"{API}/admin/users/{uid}").status_code == 404
        created["users"].remove(uid)

    def test_user_endpoints_rbac(self, phys, created):
        uid = created["users"][0]
        assert phys.patch(f"{API}/admin/users/{uid}", json={"name": "hack"}).status_code == 403
        assert phys.delete(f"{API}/admin/users/{uid}").status_code == 403


# ---------- education content ----------
BASE_EDU = {"title": "TEST_edu article", "content_type": "article", "summary": "s", "body": "b",
            "media_url": None, "status": "draft", "reviewer_name": None}


class TestEducation:
    def test_crud(self, admin, created):
        r = admin.post(f"{API}/admin/education", json=BASE_EDU)
        assert r.status_code == 200, r.text
        e = r.json()
        created["edu"].append(e["id"])
        assert e["status"] == "draft" and e["title"] == BASE_EDU["title"]
        assert any(x["id"] == e["id"] for x in admin.get(f"{API}/admin/education").json())
        # publish without reviewer -> 400
        r = admin.put(f"{API}/admin/education/{e['id']}", json={**BASE_EDU, "status": "published"})
        assert r.status_code == 400, r.text
        r = admin.put(f"{API}/admin/education/{e['id']}", json={**BASE_EDU, "status": "published", "reviewer_name": "  "})
        assert r.status_code == 400
        r = admin.put(f"{API}/admin/education/{e['id']}", json={**BASE_EDU, "title": "TEST_edu pub", "status": "published",
                                                               "reviewer_name": "TEST_Dr R"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "published" and r.json()["reviewer_name"] == "TEST_Dr R"
        assert r.json().get("reviewed_at")
        got = [x for x in admin.get(f"{API}/admin/education").json() if x["id"] == e["id"]][0]
        assert got["title"] == "TEST_edu pub" and got["status"] == "published"
        assert admin.delete(f"{API}/admin/education/{e['id']}").status_code == 200
        assert not [x for x in admin.get(f"{API}/admin/education").json() if x["id"] == e["id"]]
        assert admin.delete(f"{API}/admin/education/{e['id']}").status_code == 404
        created["edu"].remove(e["id"])

    def test_validation(self, admin, created):
        assert admin.post(f"{API}/admin/education", json={**BASE_EDU, "status": "published"}).status_code == 400
        assert admin.post(f"{API}/admin/education", json={**BASE_EDU, "content_type": "podcast"}).status_code in (400, 422)
        assert admin.post(f"{API}/admin/education", json={**BASE_EDU, "title": ""}).status_code in (400, 422)
        assert admin.post(f"{API}/admin/education", json={**BASE_EDU, "media_url": "ftp://x"}).status_code in (400, 422)
        assert admin.post(f"{API}/admin/education", json={**BASE_EDU, "status": "archived"}).status_code in (400, 422)

    def test_empty_media_url_accepted(self, admin, created):
        r = admin.post(f"{API}/admin/education", json={**BASE_EDU, "media_url": ""})
        if r.status_code == 200:
            created["edu"].append(r.json()["id"])
        assert r.status_code == 200, f"empty media_url rejected: {r.status_code} {r.text}"

    def test_rbac(self, phys, pat):
        assert phys.get(f"{API}/admin/education").status_code == 403
        assert pat.post(f"{API}/admin/education", json=BASE_EDU).status_code == 403

    def test_dashboard_counts_content(self, admin, created):
        before = admin.get(f"{API}/admin/dashboard").json()
        r = admin.post(f"{API}/admin/education", json={**BASE_EDU, "status": "published", "reviewer_name": "TEST_R"})
        assert r.status_code == 200
        created["edu"].append(r.json()["id"])
        after = admin.get(f"{API}/admin/dashboard").json()
        print({k: (before[k], after[k]) for k in after if "content" in k})
        changed = [k for k in after if "content" in k and isinstance(after[k], int) and after[k] == before[k] + 1]
        assert len(changed) >= 2, changed


# ---------- weekly medication view ----------
class TestMedicationWeek:
    def test_week_flow(self, admin, created):
        s, uid, _ = new_active_patient(admin, created)
        today = dt.datetime.now(TZ).date()
        m = s.post(f"{API}/patient/medications", json={"name": "TEST_wk", "dose_text": "50", "frequency_text": "daily",
                                                     "start_date": (today - dt.timedelta(days=30)).isoformat(), "active": True})
        mid = m.json()["id"]
        w = s.get(f"{API}/patient/medications/week").json()
        print(w)
        start = dt.date.fromisoformat(w["week_start"])
        assert start.weekday() == 5  # Saturday
        assert w["week_end"] == (start + dt.timedelta(days=6)).isoformat()
        med = [x for x in w["medications"] if x["medication_id"] == mid][0]
        assert len(med["days"]) == 7
        for d in med["days"]:
            dd = dt.date.fromisoformat(d["date"])
            assert d["status"] == ("future" if dd > today else "none")
        assert w["adherence_percent"] == 0
        # log taken today at 08:30 local
        t = dt.datetime.combine(today, dt.time(8, 30), TZ)
        if t > dt.datetime.now(TZ):
            t = dt.datetime.now(TZ) - dt.timedelta(minutes=5)
        r = s.post(f"{API}/patient/medications/{mid}/logs", json={"status": "taken", "taken_at": t.isoformat()})
        assert r.status_code == 200, r.text
        w = s.get(f"{API}/patient/medications/week").json()
        med = [x for x in w["medications"] if x["medication_id"] == mid][0]
        tday = [d for d in med["days"] if d["date"] == today.isoformat()][0]
        assert tday["status"] == "taken" and tday["time"] == t.strftime("%H:%M"), tday
        # previous week missed log
        y = dt.datetime.combine(today - dt.timedelta(days=7), dt.time(9, 0), TZ)
        assert s.post(f"{API}/patient/medications/{mid}/logs", json={"status": "missed", "taken_at": y.isoformat()}).status_code == 200
        pw = s.get(f"{API}/patient/medications/week", params={"offset": -1}).json()
        assert pw["week_start"] == (start - dt.timedelta(days=7)).isoformat()
        med = [x for x in pw["medications"] if x["medication_id"] == mid][0]
        assert [d for d in med["days"] if d["date"] == y.date().isoformat()][0]["status"] == "missed"
        # positive offset clamps to current week
        assert s.get(f"{API}/patient/medications/week", params={"offset": 3}).json()["week_start"] == start.isoformat()
        # physician access: not assigned -> 404
        ps, _ = login(*PHYS)
        assert ps.get(f"{API}/physician/patients/{uid}/medications/week").status_code == 404

    def test_physician_week_assigned_and_rbac(self, phys, pat):
        pid = [p for p in phys.get(f"{API}/physician/patients").json() if p["email"] == PAT[0]][0]["id"]
        r = phys.get(f"{API}/physician/patients/{pid}/medications/week")
        assert r.status_code == 200, r.text
        assert len(r.json()["medications"]) >= 0 and "week_start" in r.json()
        assert pat.get(f"{API}/physician/patients/{pid}/medications/week").status_code == 403
        assert phys.get(f"{API}/patient/medications/week").status_code == 403
