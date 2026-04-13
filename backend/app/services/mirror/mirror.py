"""Mirror service — reverses the message from a MirrorRequest."""

from app.dtos.mirror.mirror import MirrorRequest, MirrorResponse


def mirror(request: MirrorRequest) -> MirrorResponse:
    """Reverse the message in the request and return it as a MirrorResponse.

    Args:
        request: The incoming mirror request containing the message to reverse.

    Returns:
        A MirrorResponse with the message reversed.
    """
    return MirrorResponse(mirrored_message=request.message[::-1])
