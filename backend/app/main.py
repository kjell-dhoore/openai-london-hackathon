"""FastAPI application setup."""

from app.api.mirror.mirror import router as mirror_router
from fastapi import FastAPI

app = FastAPI()

app.include_router(mirror_router)
