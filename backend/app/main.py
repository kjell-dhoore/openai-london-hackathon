"""FastAPI application setup for the SkillPilot backend."""

from __future__ import annotations

from app.api.skillpilot import router as skillpilot_router
from app.config import Settings
from app.services.skillpilot import SkillPilotService
from app.store import JsonStore
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create and configure the FastAPI application."""
    resolved_settings = settings or Settings.from_env()
    store = JsonStore(
        session_store_path=resolved_settings.session_store_path,
        internal_sources_path=resolved_settings.internal_sources_path,
    )
    service = SkillPilotService(settings=resolved_settings, store=store)

    app = FastAPI(title=resolved_settings.project_name, version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.settings = resolved_settings
    app.state.skillpilot_service = service
    app.include_router(skillpilot_router)
    return app


app = create_app()
