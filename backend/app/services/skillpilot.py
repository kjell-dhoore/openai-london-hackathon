"""Core orchestration and business logic for the SkillPilot backend."""

import json
import logging
import re
from collections.abc import Iterable
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote_plus
from uuid import uuid4

from app.config import Settings
from app.dtos.skillpilot import (
    AsyncJobAccepted,
    DashboardView,
    GrowthPlan,
    GrowthPlanGenerateRequest,
    GrowthTheme,
    GrowthThemeProgress,
    IntegrationMode,
    JobError,
    JobResult,
    JobState,
    JobStatusResponse,
    JobType,
    LearningResource,
    LearningStyle,
    Preferences,
    Priority,
    ProfileIntakePayload,
    ProfileSummary,
    QuizResponse,
    QuizSubmissionRequest,
    ResourceType,
    SessionCreateRequest,
    SessionStatus,
    SessionSummary,
    SkillBand,
    SkillEvidence,
    SkillProfileView,
    SkillRating,
    SourceCatalogResponse,
    SourceCategory,
    SourceDefinition,
    SourceSelection,
    SourceSelectionRequest,
    SourceSelectionState,
    StoredSession,
    TargetRoleComparison,
    TaskCompletionRequest,
    TaskCompletionResponse,
    TaskDetail,
    TaskStatus,
    TaskSummary,
)
from app.llm.agents import (
    GrowthPlanOutput,
    LlmAgentError,
    ProfileAnalysisOutput,
    SkillPilotPromptAgents,
)
from app.seed_data import (
    DEFAULT_PREFERENCES,
    DEFAULT_SOURCE_CATALOG,
    OFFICIAL_DOCUMENTATION_LINKS,
    SKILL_LIBRARY,
    TARGET_ROLE_KEY_SKILLS,
    THEME_TEMPLATES,
)
from app.store import JsonStore
from fastapi import BackgroundTasks, HTTPException, status

logger = logging.getLogger(__name__)


def _utc_now() -> datetime:
    """Return the current UTC timestamp."""
    return datetime.now(timezone.utc)


def _generate_identifier(prefix: str) -> str:
    """Generate a stable-looking identifier for persisted entities."""
    return f"{prefix}_{uuid4().hex[:24]}"


def _clamp(value: float, lower: int, upper: int) -> int:
    """Clamp a numeric value to an inclusive range."""
    return max(lower, min(round(value), upper))


def json_dumps(payload: object) -> str:
    """Serialize prompt context into stable pretty JSON."""
    return json.dumps(payload, indent=2, sort_keys=True)


def _is_placeholder_display_name(value: str | None) -> bool:
    """Return whether a display name is a known placeholder."""
    if value is None:
        return True
    return value.strip().lower() in {"", "user", "learner"}


def _extract_display_name(intake: ProfileIntakePayload, fallback: str) -> str:
    """Extract a likely learner name from resume text or summary content."""
    candidate_texts = [intake.resume_text, intake.professional_summary]
    for text in candidate_texts:
        if not text:
            continue
        for raw_line in text.splitlines()[:8]:
            line = raw_line.strip()
            if not line or len(line) > 60:
                continue
            if any(char.isdigit() for char in line):
                continue
            if "@" in line or "http" in line.lower() or "linkedin" in line.lower():
                continue
            if any(token.lower() in line.lower() for token in ["resume", "curriculum", "engineer"]):
                continue
            if re.fullmatch(
                r"[A-Z][a-z]+(?:[-'][A-Z][a-z]+)?"
                r"(?:\s+[A-Z][a-z]+(?:[-'][A-Z][a-z]+)?){1,3}",
                line,
            ):
                return line
    return fallback


def _normalize_text(parts: Iterable[str | None]) -> str:
    """Combine text fragments into a lower-cased search string."""
    return " ".join(part.strip() for part in parts if part).lower()


def _band_from_score(level_percent: int) -> SkillBand:
    """Translate a numeric score into a maturity band."""
    if level_percent >= 80:
        return SkillBand.ADVANCED
    if level_percent >= 65:
        return SkillBand.STRONG
    if level_percent >= 40:
        return SkillBand.DEVELOPING
    return SkillBand.EMERGING


def _priority_from_score(level_percent: int) -> Priority:
    """Translate a low skill score into a growth priority."""
    if level_percent <= 35:
        return Priority.HIGH
    if level_percent <= 55:
        return Priority.MEDIUM
    return Priority.LOW


def _level_from_xp(total_xp: int) -> int:
    """Translate cumulative XP into a simple level value."""
    return max(1, 1 + total_xp // 500)


def _friendly_enum(value: str) -> str:
    """Convert snake_case enum values into user-facing text."""
    return value.replace("_", " ")


def _target_role_skill_ids(target_role: str | None) -> list[str]:
    """Resolve the most relevant skill identifiers for a target role."""
    if not target_role:
        return ["observability", "system_design", "error_handling", "api_design"]

    lowered_target_role = target_role.lower()
    for role_key, skill_ids in TARGET_ROLE_KEY_SKILLS.items():
        if role_key in lowered_target_role:
            return skill_ids

    return ["observability", "system_design", "error_handling", "testing"]


class _IngestionAgent:
    """Profile-analysis agent with OpenAI-backed and deterministic execution paths."""

    def __init__(
        self,
        settings: Settings,
        store: JsonStore,
        source_catalog: list[SourceDefinition],
    ) -> None:
        self._settings = settings
        self._store = store
        self._catalog_by_id = {source.id: source for source in source_catalog}
        self._prompt_agents = (
            SkillPilotPromptAgents(api_key=settings.openai_api_key, model=settings.openai_model)
            if settings.openai_api_key
            else None
        )

    def build_profile(
        self,
        session: StoredSession,
        quiz_responses: list[QuizResponse] | None = None,
    ) -> tuple[ProfileSummary, SkillProfileView]:
        quiz_responses = quiz_responses or []
        prompt_agents = self._prompt_agents
        if self._settings.llm_mode == "openai" and prompt_agents is not None:
            try:
                return self._build_profile_with_llm(session, quiz_responses, prompt_agents)
            except (KeyError, TypeError, ValueError, LlmAgentError) as exc:  # pragma: no cover
                logger.warning(
                    "OpenAI profile analysis failed; falling back to deterministic builder.",
                    exc_info=exc,
                )

        return self._build_profile_deterministic(session, quiz_responses)

    def _build_profile_deterministic(
        self,
        session: StoredSession,
        quiz_responses: list[QuizResponse],
    ) -> tuple[ProfileSummary, SkillProfileView]:
        intake = session.intake
        if intake is None:
            raise ValueError("Cannot build a profile without intake data.")

        combined_text = _normalize_text(
            [
                intake.resume_text,
                intake.professional_summary,
                intake.job_description_text,
                intake.current_role,
                intake.target_role,
                intake.current_focus,
            ]
        )
        years_of_experience = intake.years_of_experience or 0
        selected_source_ids = {source.id for source in session.selected_sources if source.enabled}
        target_role_skill_ids = _target_role_skill_ids(intake.target_role)
        quiz_adjustments = self._quiz_adjustments(quiz_responses)

        ratings: list[SkillRating] = []
        for skill_id, metadata in SKILL_LIBRARY.items():
            keyword_matches = sum(
                1 for keyword in metadata["keywords"] if keyword.lower() in combined_text
            )
            target_bonus = 8 if skill_id in target_role_skill_ids else 0
            focus_bonus = (
                6 if intake.current_focus and skill_id in intake.current_focus.lower() else 0
            )
            evidence = self._build_evidence(
                skill_id=skill_id,
                keyword_matches=keyword_matches,
                enabled_source_ids=selected_source_ids,
            )
            if keyword_matches == 0 and skill_id in target_role_skill_ids:
                base_score = 22
            else:
                base_score = int(metadata["base_level"])

            score = (
                base_score
                + keyword_matches * 14
                + years_of_experience * 2.5
                + target_bonus
                + focus_bonus
                + quiz_adjustments.get(skill_id, 0)
            )
            confidence = min(0.95, 0.42 + keyword_matches * 0.12 + len(evidence) * 0.06)
            ratings.append(
                SkillRating(
                    id=skill_id,
                    name=str(metadata["name"]),
                    category=str(metadata["category"]),
                    level_percent=_clamp(score, 10, 95),
                    band=_band_from_score(_clamp(score, 10, 95)),
                    confidence=round(confidence, 2),
                    evidence=evidence[:3],
                )
            )

        strengths = sorted(ratings, key=lambda rating: rating.level_percent, reverse=True)[:4]
        growth_areas = self._prioritized_growth_areas(ratings, target_role_skill_ids)

        for growth_area in growth_areas:
            growth_area.priority = _priority_from_score(growth_area.level_percent)

        strongest_skill = strengths[0].name
        largest_gap = growth_areas[0].name
        target_role_label = intake.target_role or "your next role"
        maturity_snapshot = (
            f"You already show promising strength in {strongest_skill.lower()}, while "
            f"{largest_gap.lower()} is the clearest next area to develop."
        )
        goal_direction = (
            f"Move from {intake.current_role or 'your current role'} toward "
            f"{target_role_label.lower()} with stronger delivery confidence."
        )
        explanation = (
            "Recommendations are based on your profile inputs, quiz signals, enabled knowledge "
            "sources, and the capabilities expected by your target role."
        )
        missing_information = self._missing_information(intake, quiz_responses)
        extracted_display_name = _extract_display_name(intake, session.display_name)
        profile = ProfileSummary(
            profile_id=_generate_identifier("profile"),
            display_name=extracted_display_name,
            current_role=intake.current_role,
            target_role=intake.target_role,
            years_of_experience=intake.years_of_experience,
            current_focus=intake.current_focus,
            maturity_snapshot=maturity_snapshot,
            goal_direction=goal_direction,
            explanation=explanation,
            missing_information=missing_information,
            strengths=strengths,
            growth_areas=growth_areas,
        )

        target_role_comparison = TargetRoleComparison(
            title=intake.target_role or "Growth target",
            gap_skills=[rating.name for rating in growth_areas[:3]],
            narrative=(
                f"You already show useful implementation ability, but to grow toward "
                f"{target_role_label.lower()} you need more evidence in "
                f"{', '.join(gap.name.lower() for gap in growth_areas[:3])}."
            ),
        )
        return (
            profile,
            SkillProfileView(
                target_role=target_role_comparison,
                strengths=strengths,
                growth_areas=growth_areas,
            ),
        )

    def _build_profile_with_llm(
        self,
        session: StoredSession,
        quiz_responses: list[QuizResponse],
        prompt_agents: SkillPilotPromptAgents,
    ) -> tuple[ProfileSummary, SkillProfileView]:
        intake = session.intake
        if intake is None:
            raise ValueError("Cannot build a profile without intake data.")

        selected_source_ids = {source.id for source in session.selected_sources if source.enabled}
        enabled_documents = self._enabled_internal_documents(selected_source_ids)
        llm_output = prompt_agents.analyze_profile(
            {
                "session_json": json_dumps(session.to_summary().model_dump(mode="json")),
                "intake_json": json_dumps(intake.model_dump(mode="json")),
                "quiz_responses_json": json_dumps(
                    [response.model_dump(mode="json") for response in quiz_responses]
                ),
                "enabled_sources_json": json_dumps(
                    [
                        source.model_dump(mode="json")
                        for source in session.selected_sources
                        if source.enabled
                    ]
                ),
                "evidence_documents_json": json_dumps(enabled_documents),
                "skill_library_json": json_dumps(SKILL_LIBRARY),
                "target_role_skill_map_json": json_dumps(TARGET_ROLE_KEY_SKILLS),
            }
        )
        return self._profile_from_llm_output(session, llm_output, enabled_documents)

    def _profile_from_llm_output(
        self,
        session: StoredSession,
        llm_output: ProfileAnalysisOutput,
        enabled_documents: list[dict[str, object]],
    ) -> tuple[ProfileSummary, SkillProfileView]:
        intake = session.intake
        if intake is None:
            raise ValueError("Cannot build a profile without intake data.")

        strengths = self._materialize_skill_ratings(
            assessments=llm_output.strengths,
            documents=enabled_documents,
            apply_priority=False,
        )
        growth_areas = self._materialize_skill_ratings(
            assessments=llm_output.growth_areas,
            documents=enabled_documents,
            apply_priority=True,
        )
        if len(strengths) != 4 or len(growth_areas) != 4:
            raise ValueError("LLM output did not produce the expected number of skill ratings.")

        gap_skill_names: list[str] = []
        for skill_id in llm_output.target_role_gap_skill_ids:
            metadata = SKILL_LIBRARY.get(skill_id)
            if metadata is not None:
                gap_skill_names.append(str(metadata["name"]))
        if not gap_skill_names:
            gap_skill_names = [rating.name for rating in growth_areas[:3]]

        profile = ProfileSummary(
            profile_id=_generate_identifier("profile"),
            display_name=(
                llm_output.display_name.strip()
                if not _is_placeholder_display_name(llm_output.display_name)
                else _extract_display_name(intake, session.display_name)
            ),
            current_role=intake.current_role,
            target_role=intake.target_role,
            years_of_experience=intake.years_of_experience,
            current_focus=intake.current_focus,
            maturity_snapshot=llm_output.maturity_snapshot,
            goal_direction=llm_output.goal_direction,
            explanation=llm_output.explanation,
            missing_information=llm_output.missing_information,
            strengths=strengths,
            growth_areas=growth_areas,
        )
        target_role_comparison = TargetRoleComparison(
            title=intake.target_role or "Growth target",
            gap_skills=gap_skill_names[:3],
            narrative=llm_output.target_role_narrative,
        )
        return (
            profile,
            SkillProfileView(
                target_role=target_role_comparison,
                strengths=strengths,
                growth_areas=growth_areas,
            ),
        )

    def _materialize_skill_ratings(
        self,
        *,
        assessments: list[Any],
        documents: list[dict[str, object]],
        apply_priority: bool,
    ) -> list[SkillRating]:
        document_by_id = {str(document["id"]): document for document in documents}
        seen_skill_ids: set[str] = set()
        ratings: list[SkillRating] = []
        for assessment in assessments:
            skill_id = assessment.skill_id
            metadata = SKILL_LIBRARY.get(skill_id)
            if metadata is None or skill_id in seen_skill_ids:
                continue

            evidence: list[SkillEvidence] = []
            for document_id in assessment.evidence_document_ids[:3]:
                document = document_by_id.get(document_id)
                if document is None:
                    continue
                evidence.append(
                    SkillEvidence(
                        source_id=str(document["source_id"]),
                        source_category=SourceCategory.INTERNAL,
                        title=str(document["title"]),
                        summary=str(document["summary"]),
                        link=None,
                    )
                )
            if not evidence:
                evidence.append(
                    SkillEvidence(
                        source_id="analysis",
                        source_category="self_reported",
                        title=f"Assessment for {metadata['name']}",
                        summary=assessment.rationale,
                    )
                )

            rating = SkillRating(
                id=skill_id,
                name=str(metadata["name"]),
                category=str(metadata["category"]),
                level_percent=assessment.level_percent,
                band=_band_from_score(assessment.level_percent),
                confidence=assessment.confidence,
                priority=(
                    _priority_from_score(assessment.level_percent) if apply_priority else None
                ),
                evidence=evidence[:3],
            )
            ratings.append(rating)
            seen_skill_ids.add(skill_id)

        return ratings

    def _enabled_internal_documents(
        self,
        enabled_source_ids: set[str],
    ) -> list[dict[str, object]]:
        documents: list[dict[str, object]] = []
        for source_bundle in self._store.load_internal_sources().sources:
            if source_bundle.source_id not in enabled_source_ids:
                continue
            for document in source_bundle.documents:
                documents.append(
                    {
                        "id": document.id,
                        "source_id": source_bundle.source_id,
                        "title": document.title,
                        "summary": document.summary,
                        "tags": document.tags,
                        "artifact_path": document.artifact_path,
                        "resource_type": document.resource_type.value,
                    }
                )
        return documents

    def collect_resources(
        self,
        session: StoredSession,
        skill_id: str,
        selected_sources: list[SourceSelection],
        preferences: Preferences,
    ) -> list[LearningResource]:
        enabled_source_ids = {source.id for source in selected_sources if source.enabled}
        resources: list[LearningResource] = []
        internal_sources = self._store.load_internal_sources()
        theme_query = str(THEME_TEMPLATES[skill_id]["search_query"])

        for source_bundle in internal_sources.sources:
            if source_bundle.source_id not in enabled_source_ids:
                continue

            for document in source_bundle.documents:
                if skill_id not in document.tags:
                    continue

                resources.append(
                    LearningResource(
                        id=_generate_identifier("res"),
                        title=document.title,
                        resource_type=document.resource_type,
                        source_id=source_bundle.source_id,
                        source_category=SourceCategory.INTERNAL,
                        integration_mode=IntegrationMode.LOCAL_JSON,
                        artifact_path=document.artifact_path,
                        url=document.link,
                        rationale=(
                            "Selected from mocked internal knowledge because it reflects real team "
                            "patterns relevant to this growth area."
                        ),
                    )
                )

        learning_style = preferences.learning_style
        sorted_external_ids = self._sort_external_sources(enabled_source_ids, learning_style)
        prompt_agents = self._prompt_agents
        if (
            self._settings.llm_mode == "openai"
            and prompt_agents is not None
            and sorted_external_ids
            and session.profile is not None
            and session.intake is not None
        ):
            try:
                resources.extend(
                    self._discover_external_resources_with_llm(
                        session=session,
                        skill_id=skill_id,
                        sorted_external_ids=sorted_external_ids,
                        preferences=preferences,
                        prompt_agents=prompt_agents,
                    )
                )
            except (KeyError, TypeError, ValueError, LlmAgentError) as exc:  # pragma: no cover
                logger.warning(
                    "OpenAI resource discovery failed; falling back to static external resources.",
                    exc_info=exc,
                )

        for source_id in sorted_external_ids:
            resource = self._build_external_resource(
                skill_id=skill_id,
                source_id=source_id,
                query=theme_query,
            )
            if resource is not None:
                if any(
                    existing.url == resource.url and existing.source_id == resource.source_id
                    for existing in resources
                ):
                    continue
                resources.append(resource)

        return resources[:6]

    def _discover_external_resources_with_llm(
        self,
        *,
        session: StoredSession,
        skill_id: str,
        sorted_external_ids: list[str],
        preferences: Preferences,
        prompt_agents: SkillPilotPromptAgents,
    ) -> list[LearningResource]:
        if session.profile is None or session.intake is None:
            raise ValueError("Cannot discover resources before a profile exists.")

        allowed_external_sources = [
            source.model_dump(mode="json")
            for source in session.selected_sources
            if source.id in sorted_external_ids
        ]
        llm_output = prompt_agents.discover_external_resources(
            {
                "skill_json": json_dumps(
                    {
                        "skill_id": skill_id,
                        "skill_name": SKILL_LIBRARY[skill_id]["name"],
                        "skill_category": SKILL_LIBRARY[skill_id]["category"],
                    }
                ),
                "session_json": json_dumps(session.to_summary().model_dump(mode="json")),
                "intake_json": json_dumps(session.intake.model_dump(mode="json")),
                "profile_json": json_dumps(session.profile.model_dump(mode="json")),
                "preferences_json": json_dumps(preferences.model_dump(mode="json")),
                "allowed_external_sources_json": json_dumps(allowed_external_sources),
                "search_hints_json": json_dumps(
                    {
                        "query": THEME_TEMPLATES[skill_id]["search_query"],
                        "learning_style": preferences.learning_style.value,
                        "target_role": session.intake.target_role,
                        "current_focus": session.intake.current_focus,
                    }
                ),
            }
        )
        materialized: list[LearningResource] = []
        allowed_source_ids = set(sorted_external_ids)
        allowed_resource_types = {
            ResourceType.OFFICIAL_DOC.value,
            ResourceType.BLOG.value,
            ResourceType.VIDEO.value,
            ResourceType.PAPER.value,
            ResourceType.SEARCH_RESULT.value,
        }
        for result in llm_output.resources:
            if (
                result.source_id not in allowed_source_ids
                or result.resource_type not in allowed_resource_types
            ):
                continue

            source_definition = self._catalog_by_id.get(result.source_id)
            if source_definition is None:
                continue

            materialized.append(
                LearningResource(
                    id=_generate_identifier("res"),
                    title=result.title,
                    resource_type=ResourceType(result.resource_type),
                    source_id=result.source_id,
                    source_category=SourceCategory.EXTERNAL,
                    integration_mode=source_definition.integration_mode,
                    url=result.url,
                    rationale=result.rationale,
                )
            )
        return materialized

    def _build_evidence(
        self,
        skill_id: str,
        keyword_matches: int,
        enabled_source_ids: set[str],
    ) -> list[SkillEvidence]:
        evidence: list[SkillEvidence] = []
        if keyword_matches > 0:
            evidence.append(
                SkillEvidence(
                    source_id="self_reported",
                    source_category="self_reported",
                    title=f"Profile signals for {SKILL_LIBRARY[skill_id]['name']}",
                    summary=(
                        "Detected relevant experience in the uploaded or pasted profile "
                        "information."
                    ),
                )
            )

        internal_sources = self._store.load_internal_sources()
        for source_bundle in internal_sources.sources:
            if source_bundle.source_id not in enabled_source_ids:
                continue

            matching_document = next(
                (document for document in source_bundle.documents if skill_id in document.tags),
                None,
            )
            if matching_document is None:
                continue

            evidence.append(
                SkillEvidence(
                    source_id=source_bundle.source_id,
                    source_category=SourceCategory.INTERNAL,
                    title=matching_document.title,
                    summary=matching_document.summary,
                    link=matching_document.link,
                )
            )
            if len(evidence) >= 3:
                break

        if not evidence:
            evidence.append(
                SkillEvidence(
                    source_id="analysis",
                    source_category="self_reported",
                    title="Limited direct evidence",
                    summary=(
                        "The current profile contains little explicit evidence for this skill, "
                        "which makes it a useful growth hypothesis."
                    ),
                )
            )

        return evidence

    def _missing_information(
        self,
        intake: ProfileIntakePayload,
        quiz_responses: list[QuizResponse],
    ) -> list[str]:
        response_ids = {response.question_id for response in quiz_responses}
        missing_information: list[str] = []
        if "ml-deploy" not in response_ids:
            missing_information.append("deployment_experience")
        if "system-design" not in response_ids:
            missing_information.append("system_design_confidence")
        if "testing" not in response_ids:
            missing_information.append("testing_habits")
        if not intake.job_description_text:
            missing_information.append("job_description")
        return missing_information

    def _prioritized_growth_areas(
        self,
        ratings: list[SkillRating],
        target_role_skill_ids: list[str],
    ) -> list[SkillRating]:
        prioritized = sorted(
            ratings,
            key=lambda rating: (
                rating.id not in target_role_skill_ids,
                rating.level_percent,
            ),
        )
        return prioritized[:4]

    def _quiz_adjustments(self, quiz_responses: list[QuizResponse]) -> dict[str, int]:
        adjustments: dict[str, int] = {}
        for response in quiz_responses:
            if response.question_id == "ml-deploy" and response.numeric_value is not None:
                delta = int((response.numeric_value - 50) / 4)
                adjustments["deployment"] = adjustments.get("deployment", 0) + delta
                adjustments["machine_learning"] = (
                    adjustments.get("machine_learning", 0) + delta // 2
                )
            elif response.question_id == "system-design" and response.numeric_value is not None:
                delta = int((response.numeric_value - 50) / 4)
                adjustments["system_design"] = adjustments.get("system_design", 0) + delta
            elif response.question_id == "code-review" and response.option_value is not None:
                option_bonus = {
                    "Rarely": -6,
                    "A few times a month": 0,
                    "Weekly": 5,
                    "Daily": 8,
                }
                adjustments["git_collaboration"] = option_bonus.get(response.option_value, 0)
            elif response.question_id == "testing" and response.option_value is not None:
                option_bonus = {
                    "Manual testing mostly": -6,
                    "Some unit tests": 0,
                    "Good test coverage": 5,
                    "TDD practitioner": 8,
                }
                adjustments["testing"] = option_bonus.get(response.option_value, 0)
        return adjustments

    def _sort_external_sources(
        self,
        enabled_source_ids: set[str],
        learning_style: LearningStyle,
    ) -> list[str]:
        preferred_order = {
            "video": ["youtube", "official_docs", "google_search", "medium", "google_scholar"],
            "reading": ["official_docs", "medium", "google_search", "google_scholar", "youtube"],
            "discussion": ["google_search", "official_docs", "youtube", "medium", "google_scholar"],
            "hands_on": ["official_docs", "youtube", "google_search", "medium", "google_scholar"],
        }
        ordered_source_ids = preferred_order.get(
            str(learning_style.value),
            preferred_order["hands_on"],
        )
        return [source_id for source_id in ordered_source_ids if source_id in enabled_source_ids]

    def _build_external_resource(
        self,
        skill_id: str,
        source_id: str,
        query: str,
    ) -> LearningResource | None:
        source_definition = self._catalog_by_id.get(source_id)
        if source_definition is None:
            return None

        if source_id == "official_docs":
            documentation = OFFICIAL_DOCUMENTATION_LINKS.get(skill_id)
            if documentation is None:
                return None
            return LearningResource(
                id=_generate_identifier("res"),
                title=documentation["title"],
                resource_type=ResourceType.OFFICIAL_DOC,
                source_id=source_id,
                source_category=SourceCategory.EXTERNAL,
                integration_mode=IntegrationMode.HTTP_API,
                url=documentation["url"],
                rationale="Selected as a stable reference to anchor the practical task work.",
            )

        encoded_query = quote_plus(query)
        search_targets = {
            "youtube": (
                f"https://www.youtube.com/results?search_query={encoded_query}",
                ResourceType.VIDEO,
            ),
            "google_search": (
                f"https://www.google.com/search?q={encoded_query}",
                ResourceType.SEARCH_RESULT,
            ),
            "google_scholar": (
                f"https://scholar.google.com/scholar?q={encoded_query}",
                ResourceType.PAPER,
            ),
            "medium": (
                f"https://medium.com/search?q={encoded_query}",
                ResourceType.BLOG,
            ),
        }
        if source_id not in search_targets:
            return None

        url, resource_type = search_targets[source_id]
        return LearningResource(
            id=_generate_identifier("res"),
            title=f"{source_definition.name} results for {SKILL_LIBRARY[skill_id]['name']}",
            resource_type=resource_type,
            source_id=source_id,
            source_category=SourceCategory.EXTERNAL,
            integration_mode=source_definition.integration_mode,
            url=url,
            rationale=(
                "Generated as a live source-specific search link so the resource stays connected "
                "to real external content."
            ),
        )


class _GrowthPlanAgent:
    """Growth-plan agent with OpenAI-backed and deterministic execution paths."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._prompt_agents = (
            SkillPilotPromptAgents(api_key=settings.openai_api_key, model=settings.openai_model)
            if settings.openai_api_key
            else None
        )

    def build_growth_plan(
        self,
        session: StoredSession,
        resources_by_skill: dict[str, list[LearningResource]],
        max_themes: int,
    ) -> tuple[GrowthPlan, dict[str, TaskDetail], dict[str, str]]:
        prompt_agents = self._prompt_agents
        if self._settings.llm_mode == "openai" and prompt_agents is not None:
            try:
                return self._build_growth_plan_with_llm(
                    session,
                    resources_by_skill,
                    max_themes,
                    prompt_agents,
                )
            except (KeyError, TypeError, ValueError, LlmAgentError) as exc:  # pragma: no cover
                logger.warning(
                    "OpenAI growth-plan generation failed; falling back to deterministic builder.",
                    exc_info=exc,
                )

        return self._build_growth_plan_deterministic(session, resources_by_skill, max_themes)

    def _build_growth_plan_deterministic(
        self,
        session: StoredSession,
        resources_by_skill: dict[str, list[LearningResource]],
        max_themes: int,
    ) -> tuple[GrowthPlan, dict[str, TaskDetail], dict[str, str]]:
        if session.profile is None or session.intake is None:
            raise ValueError("Cannot build a growth plan without a generated profile.")

        prioritized_growth_ids = [rating.id for rating in session.profile.growth_areas][:max_themes]
        strengths_text = ", ".join(skill.name.lower() for skill in session.profile.strengths[:2])
        growth_text = ", ".join(skill.name.lower() for skill in session.profile.growth_areas[:2])
        theme_entries: list[GrowthTheme] = []
        task_details: dict[str, TaskDetail] = {}
        task_theme_map: dict[str, str] = {}
        current_task_id: str | None = None
        current_theme_id: str | None = None

        for skill_id in prioritized_growth_ids:
            template = THEME_TEMPLATES.get(skill_id)
            if template is None:
                continue

            theme_tasks: list[TaskSummary] = []
            theme_total_minutes = 0
            for task_template in template["tasks"]:
                task_id = _generate_identifier(f"task_{skill_id}")
                task_status = TaskStatus.CURRENT if current_task_id is None else TaskStatus.UPCOMING
                if current_task_id is None:
                    current_task_id = task_id
                    current_theme_id = skill_id

                why_recommended = [
                    f"{SKILL_LIBRARY[skill_id]['name']} is one of your most relevant growth areas.",
                    (
                        f"It supports your target role of "
                        f"{session.intake.target_role or 'continued growth'}."
                    ),
                    (
                        f"The task uses "
                        f"{_friendly_enum(session.preferences.learning_style.value)}-friendly "
                        "resources from your enabled sources."
                    ),
                ]
                if session.profile.growth_areas:
                    why_recommended.append(
                        f"Current signals suggest a gap in "
                        f"{session.profile.growth_areas[0].name.lower()} "
                        "that this task can narrow."
                    )

                expected_outcomes = list(task_template["expected_outcomes"])
                expected_outcomes.append(
                    f"Relate {SKILL_LIBRARY[skill_id]['name'].lower()} "
                    "to your current work context."
                )
                task_detail = TaskDetail(
                    id=task_id,
                    title=str(task_template["title"]),
                    growth_area=str(SKILL_LIBRARY[skill_id]["name"]),
                    xp_reward=int(task_template["xp_reward"]),
                    estimated_duration_minutes=int(task_template["estimated_duration_minutes"]),
                    status=task_status,
                    rationale_snippet=(
                        f"Prioritized because "
                        f"{SKILL_LIBRARY[skill_id]['name'].lower()} is a visible "
                        "growth opportunity right now."
                    ),
                    description=str(task_template["description"]),
                    why_recommended=why_recommended,
                    expected_outcomes=expected_outcomes,
                    resources=resources_by_skill.get(skill_id, []),
                )
                task_details[task_id] = task_detail
                task_theme_map[task_id] = skill_id
                theme_tasks.append(
                    TaskSummary(
                        id=task_id,
                        title=task_detail.title,
                        growth_area=task_detail.growth_area,
                        xp_reward=task_detail.xp_reward,
                        estimated_duration_minutes=task_detail.estimated_duration_minutes,
                        status=task_detail.status,
                        rationale_snippet=task_detail.rationale_snippet,
                    )
                )
                theme_total_minutes += task_detail.estimated_duration_minutes

            theme_entries.append(
                GrowthTheme(
                    id=skill_id,
                    name=str(template["name"]),
                    description=str(template["description"]),
                    why_it_matters=str(template["why_it_matters"]),
                    estimated_effort_hours=round(theme_total_minutes / 60, 1),
                    progress_percent=0,
                    tasks=theme_tasks,
                )
            )

        summary = (
            f"Personalized learning journey toward "
            f"{session.intake.current_focus or session.intake.target_role or 'stronger delivery'}."
        )
        if self._settings.llm_mode == "openai":
            why_this_path = (
                "This path is currently generated deterministically, but the backend is already "
                "configured to switch to an OpenAI-backed planner once the credentials are added."
            )
        else:
            why_this_path = (
                f"This path prioritizes {growth_text} because your profile already "
                f"shows strength in {strengths_text}, and the biggest remaining "
                "gaps appear in the areas above."
            )

        growth_plan = GrowthPlan(
            growth_plan_id=_generate_identifier("gp"),
            summary=summary,
            why_this_path=why_this_path,
            current_theme_id=current_theme_id,
            current_task_id=current_task_id,
            themes=theme_entries,
        )
        return growth_plan, task_details, task_theme_map

    def _build_growth_plan_with_llm(
        self,
        session: StoredSession,
        resources_by_skill: dict[str, list[LearningResource]],
        max_themes: int,
        prompt_agents: SkillPilotPromptAgents,
    ) -> tuple[GrowthPlan, dict[str, TaskDetail], dict[str, str]]:
        if session.profile is None or session.intake is None or session.skill_profile is None:
            raise ValueError("Cannot build a growth plan without a generated profile.")

        allowed_theme_skill_ids = [
            rating.id for rating in session.profile.growth_areas[:max_themes]
        ]
        resources_payload = {
            skill_id: [resource.model_dump(mode="json") for resource in resources]
            for skill_id, resources in resources_by_skill.items()
        }
        llm_output = prompt_agents.generate_growth_plan(
            {
                "session_json": json_dumps(session.to_summary().model_dump(mode="json")),
                "profile_json": json_dumps(session.profile.model_dump(mode="json")),
                "skill_profile_json": json_dumps(session.skill_profile.model_dump(mode="json")),
                "preferences_json": json_dumps(session.preferences.model_dump(mode="json")),
                "allowed_theme_skill_ids_json": json_dumps(allowed_theme_skill_ids),
                "theme_templates_json": json_dumps(
                    {skill_id: THEME_TEMPLATES[skill_id] for skill_id in allowed_theme_skill_ids}
                ),
                "resources_by_skill_json": json_dumps(resources_payload),
            }
        )
        return self._growth_plan_from_llm_output(
            llm_output=llm_output,
            resources_by_skill=resources_by_skill,
            allowed_theme_skill_ids=allowed_theme_skill_ids,
        )

    def _growth_plan_from_llm_output(
        self,
        *,
        llm_output: GrowthPlanOutput,
        resources_by_skill: dict[str, list[LearningResource]],
        allowed_theme_skill_ids: list[str],
    ) -> tuple[GrowthPlan, dict[str, TaskDetail], dict[str, str]]:
        seen_theme_ids: set[str] = set()
        ordered_themes: list[Any] = []
        theme_by_skill_id = {theme.skill_id: theme for theme in llm_output.themes}
        for skill_id in allowed_theme_skill_ids:
            theme = theme_by_skill_id.get(skill_id)
            if theme is not None and skill_id not in seen_theme_ids:
                ordered_themes.append(theme)
                seen_theme_ids.add(skill_id)

        if len(ordered_themes) != len(allowed_theme_skill_ids):
            raise ValueError("LLM output did not return the expected ordered themes.")

        theme_entries: list[GrowthTheme] = []
        task_details: dict[str, TaskDetail] = {}
        task_theme_map: dict[str, str] = {}
        current_task_id: str | None = None
        current_theme_id: str | None = None

        for theme in ordered_themes:
            skill_id = theme.skill_id
            skill_name = str(SKILL_LIBRARY[skill_id]["name"])
            theme_resources_by_id = {
                resource.id: resource for resource in resources_by_skill.get(skill_id, [])
            }
            theme_tasks: list[TaskSummary] = []
            theme_total_minutes = 0

            for task_draft in theme.tasks:
                task_id = _generate_identifier(f"task_{skill_id}")
                task_status = TaskStatus.CURRENT if current_task_id is None else TaskStatus.UPCOMING
                if current_task_id is None:
                    current_task_id = task_id
                    current_theme_id = skill_id

                selected_resources = [
                    theme_resources_by_id[resource_id]
                    for resource_id in task_draft.resource_ids
                    if resource_id in theme_resources_by_id
                ]
                if not selected_resources:
                    selected_resources = resources_by_skill.get(skill_id, [])[:3]

                task_detail = TaskDetail(
                    id=task_id,
                    title=task_draft.title,
                    growth_area=skill_name,
                    xp_reward=task_draft.xp_reward,
                    estimated_duration_minutes=task_draft.estimated_duration_minutes,
                    status=task_status,
                    rationale_snippet=task_draft.rationale_snippet,
                    description=task_draft.description,
                    why_recommended=task_draft.why_recommended,
                    expected_outcomes=task_draft.expected_outcomes,
                    resources=selected_resources,
                )
                task_details[task_id] = task_detail
                task_theme_map[task_id] = skill_id
                theme_tasks.append(
                    TaskSummary(
                        id=task_id,
                        title=task_detail.title,
                        growth_area=task_detail.growth_area,
                        xp_reward=task_detail.xp_reward,
                        estimated_duration_minutes=task_detail.estimated_duration_minutes,
                        status=task_detail.status,
                        rationale_snippet=task_detail.rationale_snippet,
                    )
                )
                theme_total_minutes += task_detail.estimated_duration_minutes

            theme_entries.append(
                GrowthTheme(
                    id=skill_id,
                    name=theme.name,
                    description=theme.description,
                    why_it_matters=theme.why_it_matters,
                    estimated_effort_hours=round(theme_total_minutes / 60, 1),
                    progress_percent=0,
                    tasks=theme_tasks,
                )
            )

        growth_plan = GrowthPlan(
            growth_plan_id=_generate_identifier("gp"),
            summary=llm_output.summary,
            why_this_path=llm_output.why_this_path,
            current_theme_id=current_theme_id,
            current_task_id=current_task_id,
            themes=theme_entries,
        )
        return growth_plan, task_details, task_theme_map


class _Orchestrator:
    """Central orchestrator coordinating profile analysis and growth-plan generation."""

    def __init__(
        self,
        store: JsonStore,
        ingestion_agent: _IngestionAgent,
        growth_plan_agent: _GrowthPlanAgent,
    ) -> None:
        self._store = store
        self._ingestion_agent = ingestion_agent
        self._growth_plan_agent = growth_plan_agent

    def process_profile_analysis(self, session_id: str, job_id: str) -> None:
        """Generate the learner profile for a session."""
        try:
            self._update_job(
                job_id,
                status=JobState.RUNNING,
                stage="extracting_skills",
                progress=20,
            )
            session = self._require_session(session_id)
            profile, skill_profile = self._ingestion_agent.build_profile(session)
            session.display_name = profile.display_name
            session.profile = profile
            session.skill_profile = skill_profile
            session.profile_ready = True
            session.status = SessionStatus.PROFILE_READY
            session.recommended_route = "/sources"
            session.updated_at = _utc_now()
            self._store.save_session(session)
            self._update_job(job_id, status=JobState.RUNNING, stage="profile_ready", progress=85)
            self._update_job(
                job_id,
                status=JobState.COMPLETED,
                stage="completed",
                progress=100,
                result=JobResult(profile_id=profile.profile_id, recommended_route="/sources"),
            )
        except (KeyError, TypeError, ValueError) as exc:  # pragma: no cover
            self._update_job(
                job_id,
                status=JobState.FAILED,
                stage="failed",
                progress=100,
                error=JobError(code="PROFILE_ANALYSIS_FAILED", message=str(exc)),
            )

    def process_growth_plan(
        self,
        session_id: str,
        job_id: str,
        request: GrowthPlanGenerateRequest,
    ) -> None:
        """Generate the growth plan and related dashboard/task projections."""
        try:
            self._update_job(
                job_id,
                status=JobState.RUNNING,
                stage="collecting_resources",
                progress=25,
            )
            session = self._require_session(session_id)
            if session.profile is None:
                raise ValueError("Cannot generate a growth plan before a profile exists.")

            resources_by_skill = {
                rating.id: self._ingestion_agent.collect_resources(
                    session=session,
                    skill_id=rating.id,
                    selected_sources=session.selected_sources,
                    preferences=session.preferences,
                )
                for rating in session.profile.growth_areas[: request.max_themes]
            }
            self._update_job(
                job_id,
                status=JobState.RUNNING,
                stage="building_growth_plan",
                progress=70,
            )
            growth_plan, task_details, task_theme_map = self._growth_plan_agent.build_growth_plan(
                session=session,
                resources_by_skill=resources_by_skill,
                max_themes=request.max_themes,
            )
            session.growth_plan = growth_plan
            session.tasks = task_details
            session.task_theme_map = task_theme_map
            session.growth_plan_ready = True
            session.onboarding_complete = True
            session.status = SessionStatus.GROWTH_PLAN_READY
            session.recommended_route = "/dashboard"
            session.active_task_id = growth_plan.current_task_id
            session.updated_at = _utc_now()
            _sync_session_views(session)
            self._store.save_session(session)
            self._update_job(
                job_id,
                status=JobState.COMPLETED,
                stage="completed",
                progress=100,
                result=JobResult(
                    growth_plan_id=growth_plan.growth_plan_id,
                    recommended_route="/dashboard",
                ),
            )
        except (KeyError, TypeError, ValueError) as exc:  # pragma: no cover
            self._update_job(
                job_id,
                status=JobState.FAILED,
                stage="failed",
                progress=100,
                error=JobError(code="GROWTH_PLAN_FAILED", message=str(exc)),
            )

    def _require_session(self, session_id: str) -> StoredSession:
        session = self._store.get_session(session_id)
        if session is None:
            raise ValueError(f"Session {session_id} does not exist.")
        return session

    def _update_job(
        self,
        job_id: str,
        status: JobState,
        stage: str,
        progress: int,
        result: JobResult | None = None,
        error: JobError | None = None,
    ) -> None:
        job = self._store.get_job(job_id)
        if job is None:
            raise ValueError(f"Job {job_id} does not exist.")
        job.status = status
        job.current_stage = stage
        job.progress_percent = progress
        job.updated_at = _utc_now()
        job.result = result
        job.error = error
        self._store.save_job(job)


def _sync_session_views(session: StoredSession) -> None:
    """Rebuild growth-plan task summaries and dashboard projections."""
    growth_plan = session.growth_plan
    if growth_plan is None:
        return

    ordered_tasks: list[TaskDetail] = []
    current_theme_name = growth_plan.themes[0].name if growth_plan.themes else "Growth"
    for theme in growth_plan.themes:
        completed_count = 0
        refreshed_tasks: list[TaskSummary] = []
        for task_summary in theme.tasks:
            task_detail = session.tasks[task_summary.id]
            refreshed_tasks.append(
                TaskSummary(
                    id=task_detail.id,
                    title=task_detail.title,
                    growth_area=task_detail.growth_area,
                    xp_reward=task_detail.xp_reward,
                    estimated_duration_minutes=task_detail.estimated_duration_minutes,
                    status=task_detail.status,
                    rationale_snippet=task_detail.rationale_snippet,
                )
            )
            ordered_tasks.append(task_detail)
            if task_detail.status == TaskStatus.COMPLETED:
                completed_count += 1
            if task_detail.id == session.active_task_id:
                current_theme_name = theme.name
                growth_plan.current_theme_id = theme.id

        theme.tasks = refreshed_tasks
        if refreshed_tasks:
            theme.progress_percent = _clamp((completed_count / len(refreshed_tasks)) * 100, 0, 100)
        else:
            theme.progress_percent = 0

    growth_plan.current_task_id = session.active_task_id
    session.current_level = _level_from_xp(session.total_xp)
    session.focus_area = current_theme_name
    session.active_growth_path = growth_plan.summary

    next_action = next(
        (task for task in ordered_tasks if task.status == TaskStatus.CURRENT),
        ordered_tasks[-1] if ordered_tasks else None,
    )
    if next_action is None:
        return

    session.dashboard = DashboardView(
        display_name=session.display_name,
        current_level=session.current_level,
        total_xp=session.total_xp,
        weekly_xp=session.weekly_xp,
        streak_days=session.streak_days,
        completed_tasks=session.completed_tasks,
        focus_area=session.focus_area,
        active_growth_path=session.active_growth_path,
        next_action=TaskSummary(
            id=next_action.id,
            title=next_action.title,
            growth_area=next_action.growth_area,
            xp_reward=next_action.xp_reward,
            estimated_duration_minutes=next_action.estimated_duration_minutes,
            status=next_action.status,
            rationale_snippet=next_action.rationale_snippet,
        ),
        progress_summary=[
            GrowthThemeProgress(
                theme_id=theme.id,
                name=theme.name,
                progress_percent=theme.progress_percent,
            )
            for theme in growth_plan.themes
        ],
    )


class SkillPilotService:
    """Facade for the SkillPilot API surface."""

    def __init__(self, settings: Settings, store: JsonStore) -> None:
        """Initialize the service and its collaborators."""
        self._settings = settings
        self._store = store
        self._source_catalog = [
            SourceDefinition.model_validate(source_payload)
            for source_payload in DEFAULT_SOURCE_CATALOG
        ]
        self._ingestion_agent = _IngestionAgent(
            settings=settings,
            store=store,
            source_catalog=self._source_catalog,
        )
        self._growth_plan_agent = _GrowthPlanAgent(settings=settings)
        self._orchestrator = _Orchestrator(
            store=store,
            ingestion_agent=self._ingestion_agent,
            growth_plan_agent=self._growth_plan_agent,
        )

    def create_session(self, request: SessionCreateRequest | None = None) -> SessionSummary:
        """Create a new persisted learner session."""
        request = request or SessionCreateRequest()
        session_id = _generate_identifier("sess")
        selected_sources = [
            SourceSelection(**source.model_dump(), enabled=source.enabled_by_default)
            for source in self._source_catalog
        ]
        session = StoredSession(
            session_id=session_id,
            status=SessionStatus.NEW,
            onboarding_complete=False,
            profile_ready=False,
            growth_plan_ready=False,
            recommended_route="/onboarding",
            display_name=request.display_name or "Learner",
            locale=request.locale,
            timezone=request.timezone,
            current_level=1,
            total_xp=0,
            weekly_xp=0,
            streak_days=0,
            completed_tasks=0,
            focus_area="Foundations",
            active_growth_path="Initial onboarding",
            updated_at=_utc_now(),
            preferences=Preferences(**DEFAULT_PREFERENCES),
            selected_sources=selected_sources,
        )
        self._store.save_session(session)
        return session.to_summary()

    def get_session(self, session_id: str) -> SessionSummary:
        """Return the summary for a persisted session."""
        return self._require_session(session_id).to_summary()

    def submit_profile_intake(
        self,
        session_id: str,
        payload: ProfileIntakePayload,
        background_tasks: BackgroundTasks,
    ) -> AsyncJobAccepted:
        """Persist intake data and queue learner profile generation."""
        session = self._require_session(session_id)
        session.intake = payload
        session.status = SessionStatus.ONBOARDING_IN_PROGRESS
        session.recommended_route = "/onboarding"
        session.updated_at = _utc_now()
        self._store.save_session(session)

        job = self._create_job(session_id=session_id, job_type=JobType.PROFILE_ANALYSIS)
        background_tasks.add_task(
            self._orchestrator.process_profile_analysis,
            session_id,
            job.job_id,
        )
        return AsyncJobAccepted(
            job_id=job.job_id,
            session_id=session_id,
            job_type=job.job_type,
            status=job.status,
            current_stage=job.current_stage,
            progress_percent=job.progress_percent,
            poll_url=f"/v1/jobs/{job.job_id}",
        )

    def submit_quiz_responses(
        self,
        session_id: str,
        request: QuizSubmissionRequest,
    ) -> ProfileSummary:
        """Apply quiz answers and immediately refine the learner profile."""
        session = self._require_session(session_id)
        if session.intake is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile intake must be completed before quiz responses are submitted.",
            )

        profile, skill_profile = self._ingestion_agent.build_profile(session, request.responses)
        session.display_name = profile.display_name
        session.profile = profile
        session.skill_profile = skill_profile
        session.profile_ready = True
        session.status = SessionStatus.PROFILE_READY
        session.recommended_route = "/sources"
        session.updated_at = _utc_now()
        self._store.save_session(session)
        return profile

    def get_profile(self, session_id: str) -> ProfileSummary:
        """Return the current learner profile."""
        session = self._require_session(session_id)
        if session.profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learner profile has not been generated yet.",
            )
        return session.profile

    def get_source_catalog(self) -> SourceCatalogResponse:
        """Return the available source catalog."""
        return SourceCatalogResponse(sources=self._source_catalog)

    def get_selected_sources(self, session_id: str) -> SourceSelectionState:
        """Return enabled and disabled sources for a session."""
        session = self._require_session(session_id)
        return SourceSelectionState(session_id=session_id, sources=session.selected_sources)

    def update_selected_sources(
        self,
        session_id: str,
        request: SourceSelectionRequest,
    ) -> SourceSelectionState:
        """Update source-selection preferences for a session."""
        session = self._require_session(session_id)
        selection_by_id = {selection.id: selection.enabled for selection in request.sources}
        updated_sources: list[SourceSelection] = []
        for source_definition in self._source_catalog:
            updated_sources.append(
                SourceSelection(
                    **source_definition.model_dump(),
                    enabled=selection_by_id.get(
                        source_definition.id,
                        source_definition.enabled_by_default,
                    ),
                )
            )
        session.selected_sources = updated_sources
        session.updated_at = _utc_now()
        self._store.save_session(session)
        return SourceSelectionState(session_id=session_id, sources=updated_sources)

    def get_preferences(self, session_id: str) -> Preferences:
        """Return preference settings for a session."""
        return self._require_session(session_id).preferences

    def update_preferences(self, session_id: str, request: Preferences) -> Preferences:
        """Update preference settings for a session."""
        session = self._require_session(session_id)
        session.preferences = request
        session.updated_at = _utc_now()
        self._store.save_session(session)
        return session.preferences

    def generate_growth_plan(
        self,
        session_id: str,
        request: GrowthPlanGenerateRequest,
        background_tasks: BackgroundTasks,
    ) -> AsyncJobAccepted:
        """Queue growth-plan generation for a prepared learner profile."""
        session = self._require_session(session_id)
        if session.profile is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A learner profile must exist before generating a growth plan.",
            )

        job = self._create_job(session_id=session_id, job_type=JobType.GROWTH_PLAN_GENERATION)
        background_tasks.add_task(
            self._orchestrator.process_growth_plan,
            session_id,
            job.job_id,
            request,
        )
        return AsyncJobAccepted(
            job_id=job.job_id,
            session_id=session_id,
            job_type=job.job_type,
            status=job.status,
            current_stage=job.current_stage,
            progress_percent=job.progress_percent,
            poll_url=f"/v1/jobs/{job.job_id}",
        )

    def get_job_status(self, job_id: str) -> JobStatusResponse:
        """Return the status for an asynchronous job."""
        job = self._store.get_job(job_id)
        if job is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
        return job

    def get_dashboard(self, session_id: str) -> DashboardView:
        """Return the dashboard projection for a session."""
        session = self._require_session(session_id)
        if session.dashboard is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dashboard is not available until a growth plan is generated.",
            )
        return session.dashboard

    def get_skill_profile(self, session_id: str) -> SkillProfileView:
        """Return the detailed skill-profile projection for a session."""
        session = self._require_session(session_id)
        if session.skill_profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill profile is not available until a learner profile is generated.",
            )
        return session.skill_profile

    def get_growth_plan(self, session_id: str) -> GrowthPlan:
        """Return the active growth plan for a session."""
        session = self._require_session(session_id)
        if session.growth_plan is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Growth plan has not been generated yet.",
            )
        return session.growth_plan

    def get_task_detail(self, session_id: str, task_id: str) -> TaskDetail:
        """Return a task detail projection for a session."""
        session = self._require_session(session_id)
        task = session.tasks.get(task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
        return task

    def complete_task(
        self,
        session_id: str,
        task_id: str,
        request: TaskCompletionRequest | None = None,
    ) -> TaskCompletionResponse:
        """Mark a task complete and refresh the learner dashboard."""
        del request
        session = self._require_session(session_id)
        if session.growth_plan is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A growth plan must exist before tasks can be completed.",
            )

        task = session.tasks.get(task_id)
        if task is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
        if task.status == TaskStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task has already been completed.",
            )

        awarded_xp = task.xp_reward
        was_current = task.status == TaskStatus.CURRENT
        task.status = TaskStatus.COMPLETED
        session.tasks[task_id] = task
        session.total_xp += awarded_xp
        session.weekly_xp += awarded_xp
        session.completed_tasks += 1
        session.streak_days += 1

        next_task_id = None
        ordered_task_ids = self._ordered_task_ids(session)
        if was_current:
            for ordered_task_id in ordered_task_ids:
                if session.tasks[ordered_task_id].status == TaskStatus.CURRENT:
                    session.tasks[ordered_task_id].status = TaskStatus.UPCOMING

            for ordered_task_id in ordered_task_ids:
                if session.tasks[ordered_task_id].status == TaskStatus.UPCOMING:
                    session.tasks[ordered_task_id].status = TaskStatus.CURRENT
                    next_task_id = ordered_task_id
                    break
        else:
            next_task_id = next(
                (
                    ordered_task_id
                    for ordered_task_id in ordered_task_ids
                    if session.tasks[ordered_task_id].status == TaskStatus.CURRENT
                ),
                None,
            )

        session.active_task_id = next_task_id
        session.updated_at = _utc_now()
        _sync_session_views(session)
        self._store.save_session(session)

        next_route = f"/task/{next_task_id}" if next_task_id else "/dashboard"
        return TaskCompletionResponse(
            task_id=task_id,
            status=TaskStatus.COMPLETED,
            awarded_xp=awarded_xp,
            total_xp=session.total_xp,
            current_level=session.current_level,
            streak_days=session.streak_days,
            next_task_id=next_task_id,
            next_recommended_route=next_route,
        )

    def _create_job(self, session_id: str, job_type: JobType) -> JobStatusResponse:
        job = JobStatusResponse(
            job_id=_generate_identifier("job"),
            session_id=session_id,
            job_type=job_type,
            status=JobState.QUEUED,
            current_stage="queued",
            progress_percent=0,
            created_at=_utc_now(),
            updated_at=_utc_now(),
        )
        self._store.save_job(job)
        return job

    def _ordered_task_ids(self, session: StoredSession) -> list[str]:
        if session.growth_plan is None:
            return []

        ordered_ids: list[str] = []
        for theme in session.growth_plan.themes:
            ordered_ids.extend(task.id for task in theme.tasks)
        return ordered_ids

    def _require_session(self, session_id: str) -> StoredSession:
        session = self._store.get_session(session_id)
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
        return session
