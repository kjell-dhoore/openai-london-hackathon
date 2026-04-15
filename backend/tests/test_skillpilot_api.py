"""Integration tests for the SkillPilot backend API."""

from __future__ import annotations

import sys
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import Settings
from app.main import create_app


def _build_client() -> TestClient:
    backend_root = Path(__file__).resolve().parents[1]
    temp_directory = TemporaryDirectory()
    session_store_path = Path(temp_directory.name) / "session_store.json"
    internal_sources_path = backend_root / "data" / "internal_sources.json"
    settings = Settings(
        project_name="SkillPilot Backend Test",
        session_store_path=session_store_path,
        internal_sources_path=internal_sources_path,
        openai_api_key=None,
        openai_model="gpt-4.1-mini",
    )
    client = TestClient(create_app(settings))
    client.temp_directory = temp_directory  # type: ignore[attr-defined]
    return client


def test_json_onboarding_and_growth_flow() -> None:
    """The backend supports the full JSON-based onboarding and growth-plan flow."""
    client = _build_client()

    create_session_response = client.post("/v1/sessions", json={"displayName": "Alex"})
    assert create_session_response.status_code == 201
    session_id = create_session_response.json()["sessionId"]

    intake_response = client.post(
        f"/v1/sessions/{session_id}/profile-intake",
        json={
            "importMode": "summary_only",
            "professionalSummary": (
                "Python engineer with FastAPI, pytest, SQL, GitHub, and machine learning "
                "experience. I want to grow into a stronger backend engineer."
            ),
            "jobDescriptionText": (
                "Build reliable backend APIs, improve observability, and communicate system "
                "design tradeoffs clearly."
            ),
            "currentRole": "Junior ML Engineer",
            "yearsOfExperience": 2.5,
            "targetRole": "Mid-Level Backend Engineer",
            "currentFocus": "Production readiness",
        },
    )
    assert intake_response.status_code == 202
    profile_job_id = intake_response.json()["jobId"]

    profile_job_response = client.get(f"/v1/jobs/{profile_job_id}")
    assert profile_job_response.status_code == 200
    assert profile_job_response.json()["status"] == "completed"

    profile_response = client.get(f"/v1/sessions/{session_id}/profile")
    assert profile_response.status_code == 200
    profile_payload = profile_response.json()
    assert len(profile_payload["strengths"]) == 4
    assert len(profile_payload["growthAreas"]) == 4

    source_state_response = client.get(f"/v1/sessions/{session_id}/sources")
    assert source_state_response.status_code == 200
    source_update_payload = {
        "sources": [
            {"id": source["id"], "enabled": source["id"] != "google_scholar"}
            for source in source_state_response.json()["sources"]
        ]
    }
    update_sources_response = client.put(
        f"/v1/sessions/{session_id}/sources",
        json=source_update_payload,
    )
    assert update_sources_response.status_code == 200

    update_preferences_response = client.put(
        f"/v1/sessions/{session_id}/preferences",
        json={
            "learningStyle": "hands_on",
            "growthFocus": "career_growth",
            "cognitiveApproach": "practice_first",
            "hoursPerWeek": 6,
            "recommendationCadence": "weekly",
            "weeklyNudgesEnabled": True,
        },
    )
    assert update_preferences_response.status_code == 200

    growth_plan_response = client.post(
        f"/v1/sessions/{session_id}/growth-plan/generate",
        json={"maxThemes": 3},
    )
    assert growth_plan_response.status_code == 202
    growth_job_id = growth_plan_response.json()["jobId"]

    growth_job_response = client.get(f"/v1/jobs/{growth_job_id}")
    assert growth_job_response.status_code == 200
    assert growth_job_response.json()["status"] == "completed"

    dashboard_response = client.get(f"/v1/sessions/{session_id}/dashboard")
    assert dashboard_response.status_code == 200
    dashboard_payload = dashboard_response.json()
    task_id = dashboard_payload["nextAction"]["id"]

    growth_plan_view_response = client.get(f"/v1/sessions/{session_id}/growth-plan")
    assert growth_plan_view_response.status_code == 200
    assert len(growth_plan_view_response.json()["themes"]) == 3

    task_response = client.get(f"/v1/sessions/{session_id}/tasks/{task_id}")
    assert task_response.status_code == 200
    task_payload = task_response.json()
    assert len(task_payload["resources"]) >= 2

    complete_task_response = client.post(
        f"/v1/sessions/{session_id}/tasks/{task_id}/complete",
        json={"reflection": "Completed the first milestone."},
    )
    assert complete_task_response.status_code == 200
    completion_payload = complete_task_response.json()
    assert completion_payload["status"] == "completed"
    assert completion_payload["awardedXp"] > 0

    updated_dashboard_response = client.get(f"/v1/sessions/{session_id}/dashboard")
    assert updated_dashboard_response.status_code == 200
    assert updated_dashboard_response.json()["completedTasks"] == 1


def test_multipart_profile_intake_is_supported() -> None:
    """The onboarding intake endpoint accepts multipart resume uploads."""
    client = _build_client()

    create_session_response = client.post("/v1/sessions", json={"displayName": "Morgan"})
    assert create_session_response.status_code == 201
    session_id = create_session_response.json()["sessionId"]

    multipart_response = client.post(
        f"/v1/sessions/{session_id}/profile-intake",
        data={
            "importMode": "resume_upload",
            "jobDescriptionText": "Need stronger API design, observability, and testing.",
            "currentRole": "Software Engineer",
            "yearsOfExperience": "3",
            "targetRole": "Mid-Level Backend Engineer",
            "currentFocus": "Backend reliability",
        },
        files={
            "resumeFile": (
                "resume.txt",
                b"Python FastAPI APIs pytest SQL GitHub and Docker experience",
                "text/plain",
            )
        },
    )
    assert multipart_response.status_code == 202

    job_id = multipart_response.json()["jobId"]
    job_response = client.get(f"/v1/jobs/{job_id}")
    assert job_response.status_code == 200
    assert job_response.json()["status"] == "completed"

    profile_response = client.get(f"/v1/sessions/{session_id}/profile")
    assert profile_response.status_code == 200
    assert profile_response.json()["displayName"] == "Morgan"
