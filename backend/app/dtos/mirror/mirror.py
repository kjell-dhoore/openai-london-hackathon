"""DTOs for the mirror endpoint."""

from app.dtos.base import CamelModel


class MirrorRequest(CamelModel):
    """Request body for the mirror endpoint."""

    message: str


class MirrorResponse(CamelModel):
    """Response body for the mirror endpoint."""

    mirrored_message: str
