from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

import asyncio
import logging
import os
from contextlib import suppress
from urllib.parse import urlparse

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pymongo import ASCENDING, DESCENDING, IndexModel
from starlette.middleware.cors import CORSMiddleware

from admin_routes import router as admin_router
from auth_routes import router as auth_router
from core import client, db
from patient_routes import router as patient_router
from physician_routes import router as physician_router
from seed import seed

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

INDEXES: dict[str, list[IndexModel]] = {
    "users": [IndexModel([("email", ASCENDING)], name="email_unique", unique=True),
              IndexModel([("role", ASCENDING), ("status", ASCENDING)], name="role_status")],
    "login_attempts": [IndexModel([("identifier", ASCENDING)], name="identifier")],
    "patient_profiles": [IndexModel([("patient_id", ASCENDING)], name="patient_unique", unique=True)],
    "medical_profiles": [IndexModel([("patient_id", ASCENDING)], name="patient_unique", unique=True)],
    "physician_assignments": [
        IndexModel([("patient_id", ASCENDING), ("physician_id", ASCENDING)], name="pair_unique", unique=True),
        IndexModel([("physician_id", ASCENDING)], name="physician")],
    "audit_logs": [IndexModel([("created_at", DESCENDING)], name="created_desc")],
}

ALLOWED_ORIGINS = [o.strip() for o in os.environ["CORS_ORIGINS"].split(",") if o.strip()]

app = FastAPI(title="ThyroCare API")
for r in (auth_router, patient_router, physician_router, admin_router):
    app.include_router(r)


@app.get("/api/health")
@app.get("/health")  # alias for external health monitors
async def health():
    return {"status": "ok"}


@app.middleware("http")
async def origin_check(request: Request, call_next):
    # CSRF defence: cookie-authenticated writes must come from our own origin
    if request.method in ("POST", "PUT", "PATCH", "DELETE") and request.cookies:
        origin = request.headers.get("origin")
        host = request.headers.get("x-forwarded-host") or request.headers.get("host")
        if origin and urlparse(origin).netloc != host and origin not in ALLOWED_ORIGINS:
            logger.warning("Blocked cross-origin write from %s", origin)
            return JSONResponse(status_code=403, content={"detail": "درخواست از مبدأ نامعتبر"})
    return await call_next(request)


app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=ALLOWED_ORIGINS,
                   allow_methods=["*"], allow_headers=["*"])


async def startup_tasks() -> None:
    for collection, models in INDEXES.items():
        for model in models:
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
    await seed()


@app.on_event("startup")
async def on_startup():
    app.state.startup_task = asyncio.create_task(startup_tasks())


@app.on_event("shutdown")
async def on_shutdown():
    app.state.startup_task.cancel()
    with suppress(asyncio.CancelledError):
        await app.state.startup_task
    client.close()
