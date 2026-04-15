"""Tests for the prompt-backed LLM agent utilities."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.llm.agents import (
    GrowthPlanOutput,
    ProfileAnalysisOutput,
    PromptRenderer,
    build_strict_json_schema,
)


def test_build_strict_json_schema_forces_closed_objects() -> None:
    """Structured output schemas should forbid undeclared object properties."""
    schema = build_strict_json_schema(ProfileAnalysisOutput)

    assert schema["type"] == "object"
    assert schema["additionalProperties"] is False
    skill_assessment_schema = schema["$defs"]["AgentSkillAssessment"]
    assert skill_assessment_schema["additionalProperties"] is False


def test_prompt_renderer_renders_profile_and_growth_templates() -> None:
    """Prompt templates render with the expected context variables."""
    renderer = PromptRenderer()

    profile_prompt = renderer.render(
        "profile_analysis_user.jinja",
        session_json='{"display_name":"Alex"}',
        intake_json="{}",
        quiz_responses_json="[]",
        enabled_sources_json="[]",
        evidence_documents_json="[]",
        skill_library_json="{}",
        target_role_skill_map_json="{}",
    )
    growth_prompt = renderer.render(
        "growth_plan_user.jinja",
        session_json='{"session_id":"sess_1"}',
        profile_json="{}",
        skill_profile_json="{}",
        preferences_json="{}",
        allowed_theme_skill_ids_json='["observability"]',
        theme_templates_json="{}",
        resources_by_skill_json="{}",
    )

    assert "Analyze this learner" in profile_prompt
    assert '"display_name":"Alex"' in profile_prompt
    assert "Generate a personalized growth plan" in growth_prompt
    assert "observability" in growth_prompt


def test_growth_plan_schema_is_closed_for_nested_theme_objects() -> None:
    """Growth-plan structured output schema should be strict at nested levels."""
    schema = build_strict_json_schema(GrowthPlanOutput)

    theme_schema = schema["$defs"]["GrowthThemeDraft"]
    task_schema = schema["$defs"]["GrowthTaskDraft"]
    assert theme_schema["additionalProperties"] is False
    assert task_schema["additionalProperties"] is False
