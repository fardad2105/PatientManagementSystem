# ThyroCare Phase 1 regression tests: auth, RBAC, admin workflows, physician scoping, patient profile, security
import os
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = ("gillianarchuleta90119@outlook.com", "ThyroAdmin#2026")
PHYS = ("dr.sample@demo.thyrocare.app", "Physician@123")
PAT = ("patient.sample@demo.thyrocare.app", "Patient@123")
PEND = ("pending.sample@demo.thyrocare.app", "Pending@123")


def login(email, pw):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": pw})
    return s, r


def uniq():
    return uuid.uuid4().hex[:8]


@pytest.fixture(scope="module")
def admin():
    s, r = login(*ADMIN)
    if r.status_code != 200:
        pytest.skip(f"admin login failed {r.status_code}")
    return s


@pytest.fixture(scope="module")
def phys():
    s, r = login(*PHYS)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def pat():
    s, r = login(*PAT)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def created_ids():
    return []


@pytest.fixture(scope="module", autouse=True)
def cleanup(created_ids):
    yield
    s, r = login(*ADMIN)
    if r.status_code != 200:
        return
    # No delete-user endpoint exists: disable created test users instead
    for uid in created_ids:
        s.patch(f"{API}/admin/users/{uid}/status", json={"status": "disabled"})


def register(name_suffix=""):
    s = requests.Session()
    email = f"test_{uniq()}@demo.thyrocare.app"
    r = s.post(f"{API}/auth/register", json={"name": f"TEST_user{name_suffix}", "email": email, "password": "TestPass@123"})
    return s, r, email


# --- Auth basics
class TestAuth:
    def test_health(self):
        assert requests.get(f"{API}/health").json()["status"] == "ok"

    @pytest.mark.parametrize("cred,role", [(ADMIN, "admin"), (PHYS, "physician"), (PAT, "patient"), (PEND, "patient")])
    def test_login_roles_and_cookies(self, cred, role):
        s, r = login(*cred)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["role"] == role and "password_hash" not in d and "_id" not in d
        sc = r.headers.get("set-cookie", "").lower()
        assert "access_token" in sc and "httponly" in sc and "refresh_token" in sc
        me = s.get(f"{API}/auth/me")
        assert me.status_code == 200 and me.json()["email"] == cred[0]

    def test_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": f"test_wp_{uniq()}@demo.thyrocare.app", "password": "x"})
        assert r.status_code == 401
        assert "اشتباه" in r.json()["detail"]

    def test_refresh_and_logout(self):
        s, _ = login(*PAT)
        assert s.post(f"{API}/auth/refresh").status_code == 200
        assert s.post(f"{API}/auth/logout").status_code == 200
        assert s.get(f"{API}/auth/me").status_code == 401

    def test_brute_force_lockout(self):
        email = f"test_lock_{uniq()}@demo.thyrocare.app"
        codes = [requests.post(f"{API}/auth/login", json={"email": email, "password": "bad"}).status_code for _ in range(6)]
        assert codes[:5] == [401] * 5, codes
        assert codes[5] == 429, codes

    def test_bcrypt_hash_format(self):
        # Java backend: PostgreSQL 'thyrocare' (Spring BCrypt emits $2a$, compatible with $2b$)
        import subprocess
        out = subprocess.run(["su", "postgres", "-c", f"psql -d thyrocare -tAc \"select password_hash from users where email='{ADMIN[0]}'\""],
                             capture_output=True, text=True).stdout.strip()
        assert out.startswith("$2a$") or out.startswith("$2b$"), out


# --- Registration / pending / mass assignment
class TestRegistration:
    def test_register_pending_and_mass_assignment(self, created_ids):
        s = requests.Session()
        email = f"test_{uniq()}@demo.thyrocare.app"
        r = s.post(f"{API}/auth/register", json={"name": "TEST_mass", "email": email, "password": "TestPass@123",
                                                  "role": "admin", "status": "active"})
        assert r.status_code == 200, r.text
        d = r.json()
        created_ids.append(d["id"])
        assert d["role"] == "patient" and d["status"] == "pending"
        assert s.get(f"{API}/patient/dashboard").status_code == 403
        assert s.get(f"{API}/admin/users").status_code == 403

    def test_duplicate_register(self):
        r = requests.post(f"{API}/auth/register", json={"name": "TEST_dup", "email": PAT[0], "password": "TestPass@123"})
        assert r.status_code == 400

    def test_register_validation(self):
        r = requests.post(f"{API}/auth/register", json={"name": "T", "email": "bad", "password": "123"})
        assert r.status_code == 422


# --- Admin workflows
class TestAdmin:
    def test_stats_and_users(self, admin):
        st = admin.get(f"{API}/admin/stats").json()
        assert {"patients_active", "patients_pending", "physicians_active", "assignments"} <= set(st)
        users = admin.get(f"{API}/admin/users", params={"status": "pending"}).json()
        assert all(u["status"] == "pending" for u in users)

    def test_approve_then_access(self, admin, created_ids):
        s, r, email = register("_approve")
        uid = r.json()["id"]
        created_ids.append(uid)
        a = admin.patch(f"{API}/admin/users/{uid}/status", json={"status": "active"})
        assert a.status_code == 200 and a.json()["status"] == "active"
        d = s.get(f"{API}/patient/dashboard")
        assert d.status_code == 200 and "completeness" in d.json()

    def test_reject_blocks_login(self, admin, created_ids):
        s, r, email = register("_reject")
        uid = r.json()["id"]
        created_ids.append(uid)
        assert admin.patch(f"{API}/admin/users/{uid}/status", json={"status": "rejected"}).status_code == 200
        _, lr = login(email, "TestPass@123")
        assert lr.status_code == 403
        assert s.get(f"{API}/auth/me").status_code == 401

    def test_disable_immediate_and_reset_password(self, admin, created_ids):
        s, r, email = register("_disable")
        uid = r.json()["id"]
        created_ids.append(uid)
        admin.patch(f"{API}/admin/users/{uid}/status", json={"status": "active"})
        assert s.get(f"{API}/auth/me").status_code == 200
        admin.patch(f"{API}/admin/users/{uid}/status", json={"status": "disabled"})
        assert s.get(f"{API}/auth/me").status_code == 401
        assert s.post(f"{API}/auth/refresh").status_code == 401
        admin.patch(f"{API}/admin/users/{uid}/status", json={"status": "active"})
        rp = admin.post(f"{API}/admin/users/{uid}/reset-password", json={"new_password": "NewPass@456"})
        assert rp.status_code == 200
        assert login(email, "NewPass@456")[1].status_code == 200
        assert login(email, "TestPass@123")[1].status_code == 401

    def test_admin_cannot_change_admin(self, admin):
        me = admin.get(f"{API}/auth/me").json()
        assert admin.patch(f"{API}/admin/users/{me['id']}/status", json={"status": "disabled"}).status_code == 403
        assert admin.post(f"{API}/admin/users/{me['id']}/reset-password", json={"new_password": "Whatever@123"}).status_code == 403

    def test_create_physician_and_dup(self, admin, created_ids):
        email = f"test_doc_{uniq()}@demo.thyrocare.app"
        r = admin.post(f"{API}/admin/physicians", json={"name": "TEST_doc", "email": email, "password": "DocPass@123"})
        assert r.status_code == 200, r.text
        d = r.json()
        created_ids.append(d["id"])
        assert d["role"] == "physician" and d["status"] == "active"
        assert login(email, "DocPass@123")[1].status_code == 200
        assert admin.post(f"{API}/admin/physicians", json={"name": "TEST_doc", "email": email, "password": "DocPass@123"}).status_code == 400

    def test_audit_logs(self, admin):
        logs = admin.get(f"{API}/admin/audit-logs", params={"limit": 5}).json()
        assert isinstance(logs, list) and len(logs) <= 5 and all("_id" not in l for l in logs)


# --- Assignment + physician scoping
class TestAssignments:
    def test_assignment_flow_and_scoping(self, admin, created_ids):
        email = f"test_doc_{uniq()}@demo.thyrocare.app"
        doc = admin.post(f"{API}/admin/physicians", json={"name": "TEST_doc2", "email": email, "password": "DocPass@123"}).json()
        created_ids.append(doc["id"])
        s, r, pemail = register("_assign")
        pid = r.json()["id"]
        created_ids.append(pid)
        # pending patient cannot be assigned
        assert admin.post(f"{API}/admin/assignments", json={"patient_id": pid, "physician_id": doc["id"]}).status_code == 400
        admin.patch(f"{API}/admin/users/{pid}/status", json={"status": "active"})
        ds, _ = login(email, "DocPass@123")
        assert ds.get(f"{API}/physician/patients").json() == []
        assert ds.get(f"{API}/physician/patients/{pid}").status_code == 404
        a = admin.post(f"{API}/admin/assignments", json={"patient_id": pid, "physician_id": doc["id"]})
        assert a.status_code == 200
        aid = a.json()["id"]
        assert admin.post(f"{API}/admin/assignments", json={"patient_id": pid, "physician_id": doc["id"]}).status_code == 400
        lst = ds.get(f"{API}/physician/patients").json()
        assert [p["id"] for p in lst] == [pid]
        det = ds.get(f"{API}/physician/patients/{pid}")
        assert det.status_code == 200 and det.json()["patient"]["id"] == pid
        # care team visible to patient
        team = s.get(f"{API}/patient/dashboard").json()["care_team"]
        assert any(t["id"] == doc["id"] for t in team)
        assert admin.delete(f"{API}/admin/assignments/{aid}").status_code == 200
        assert ds.get(f"{API}/physician/patients/{pid}").status_code == 404
        assert admin.delete(f"{API}/admin/assignments/{aid}").status_code == 404

    def test_demo_physician_sees_demo_patient(self, phys, pat):
        pid = pat.get(f"{API}/auth/me").json()["id"]
        ids = [p["id"] for p in phys.get(f"{API}/physician/patients").json()]
        assert pid in ids
        assert phys.get(f"{API}/physician/patients/{uuid.uuid4()}").status_code == 404
        assert phys.get(f"{API}/physician/patients/not-an-id").status_code == 404


# --- RBAC matrix
class TestRBAC:
    def test_patient_forbidden(self, pat):
        assert pat.get(f"{API}/admin/users").status_code == 403
        assert pat.get(f"{API}/physician/patients").status_code == 403

    def test_physician_forbidden(self, phys):
        assert phys.get(f"{API}/admin/stats").status_code == 403
        assert phys.get(f"{API}/patient/profile").status_code == 403
        assert phys.get(f"{API}/patient/dashboard").status_code == 403

    def test_admin_forbidden(self, admin, pat):
        pid = pat.get(f"{API}/auth/me").json()["id"]
        assert admin.get(f"{API}/patient/profile").status_code == 403
        assert admin.get(f"{API}/physician/patients/{pid}").status_code == 403

    def test_unauthenticated(self):
        assert requests.get(f"{API}/patient/dashboard").status_code == 401
        assert requests.get(f"{API}/admin/users").status_code == 401


# --- Patient profile + validation (uses a fresh TEST_ patient; demo data untouched)
class TestProfile:
    def test_profile_save_and_completeness(self, admin, created_ids):
        s, r, email = register("_profile")
        uid = r.json()["id"]
        created_ids.append(uid)
        admin.patch(f"{API}/admin/users/{uid}/status", json={"status": "active"})
        assert s.get(f"{API}/patient/dashboard").json()["completeness"] == 0
        personal = {"first_name": "TEST_a", "last_name": "b", "national_id": "0012345678", "birth_date": "1990-01-01",
                    "gender": "female", "phone": "09121112233", "city": "x", "emergency_contact_name": "c",
                    "emergency_contact_phone": "09121112234"}
        p = s.put(f"{API}/patient/profile/personal", json=personal)
        assert p.status_code == 200 and p.json()["national_id"] == "0012345678"
        medical = {"cancer_type": "papillary", "diagnosis_date": "2023-01-01", "surgery_date": "2023-02-01",
                   "surgery_type": "total", "rai_received": "yes", "rai_sessions": 2, "staging_text": "TEST"}
        m = s.put(f"{API}/patient/profile/medical", json=medical)
        assert m.status_code == 200 and m.json()["cancer_type"] == "papillary"
        dash = s.get(f"{API}/patient/dashboard").json()
        assert dash["completeness"] == 100
        assert dash["profile"]["medical"]["surgery_date"] == "2023-02-01"
        # validation
        assert s.put(f"{API}/patient/profile/personal", json={**personal, "national_id": "123"}).status_code == 422
        assert s.put(f"{API}/patient/profile/personal", json={**personal, "birth_date": "1990/01/01"}).status_code == 422
        assert s.put(f"{API}/patient/profile/medical", json={**medical, "cancer_type": "bogus"}).status_code == 422
        # change password
        assert s.post(f"{API}/auth/change-password", json={"current_password": "wrong", "new_password": "Another@123"}).status_code == 400
        assert s.post(f"{API}/auth/change-password", json={"current_password": "TestPass@123", "new_password": "Another@123"}).status_code == 200
        assert login(email, "Another@123")[1].status_code == 200


# --- CSRF origin check
class TestCSRF:
    def test_foreign_origin_blocked(self):
        s, _ = login(*PAT)
        r = s.put(f"{API}/patient/profile/personal", json={}, headers={"Origin": "https://evil.example.com"})
        assert r.status_code == 403
        r2 = s.post(f"{API}/auth/logout", headers={"Origin": BASE_URL})
        assert r2.status_code == 200
