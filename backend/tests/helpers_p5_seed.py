# Helper: create (or delete) a TEST_ patient for Phase 5 UI tests. Usage: python helpers_p5_seed.py create|delete <id>
import os
import sys
import uuid
import requests

API = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") + "/api"
a = requests.Session()
assert a.post(f"{API}/auth/login", json={"email": "gillianarchuleta90119@outlook.com", "password": "ThyroAdmin#2026"}).status_code == 200
if sys.argv[1] == "create":
    email = f"test_ui5_{uuid.uuid4().hex[:6]}@example.com"
    r = requests.post(f"{API}/auth/register", json={"name": "TEST_UI Patient", "email": email, "password": "TestPass@123"})
    assert r.status_code == 200, r.text
    uid = [u for u in a.get(f"{API}/admin/users", params={"q": email}).json() if u["email"] == email][0]["id"]
    a.patch(f"{API}/admin/users/{uid}/status", json={"status": "active"})
    print(uid, email)
else:
    print(a.delete(f"{API}/admin/users/{sys.argv[2]}").status_code)
