import os, requests
API = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") + "/api"
a = requests.Session()
a.post(f"{API}/auth/login", json={"email": "gillianarchuleta90119@outlook.com", "password": "ThyroAdmin#2026"})
users = a.get(f"{API}/admin/users").json()
for u in users:
    if u["email"].startswith("test_") and u["email"].endswith("@demo.thyrocare.app") and u["status"] != "disabled" and u["id"] in ("6aeb20fcc433813025ad8d6b", "6aeb2105c433813025ad8d72"):
        print("disable", u["email"], a.patch(f"{API}/admin/users/{u['id']}/status", json={"status": "disabled"}).status_code)
demo = {u["email"]: u for u in users if "sample@demo" in u["email"]}
for e, u in demo.items():
    print(e, u["status"])
pid = demo["patient.sample@demo.thyrocare.app"]["id"]
print("demo patient assigned:", any(x["patient_id"] == pid for x in a.get(f"{API}/admin/assignments").json()))
for e, p in [("patient.sample@demo.thyrocare.app", "Patient@123"), ("dr.sample@demo.thyrocare.app", "Physician@123"), ("pending.sample@demo.thyrocare.app", "Pending@123")]:
    print(e, requests.post(f"{API}/auth/login", json={"email": e, "password": p}).status_code)
