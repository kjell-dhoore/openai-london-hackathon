"""FastAPI routes for the SkillPilot backend."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from app.dtos.skillpilot import (
    AsyncJobAccepted,
    DashboardView,
    GrowthPlan,
    GrowthPlanGenerateRequest,
    HealthStatus,
    JobStatusResponse,
    Preferences,
    ProfileIntakePayload,
    ProfileSummary,
    QuizSubmissionRequest,
    SessionCreateRequest,
    SessionSummary,
    SkillProfileView,
    SourceCatalogResponse,
    SourceSelectionRequest,
    SourceSelectionState,
    TaskCompletionRequest,
    TaskCompletionResponse,
    TaskDetail,
)
from fastapi import APIRouter, BackgroundTasks, Depends, Request
from starlette.datastructures import UploadFile

if TYPE_CHECKING:
    from app.services.skillpilot import SkillPilotService

router = APIRouter()


def _get_service(request: Request) -> SkillPilotService:
    return request.app.state.skillpilot_service


ServiceDependency = Annotated["SkillPilotService", Depends(_get_service)]


def _decode_resume_bytes(payload: bytes, filename: str | None) -> str:
    if not payload:
        return ""
    decoded_payload = payload.decode("utf-8", errors="ignore").strip()
    if decoded_payload:
        return decoded_payload
    return f"Uploaded file {filename or 'resume'} could not be text-extracted yet."


async def _extract_profile_payload(request: Request) -> ProfileIntakePayload:
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/json"):
        return ProfileIntakePayload.model_validate(await request.json())

    form = await request.form()
    payload_data = {
        "importMode": form.get("importMode", "resume_upload"),
        "resumeText": form.get("resumeText"),
        "linkedinProfileUrl": form.get("linkedinProfileUrl"),
        "professionalSummary": form.get("professionalSummary"),
        "jobDescriptionText": form.get("jobDescriptionText"),
        "currentRole": form.get("currentRole"),
        "yearsOfExperience": form.get("yearsOfExperience"),
        "targetRole": form.get("targetRole"),
        "currentFocus": form.get("currentFocus"),
    }

    resume_file = form.get("resumeFile")
    if isinstance(resume_file, UploadFile):
        raw_payload = await resume_file.read()
        payload_data["resumeFilename"] = resume_file.filename
        payload_data["resumeText"] = _decode_resume_bytes(raw_payload, resume_file.filename)

    return ProfileIntakePayload.model_validate(payload_data)


@router.get("/health", response_model=HealthStatus, response_model_by_alias=True, tags=["Health"])
def _health() -> HealthStatus:
    return HealthStatus(status="ok")


@router.post(
    "/v1/sessions",
    response_model=SessionSummary,
    response_model_by_alias=True,
    status_code=201,
    tags=["Sessions"],
)
def _create_session(
    service: ServiceDependency,
    request: SessionCreateRequest | None = None,
) -> SessionSummary:
    return service.create_session(request)


@router.get(
    "/v1/sessions/{session_id}",
    response_model=SessionSummary,
    response_model_by_alias=True,
    tags=["Sessions"],
)
def _get_session(
    session_id: str,
    service: ServiceDependency,
) -> SessionSummary:
    return service.get_session(session_id)


@router.post(
    "/v1/sessions/{session_id}/profile-intake",
    response_model=AsyncJobAccepted,
    response_model_by_alias=True,
    status_code=202,
    tags=["Onboarding"],
)
async def _submit_profile_intake(
    session_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    service: ServiceDependency,
) -> AsyncJobAccepted:
    payload = await _extract_profile_payload(request)
    return service.submit_profile_intake(session_id, payload, background_tasks)


@router.post(
    "/v1/sessions/{session_id}/quiz-responses",
    response_model=ProfileSummary,
    response_model_by_alias=True,
    tags=["Onboarding"],
)
def _submit_quiz_responses(
    session_id: str,
    request: QuizSubmissionRequest,
    service: ServiceDependency,
) -> ProfileSummary:
    return service.submit_quiz_responses(session_id, request)


@router.get(
    "/v1/sessions/{session_id}/profile",
    response_model=ProfileSummary,
    response_model_by_alias=True,
    tags=["Onboarding"],
)
def _get_profile(
    session_id: str,
    service: ServiceDependency,
) -> ProfileSummary:
    return service.get_profile(session_id)


@router.get(
    "/v1/sources/catalog",
    response_model=SourceCatalogResponse,
    response_model_by_alias=True,
    tags=["Sources"],
)
def _get_source_catalog(
    service: ServiceDependency,
) -> SourceCatalogResponse:
    return service.get_source_catalog()


@router.get(
    "/v1/sessions/{session_id}/sources",
    response_model=SourceSelectionState,
    response_model_by_alias=True,
    tags=["Sources"],
)
def _get_selected_sources(
    session_id: str,
    service: ServiceDependency,
) -> SourceSelectionState:
    return service.get_selected_sources(session_id)


@router.put(
    "/v1/sessions/{session_id}/sources",
    response_model=SourceSelectionState,
    response_model_by_alias=True,
    tags=["Sources"],
)
def _update_selected_sources(
    session_id: str,
    request: SourceSelectionRequest,
    service: ServiceDependency,
) -> SourceSelectionState:
    return service.update_selected_sources(session_id, request)


@router.get(
    "/v1/sessions/{session_id}/preferences",
    response_model=Preferences,
    response_model_by_alias=True,
    tags=["Preferences"],
)
def _get_preferences(
    session_id: str,
    service: ServiceDependency,
) -> Preferences:
    return service.get_preferences(session_id)


@router.put(
    "/v1/sessions/{session_id}/preferences",
    response_model=Preferences,
    response_model_by_alias=True,
    tags=["Preferences"],
)
def _update_preferences(
    session_id: str,
    request: Preferences,
    service: ServiceDependency,
) -> Preferences:
    return service.update_preferences(session_id, request)


@router.post(
    "/v1/sessions/{session_id}/growth-plan/generate",
    response_model=AsyncJobAccepted,
    response_model_by_alias=True,
    status_code=202,
    tags=["Growth Plan"],
)
def _generate_growth_plan(
    session_id: str,
    background_tasks: BackgroundTasks,
    service: ServiceDependency,
    request: GrowthPlanGenerateRequest | None = None,
) -> AsyncJobAccepted:
    generation_request = request or GrowthPlanGenerateRequest()
    return service.generate_growth_plan(session_id, generation_request, background_tasks)


@router.get(
    "/v1/jobs/{job_id}",
    response_model=JobStatusResponse,
    response_model_by_alias=True,
    tags=["Jobs"],
)
def _get_job_status(
    job_id: str,
    service: ServiceDependency,
) -> JobStatusResponse:
    return service.get_job_status(job_id)


@router.get(
    "/v1/sessions/{session_id}/dashboard",
    response_model=DashboardView,
    response_model_by_alias=True,
    tags=["Dashboard"],
)
def _get_dashboard(
    session_id: str,
    service: ServiceDependency,
) -> DashboardView:
    return service.get_dashboard(session_id)


@router.get(
    "/v1/sessions/{session_id}/skill-profile",
    response_model=SkillProfileView,
    response_model_by_alias=True,
    tags=["Skill Profile"],
)
def _get_skill_profile(
    session_id: str,
    service: ServiceDependency,
) -> SkillProfileView:
    return service.get_skill_profile(session_id)


@router.get(
    "/v1/sessions/{session_id}/growth-plan",
    response_model=GrowthPlan,
    response_model_by_alias=True,
    tags=["Growth Plan"],
)
def _get_growth_plan(
    session_id: str,
    service: ServiceDependency,
) -> GrowthPlan:
    return service.get_growth_plan(session_id)


@router.get(
    "/v1/sessions/{session_id}/tasks/{task_id}",
    response_model=TaskDetail,
    response_model_by_alias=True,
    tags=["Tasks"],
)
def _get_task_detail(
    session_id: str,
    task_id: str,
    service: ServiceDependency,
) -> TaskDetail:
    return service.get_task_detail(session_id, task_id)


@router.post(
    "/v1/sessions/{session_id}/tasks/{task_id}/complete",
    response_model=TaskCompletionResponse,
    response_model_by_alias=True,
    tags=["Tasks"],
)
def _complete_task(
    session_id: str,
    task_id: str,
    service: ServiceDependency,
    request: TaskCompletionRequest | None = None,
) -> TaskCompletionResponse:
    return service.complete_task(session_id, task_id, request)
