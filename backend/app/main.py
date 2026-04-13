"""FastAPI application setup."""

from fastapi import FastAPI

from app.api.mirror.mirror import router as mirror_router

app = FastAPI()

app.include_router(mirror_router)
