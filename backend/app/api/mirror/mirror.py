"""Mirror API router."""

from fastapi import APIRouter

from app.dtos.mirror.mirror import MirrorRequest, MirrorResponse
from app.services.mirror import mirror as mirror_service

router = APIRouter()


@router.post("/mirror", response_model=MirrorResponse, response_model_by_alias=True)
async def mirror(request: MirrorRequest) -> MirrorResponse:
    """Reverse the message in the request body.

    Args:
        request: The mirror request containing the message to reverse.

    Returns:
        A MirrorResponse with the mirrored (reversed) message.
    """
    return mirror_service.mirror(request)
