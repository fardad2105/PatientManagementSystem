# ThyroCare Phase 6 (Java backend): patient education library (published+reviewed only, view counting) and today-dose one-tap logging
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
    s, _ = login(*ADMIN)
    for e in d["edu"]:
        s.delete(f"{API}/admin/education/{e}")
    for u in d["users"]:
        s.delete(f"{API}/admin/users/{u}")


@pytest.fixture(scope="module")
def tpat(admin, created):
    """Fresh TEST patient (active) so dose logging doesn't touch demo data."""
    email = f"test_p6_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={"name": "TEST_p6", "email": email, "password": "TestPass@123"})
    assert r.status_code == 200, r.text
    uid = [u for u in admin.get(f"{API}/admin/users", params={"q": email}).json() if u["email"] == email][0]["id"]
    created["users"].append(uid)
    assert admin.patch(f"{API}/admin/users/{uid}/status", json={"status": "active"}).status_code == 200
    s, r2 = login(email, "TestPass@123")
    assert r2.status_code == 200, r2.text
    return s


@pytest.fixture(scope="module")
def edu(admin, created):
    base = {"summary": "TEST summary", "body": "TEST body", "media_url": None}
    pub = admin.post(f"{API}/admin/education", json={**base, "title": "TEST_p6 published", "content_type": "article",
                                                     "status": "published", "reviewer_name": "TEST_Dr Reviewer"})
    draft = admin.post(f"{API}/admin/education", json={**base, "title": "TEST_p6 draft", "content_type": "video",
                                                       "status": "draft", "reviewer_name": None})
    rev = admin.post(f"{API}/admin/education", json={**base, "title": "TEST_p6 inreview", "content_type": "infographic",
                                                     "status": "in_review", "reviewer_name": "TEST_Dr X"})
    for r in (pub, draft, rev):
        assert r.status_code == 200, r.text
        created["edu"].append(r.json()["id"])
    return {"pub": pub.json()["id"], "draft": draft.json()["id"], "rev": rev.json()["id"]}


# ---------- education library ----------
class TestLibrary:
    def test_list_only_published(self, tpat, edu):
        r = tpat.get(f"{API}/patient/education")
        assert r.status_code == 200, r.text
        items = r.json()
        ids = [i["id"] for i in items]
        assert edu["pub"] in ids
        assert edu["draft"] not in ids and edu["rev"] not in ids
        for i in items:
            assert i["reviewer_name"]
        me = [i for i in items if i["id"] == edu["pub"]][0]
        assert me["viewed"] is False and me["view_count"] == 0
        assert "body" not in me or me.get("body") is None
        print(list(me.keys()))

    def test_unread_and_open_counts_once(self, tpat, admin, edu):
        u0 = tpat.get(f"{API}/patient/education/unread-count").json()["unread"]
        n_pub = len(tpat.get(f"{API}/patient/education").json())
        assert u0 == n_pub
        r = tpat.get(f"{API}/patient/education/{edu['pub']}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["title"] == "TEST_p6 published" and d["body"] == "TEST body"
        assert d["reviewer_name"] == "TEST_Dr Reviewer" and d["view_count"] == 1
        r2 = tpat.get(f"{API}/patient/education/{edu['pub']}")
        assert r2.json()["view_count"] == 1
        assert tpat.get(f"{API}/patient/education/unread-count").json()["unread"] == u0 - 1
        it = [i for i in tpat.get(f"{API}/patient/education").json() if i["id"] == edu["pub"]][0]
        assert it["viewed"] is True and it["view_count"] == 1
        a = [x for x in admin.get(f"{API}/admin/education").json() if x["id"] == edu["pub"]][0]
        assert a["view_count"] == 1, a

    def test_second_patient_view_increments(self, pat, edu):
        r = pat.get(f"{API}/patient/education/{edu['pub']}")
        assert r.status_code == 200
        assert r.json()["view_count"] == 2

    def test_draft_inreview_404(self, tpat, edu):
        assert tpat.get(f"{API}/patient/education/{edu['draft']}").status_code == 404
        assert tpat.get(f"{API}/patient/education/{edu['rev']}").status_code == 404
        assert tpat.get(f"{API}/patient/education/{uuid.uuid4()}").status_code == 404

    def test_unpublish_hides(self, admin, tpat, edu):
        # move published back to draft -> hidden; then restore
        a = [x for x in admin.get(f"{API}/admin/education").json() if x["id"] == edu["pub"]][0]
        body = {k: a.get(k) for k in ("title", "content_type", "summary", "body", "media_url", "reviewer_name")}
        assert admin.put(f"{API}/admin/education/{edu['pub']}", json={**body, "status": "draft"}).status_code == 200
        assert tpat.get(f"{API}/patient/education/{edu['pub']}").status_code == 404
        assert edu["pub"] not in [i["id"] for i in tpat.get(f"{API}/patient/education").json()]
        r = admin.put(f"{API}/admin/education/{edu['pub']}", json={**body, "status": "published"})
        assert r.status_code == 200, r.text
        assert r.json()["view_count"] == 2

    def test_rbac(self, phys, admin):
        for s in (phys, admin):
            assert s.get(f"{API}/patient/education").status_code == 403
            assert s.get(f"{API}/patient/education/unread-count").status_code == 403
            assert s.get(f"{API}/patient/medications/today").status_code == 403
        assert requests.get(f"{API}/patient/education").status_code == 401


# ---------- today dose ----------
class TestTodayDose:
    def test_flow(self, tpat, pat):
        today = dt.datetime.now(TZ).date()
        assert tpat.get(f"{API}/patient/medications/today").json() == []
        mk = lambda name, **kw: tpat.post(f"{API}/patient/medications", json={
            "name": name, "dose_text": "100 mcg", "frequency_text": "daily",
            "start_date": (today - dt.timedelta(days=10)).isoformat(), "active": True, **kw}).json()["id"]
        m1, m2 = mk("TEST_levo"), mk("TEST_calc")
        inactive = mk("TEST_inactive", active=False)
        future = mk("TEST_future", start_date=(today + dt.timedelta(days=3)).isoformat())
        rows = tpat.get(f"{API}/patient/medications/today").json()
        ids = [r["medication_id"] for r in rows]
        print(rows)
        assert set(ids) == {m1, m2}, ids
        assert all(r["status"] is None for r in rows)
        # taken
        r = tpat.post(f"{API}/patient/medications/{m1}/today", json={"status": "taken"})
        assert r.status_code == 200, r.text
        row = [x for x in r.json() if x["medication_id"] == m1][0]
        assert row["status"] == "taken" and row["logged_at"]
        # duplicate -> 409
        r = tpat.post(f"{API}/patient/medications/{m1}/today", json={"status": "missed"})
        assert r.status_code == 409, r.text
        # missed
        r = tpat.post(f"{API}/patient/medications/{m2}/today", json={"status": "missed"})
        assert r.status_code == 200
        assert [x for x in r.json() if x["medication_id"] == m2][0]["status"] == "missed"
        # persisted
        rows = {x["medication_id"]: x for x in tpat.get(f"{API}/patient/medications/today").json()}
        assert rows[m1]["status"] == "taken" and rows[m2]["status"] == "missed"
        # week reflects today
        w = tpat.get(f"{API}/patient/medications/week").json()
        wm = {m["medication_id"]: m for m in w["medications"]}
        t1 = [d for d in wm[m1]["days"] if d["date"] == today.isoformat()][0]
        t2 = [d for d in wm[m2]["days"] if d["date"] == today.isoformat()][0]
        assert t1["status"] == "taken" and t2["status"] == "missed", (t1, t2)
        # validation
        assert tpat.post(f"{API}/patient/medications/{m1}/today", json={"status": "bogus"}).status_code in (400, 422)
        assert tpat.post(f"{API}/patient/medications/{m1}/today", json={}).status_code in (400, 422)
        assert tpat.post(f"{API}/patient/medications/{uuid.uuid4()}/today", json={"status": "taken"}).status_code == 404
        # inactive / future medication logging via today endpoint
        ri = tpat.post(f"{API}/patient/medications/{inactive}/today", json={"status": "taken"})
        rf = tpat.post(f"{API}/patient/medications/{future}/today", json={"status": "taken"})
        print("inactive today-log:", ri.status_code, "future today-log:", rf.status_code)
        # other patient's med -> 404
        demo_meds = pat.get(f"{API}/patient/medications").json()
        if demo_meds:
            assert tpat.post(f"{API}/patient/medications/{demo_meds[0]['id']}/today", json={"status": "taken"}).status_code == 404
        # deleting the log un-logs today
        logs = tpat.get(f"{API}/patient/medications/{m1}/logs").json()
        assert logs
        assert tpat.delete(f"{API}/patient/medication-logs/{logs[0]['id']}").status_code == 200
        rows = {x["medication_id"]: x for x in tpat.get(f"{API}/patient/medications/today").json()}
        assert rows[m1]["status"] is None
        assert ri.status_code in (400, 404, 409), f"inactive med accepted via /today: {ri.status_code}"
