# ThyroCare Phase 7 (Java backend): neck ultrasound CRUD, medical document upload/download (object storage), physician notes
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
TODAY = dt.datetime.now(ZoneInfo("Asia/Tehran")).date()
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PDF = b"%PDF-1.4\n%TEST\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


def login(email, pw):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": pw})
    return s, r


@pytest.fixture(scope="module")
def pat():
    s, r = login(*PAT)
    if r.status_code != 200:
        pytest.skip("patient login failed")
    return s


@pytest.fixture(scope="module")
def phys():
    s, r = login(*PHYS)
    if r.status_code != 200:
        pytest.skip("physician login failed")
    return s


@pytest.fixture(scope="module")
def pid(pat):
    return pat.get(f"{API}/auth/me").json()["id"]


@pytest.fixture(scope="module")
def created(pat, phys):
    d = {"docs": [], "us": [], "notes": [], "users": []}
    yield d
    for n in d["notes"]:
        phys.delete(f"{API}/physician/notes/{n}")
    for u in d["us"]:
        pat.delete(f"{API}/patient/ultrasounds/{u}")
    for x in d["docs"]:
        pat.delete(f"{API}/patient/documents/{x}")
    if d["users"]:
        a, _ = login(*ADMIN)
        for u in d["users"]:
            a.delete(f"{API}/admin/users/{u}")


def upload(s, name="t.png", data=PNG, ctype="image/png", category="lab", title=None, date=None):
    form = {"category": category, "title": title or f"TEST_{uuid.uuid4().hex[:5]}"}
    if date:
        form["document_date"] = date
    return s.post(f"{API}/patient/documents", files={"file": (name, data, ctype)}, data=form)


# --- documents ---
class TestDocuments:
    def test_upload_png_and_download(self, pat, created):
        r = upload(pat, date=str(TODAY))
        assert r.status_code == 200, r.text
        d = r.json()
        created["docs"].append(d["id"])
        assert d["content_type"] == "image/png" and d["size_bytes"] == len(PNG) and d["category"] == "lab"
        assert d["title"].startswith("TEST_")
        assert any(x["id"] == d["id"] for x in pat.get(f"{API}/patient/documents").json())
        f = pat.get(f"{API}/patient/documents/{d['id']}/file")
        assert f.status_code == 200 and f.content == PNG
        assert f.headers["content-type"].startswith("image/png")

    def test_upload_pdf(self, pat, created):
        r = upload(pat, name="r.pdf", data=PDF, ctype="application/pdf", category="report")
        assert r.status_code == 200, r.text
        created["docs"].append(r.json()["id"])
        assert r.json()["content_type"] == "application/pdf"

    def test_bad_signature_rejected(self, pat):
        r = upload(pat, name="fake.png", data=b"hello world this is text", ctype="image/png")
        assert r.status_code == 400

    def test_bad_category_and_future_date(self, pat):
        assert upload(pat, category="xxx").status_code == 400
        assert upload(pat, date=str(TODAY + dt.timedelta(days=3))).status_code == 400

    def test_too_large_413(self, pat):
        big = PNG + b"\x00" * (10 * 1024 * 1024 + 10)
        r = upload(pat, data=big)
        print("big status", r.status_code, r.text[:200])
        assert r.status_code == 413

    def test_soft_delete(self, pat):
        r = upload(pat)
        did = r.json()["id"]
        assert pat.delete(f"{API}/patient/documents/{did}").status_code == 200
        assert pat.get(f"{API}/patient/documents/{did}/file").status_code == 404
        assert not any(x["id"] == did for x in pat.get(f"{API}/patient/documents").json())

    def test_unauth(self):
        assert requests.get(f"{API}/patient/documents").status_code in (401, 403)


# --- ultrasounds ---
class TestUltrasounds:
    def payload(self, **kw):
        p = {"exam_date": str(TODAY - dt.timedelta(days=10)), "imaging_center": "TEST_Center", "radiologist_name": "TEST_Rad",
             "reason": "other", "reason_text": "TEST reason", "thyroid_bed_status": "finding", "residual_tissue": "unknown",
             "bed_finding": "yes", "lymph_node_status": "finding", "finding_location": "right_lateral",
             "finding_size_mm": 7.5, "descriptive_features": "TEST feat", "radiologist_conclusion": "TEST concl",
             "findings": [{"location": "central", "finding_type": "node", "length_mm": 5, "width_mm": 4.2, "height_mm": 3,
                           "description": "TEST f1"}]}
        p.update(kw)
        return p

    def test_crud(self, pat, created):
        doc = upload(pat).json()["id"]
        created["docs"].append(doc)
        r = pat.post(f"{API}/patient/ultrasounds", json=self.payload(report_document_id=doc))
        assert r.status_code == 200, r.text
        u = r.json()
        created["us"].append(u["id"])
        assert u["lymph_node_status"] == "finding" and float(u["finding_size_mm"]) == 7.5
        assert u["report_document"]["id"] == doc and len(u["findings"]) == 1
        assert float(u["findings"][0]["width_mm"]) == 4.2
        r = pat.put(f"{API}/patient/ultrasounds/{u['id']}", json=self.payload(lymph_node_status="normal", findings=[]))
        assert r.status_code == 200, r.text
        g = [x for x in pat.get(f"{API}/patient/ultrasounds").json() if x["id"] == u["id"]][0]
        assert g["lymph_node_status"] == "normal" and g["findings"] == [] and g["report_document"] is None

    def test_validation(self, pat):
        p = self.payload()
        p.pop("exam_date")
        assert pat.post(f"{API}/patient/ultrasounds", json=p).status_code == 422
        assert pat.post(f"{API}/patient/ultrasounds", json=self.payload(exam_date=str(TODAY + dt.timedelta(days=2)))).status_code == 400
        assert pat.post(f"{API}/patient/ultrasounds", json=self.payload(lymph_node_status="bad")).status_code == 422
        bad = self.payload(findings=[{"location": "central", "length_mm": 501}])
        assert pat.post(f"{API}/patient/ultrasounds", json=bad).status_code == 422
        assert pat.post(f"{API}/patient/ultrasounds", json=self.payload(report_document_id=str(uuid.uuid4()))).status_code == 404

    def test_delete(self, pat):
        u = pat.post(f"{API}/patient/ultrasounds", json=self.payload()).json()["id"]
        assert pat.delete(f"{API}/patient/ultrasounds/{u}").status_code == 200
        assert pat.delete(f"{API}/patient/ultrasounds/{u}").status_code == 404


# --- physician access + notes ---
class TestPhysician:
    def test_physician_views_and_downloads(self, pat, phys, pid, created):
        doc = upload(pat).json()["id"]
        created["docs"].append(doc)
        docs = phys.get(f"{API}/physician/patients/{pid}/documents")
        assert docs.status_code == 200 and any(d["id"] == doc for d in docs.json())
        f = phys.get(f"{API}/physician/patients/{pid}/documents/{doc}/file")
        assert f.status_code == 200 and f.content == PNG
        assert phys.get(f"{API}/physician/patients/{pid}/ultrasounds").status_code == 200

    def test_patient_role_forbidden(self, pat, pid):
        assert pat.get(f"{API}/physician/patients/{pid}/documents").status_code == 403
        assert pat.post(f"{API}/physician/patients/{pid}/notes", json={"target_type": "general", "body": "x"}).status_code == 403

    def test_unassigned_404(self, phys, created):
        email = f"test_p7_{uuid.uuid4().hex[:6]}@example.com"
        r = requests.post(f"{API}/auth/register", json={"name": "TEST_P7", "email": email, "password": "TestPass@123"})
        assert r.status_code == 200
        a, _ = login(*ADMIN)
        uid = [u for u in a.get(f"{API}/admin/users", params={"q": email}).json() if u["email"] == email][0]["id"]
        created["users"].append(uid)
        assert phys.get(f"{API}/physician/patients/{uid}/documents").status_code == 404
        assert phys.get(f"{API}/physician/patients/{uid}/ultrasounds").status_code == 404

    def test_notes_flow(self, pat, phys, pid, created):
        u = pat.post(f"{API}/patient/ultrasounds", json=TestUltrasounds().payload()).json()["id"]
        created["us"].append(u)
        r = phys.post(f"{API}/physician/patients/{pid}/notes", json={"target_type": "ultrasound", "target_id": u, "body": "TEST_note"})
        assert r.status_code == 200, r.text
        n = r.json()
        created["notes"].append(n["id"])
        assert n["target_id"] == u and n["physician_name"]
        g = phys.post(f"{API}/physician/patients/{pid}/notes", json={"target_type": "general", "body": "TEST_general"})
        assert g.status_code == 200 and g.json()["target_id"] is None
        created["notes"].append(g.json()["id"])
        # target validation
        assert phys.post(f"{API}/physician/patients/{pid}/notes", json={"target_type": "document", "target_id": str(uuid.uuid4()), "body": "x"}).status_code == 404
        assert phys.post(f"{API}/physician/patients/{pid}/notes", json={"target_type": "document", "body": "x"}).status_code == 400
        assert phys.post(f"{API}/physician/patients/{pid}/notes", json={"target_type": "bad", "body": "x"}).status_code == 422
        assert phys.post(f"{API}/physician/patients/{pid}/notes", json={"target_type": "general", "body": "  "}).status_code == 422
        # edit
        e = phys.put(f"{API}/physician/notes/{n['id']}", json={"body": "TEST_note edited"})
        assert e.status_code == 200 and e.json()["body"] == "TEST_note edited"
        mine = pat.get(f"{API}/patient/notes").json()
        assert any(x["id"] == n["id"] and x["body"] == "TEST_note edited" for x in mine)
        # patient cannot edit/delete
        assert pat.put(f"{API}/physician/notes/{n['id']}", json={"body": "hack"}).status_code == 403
        assert pat.delete(f"{API}/physician/notes/{n['id']}").status_code == 403
        # admin is not author
        a, _ = login(*ADMIN)
        assert a.delete(f"{API}/physician/notes/{n['id']}").status_code in (403, 404)
        assert phys.delete(f"{API}/physician/notes/{n['id']}").status_code == 200
        assert not any(x["id"] == n["id"] for x in pat.get(f"{API}/patient/notes").json())

    def test_note_on_deleted_ultrasound_orphan(self, pat, phys, pid, created):
        u = pat.post(f"{API}/patient/ultrasounds", json=TestUltrasounds().payload()).json()["id"]
        n = phys.post(f"{API}/physician/patients/{pid}/notes", json={"target_type": "ultrasound", "target_id": u, "body": "TEST_orphan"}).json()
        created["notes"].append(n["id"])
        pat.delete(f"{API}/patient/ultrasounds/{u}")
        orphan = any(x["id"] == n["id"] for x in pat.get(f"{API}/patient/notes").json())
        print("orphan note still listed after ultrasound delete:", orphan)
