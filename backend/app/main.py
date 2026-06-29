import logging
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import dashboard, payments, projects, acts

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# /app/app/main.py → /app  (where alembic.ini lives)
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


async def _init_db() -> None:
    from alembic.config import Config
    from alembic import command
    from sqlalchemy import select, func
    from app.database import AsyncSessionLocal
    from app.models.client import Client
    from app.config import settings

    logger.info("Running alembic upgrade head…")
    try:
        alembic_cfg = Config(os.path.join(_BASE_DIR, "alembic.ini"))
        alembic_cfg.set_main_option("sqlalchemy.url", settings.SYNC_DATABASE_URL)
        command.upgrade(alembic_cfg, "head")
        logger.info("Migrations applied.")
    except Exception:
        logger.exception("Migration failed — aborting startup")
        raise

    async with AsyncSessionLocal() as session:
        count = (
            await session.execute(select(func.count()).select_from(Client))
        ).scalar()

    if count == 0:
        logger.info("Database is empty — seeding…")
        try:
            from app.seed import seed
            await seed()
            logger.info("Seed complete.")
        except Exception:
            logger.exception("Seed failed (non-fatal, continuing)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _init_db()
    yield


app = FastAPI(title="Payment Dashboard API", version="1.0.0", lifespan=lifespan)

# FRONTEND_URL env var lets you add the Render/production frontend origin.
# Falls back to localhost for local dev.
_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
_allowed_origins = list({_frontend_url, "http://localhost:3000"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(payments.router)
app.include_router(projects.router)
app.include_router(acts.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
