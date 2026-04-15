"""DTOs for the SkillPilot backend API and persistence layer."""

from datetime import datetime
from enum import Enum

from app.dtos.base import CamelModel
from pydantic import ConfigDict, Field, model_validator


class SessionStatus(str, Enum):
    """Lifecycle states for a learner session."""

    NEW = "new"
    ONBOARDING_IN_PROGRESS = "onboarding_in_progress"
    PROFILE_READY = "profile_ready"
    GROWTH_PLAN_READY = "growth_plan_ready"


class JobType(str, Enum):
    """Supported background job types."""

    PROFILE_ANALYSIS = "profile_analysis"
    GROWTH_PLAN_GENERATION = "growth_plan_generation"


class JobState(str, Enum):
    """States for asynchronous jobs."""

    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SkillBand(str, Enum):
    """Skill maturity bands."""

    EMERGING = "emerging"
    DEVELOPING = "developing"
    STRONG = "strong"
    ADVANCED = "advanced"


class Priority(str, Enum):
    """Relative importance of a growth area."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SourceCategory(str, Enum):
    """High-level source categories."""

    INTERNAL = "internal"
    EXTERNAL = "external"


class IntegrationMode(str, Enum):
    """Integration approaches for knowledge sources."""

    LOCAL_JSON = "local_json"
    MCP_CONNECTOR = "mcp_connector"
    HTTP_API = "http_api"


class SourceStatus(str, Enum):
    """Availability state for a source."""

    AVAILABLE = "available"
    COMING_SOON = "coming_soon"


class LearningStyle(str, Enum):
    """How the learner prefers to learn."""

    HANDS_ON = "hands_on"
    READING = "reading"
    VIDEO = "video"
    DISCUSSION = "discussion"


class GrowthFocus(str, Enum):
    """Primary growth goal."""

    CAREER_GROWTH = "career_growth"
    MASTERY = "mastery"
    EXPLORATION = "exploration"
    DELIVERY_IMPACT = "delivery_impact"


class CognitiveApproach(str, Enum):
    """How the learner prefers to approach new concepts."""

    THEORY_FIRST = "theory_first"
    PRACTICE_FIRST = "practice_first"
    STRUCTURED = "structured"
    EXPLORATORY = "exploratory"


class RecommendationCadence(str, Enum):
    """Recommendation cadence."""

    DAILY = "daily"
    WEEKLY = "weekly"


class TaskStatus(str, Enum):
    """Task progression state."""

    UPCOMING = "upcoming"
    CURRENT = "current"
    COMPLETED = "completed"


class ResourceType(str, Enum):
    """Learning resource types."""

    INTERNAL_DOC = "internal_doc"
    PR_FEEDBACK = "pr_feedback"
    COACHING_NOTE = "coaching_note"
    OFFICIAL_DOC = "official_doc"
    BLOG = "blog"
    VIDEO = "video"
    PAPER = "paper"
    SEARCH_RESULT = "search_result"


class Capability(str, Enum):
    """Capabilities exposed by a source."""

    PROFILE_ANALYSIS = "profile_analysis"
    RECOMMENDATION_GENERATION = "recommendation_generation"
    EVIDENCE_LOOKUP = "evidence_lookup"
    LEARNING_RESOURCES = "learning_resources"


class HealthStatus(CamelModel):
    """Health response."""

    status: str


class SessionCreateRequest(CamelModel):
    """Request body for creating a session."""

    display_name: str | None = None
    locale: str | None = None
    timezone: str | None = None


class ProfileIntakePayload(CamelModel):
    """Unified onboarding payload used by JSON and multipart intake."""

    model_config = ConfigDict(extra="ignore")

    import_mode: str = "summary_only"
    resume_text: str | None = None
    resume_filename: str | None = None
    linkedin_profile_url: str | None = None
    professional_summary: str | None = None
    job_description_text: str | None = None
    current_role: str | None = None
    years_of_experience: float | None = None
    target_role: str | None = None
    current_focus: str | None = None

    @model_validator(mode="after")
    def validate_content(self) -> "ProfileIntakePayload":
        """Ensure the intake contains enough profile information."""
        if not any(
            [
                self.resume_text,
                self.linkedin_profile_url,
                self.professional_summary,
            ]
        ):
            msg = "One of resumeText, linkedinProfileUrl, or professionalSummary must be provided."
            raise ValueError(msg)
        return self


class QuizResponse(CamelModel):
    """Single adaptive quiz response."""

    question_id: str
    response_type: str
    numeric_value: float | None = None
    option_value: str | None = None
    text_value: str | None = None


class QuizSubmissionRequest(CamelModel):
    """Quiz submission payload."""

    skipped: bool = False
    responses: list[QuizResponse] = Field(default_factory=list)


class SourceSelectionUpdate(CamelModel):
    """Source toggle payload used when updating source preferences."""

    model_config = ConfigDict(extra="ignore")

    id: str
    enabled: bool


class SourceSelectionRequest(CamelModel):
    """Request body for source selection updates."""

    sources: list[SourceSelectionUpdate]


class Preferences(CamelModel):
    """Learner recommendation preferences."""

    learning_style: LearningStyle
    growth_focus: GrowthFocus
    cognitive_approach: CognitiveApproach
    hours_per_week: int = Field(ge=1, le=20)
    recommendation_cadence: RecommendationCadence
    weekly_nudges_enabled: bool = True


class GrowthPlanGenerateRequest(CamelModel):
    """Request payload for growth-plan generation."""

    force_refresh: bool = False
    max_themes: int = Field(default=4, ge=3, le=5)


class TaskCompletionRequest(CamelModel):
    """Optional task completion metadata."""

    reflection: str | None = None
    evidence_note: str | None = None
    completed_at: datetime | None = None


class JobResult(CamelModel):
    """Result pointers for a completed job."""

    profile_id: str | None = None
    growth_plan_id: str | None = None
    recommended_route: str | None = None


class JobError(CamelModel):
    """Failure information for a background job."""

    code: str
    message: str


class JobStatusResponse(CamelModel):
    """Status payload for a background job."""

    job_id: str
    session_id: str
    job_type: JobType
    status: JobState
    current_stage: str | None = None
    progress_percent: int = Field(default=0, ge=0, le=100)
    created_at: datetime
    updated_at: datetime
    result: JobResult | None = None
    error: JobError | None = None


class AsyncJobAccepted(CamelModel):
    """Initial response for an accepted asynchronous job."""

    job_id: str
    session_id: str
    job_type: JobType
    status: JobState
    current_stage: str | None = None
    progress_percent: int = Field(default=0, ge=0, le=100)
    poll_url: str


class SkillEvidence(CamelModel):
    """Evidence associated with a skill rating."""

    source_id: str
    source_category: SourceCategory | str
    title: str
    summary: str
    link: str | None = None


class SkillRating(CamelModel):
    """Skill maturity data."""

    id: str
    name: str
    category: str
    level_percent: int = Field(ge=0, le=100)
    band: SkillBand
    confidence: float = Field(ge=0, le=1)
    priority: Priority | None = None
    evidence: list[SkillEvidence] = Field(default_factory=list)


class ProfileSummary(CamelModel):
    """Top-level learner profile summary."""

    profile_id: str
    display_name: str
    current_role: str | None = None
    target_role: str | None = None
    years_of_experience: float | None = None
    current_focus: str | None = None
    maturity_snapshot: str
    goal_direction: str
    explanation: str
    missing_information: list[str] = Field(default_factory=list)
    strengths: list[SkillRating]
    growth_areas: list[SkillRating]


class SourceDefinition(CamelModel):
    """Source metadata returned to the frontend."""

    id: str
    name: str
    category: SourceCategory
    integration_mode: IntegrationMode
    is_mocked: bool
    enabled_by_default: bool
    description: str
    capabilities: list[Capability]
    status: SourceStatus


class SourceSelection(SourceDefinition):
    """Session-specific source metadata with enabled state."""

    enabled: bool


class SourceCatalogResponse(CamelModel):
    """Catalog of all available sources."""

    sources: list[SourceDefinition]


class SourceSelectionState(CamelModel):
    """Session-specific source state."""

    session_id: str
    sources: list[SourceSelection]


class TargetRoleComparison(CamelModel):
    """Comparison between current skill profile and target role."""

    title: str
    gap_skills: list[str]
    narrative: str


class TaskSummary(CamelModel):
    """Summary view of a task."""

    id: str
    title: str
    growth_area: str
    xp_reward: int = Field(ge=0)
    estimated_duration_minutes: int = Field(ge=5)
    status: TaskStatus
    rationale_snippet: str | None = None


class LearningResource(CamelModel):
    """Learning resource associated with a task."""

    id: str
    title: str
    resource_type: ResourceType
    source_id: str
    source_category: SourceCategory
    integration_mode: IntegrationMode
    url: str | None = None
    artifact_path: str | None = None
    rationale: str


class TaskDetail(TaskSummary):
    """Detailed task information."""

    description: str
    why_recommended: list[str]
    expected_outcomes: list[str]
    resources: list[LearningResource]


class GrowthThemeProgress(CamelModel):
    """Progress summary for a growth theme."""

    theme_id: str
    name: str
    progress_percent: int = Field(ge=0, le=100)


class GrowthTheme(CamelModel):
    """Growth-plan theme."""

    id: str
    name: str
    description: str
    why_it_matters: str
    estimated_effort_hours: float
    progress_percent: int = Field(ge=0, le=100)
    tasks: list[TaskSummary]


class GrowthPlan(CamelModel):
    """Personalized growth plan."""

    growth_plan_id: str
    summary: str
    why_this_path: str
    current_theme_id: str | None = None
    current_task_id: str | None = None
    themes: list[GrowthTheme]


class DashboardView(CamelModel):
    """Returning-user dashboard payload."""

    display_name: str
    current_level: int = Field(ge=1)
    total_xp: int = Field(ge=0)
    weekly_xp: int = Field(ge=0)
    streak_days: int = Field(ge=0)
    completed_tasks: int = Field(ge=0)
    focus_area: str
    active_growth_path: str
    next_action: TaskSummary
    progress_summary: list[GrowthThemeProgress]


class SkillProfileView(CamelModel):
    """Detailed skill profile payload."""

    target_role: TargetRoleComparison
    strengths: list[SkillRating]
    growth_areas: list[SkillRating]


class SessionSummary(CamelModel):
    """High-level session state returned to the frontend."""

    session_id: str
    status: SessionStatus
    onboarding_complete: bool
    profile_ready: bool
    growth_plan_ready: bool
    recommended_route: str
    display_name: str
    current_level: int = Field(ge=1)
    total_xp: int = Field(ge=0)
    active_task_id: str | None = None
    updated_at: datetime


class TaskCompletionResponse(CamelModel):
    """Response after marking a task complete."""

    task_id: str
    status: TaskStatus
    awarded_xp: int = Field(ge=0)
    total_xp: int = Field(ge=0)
    current_level: int = Field(ge=1)
    streak_days: int = Field(ge=0)
    next_task_id: str | None = None
    next_recommended_route: str


class ErrorResponse(CamelModel):
    """Generic error payload."""

    code: str
    message: str
    details: list[str] = Field(default_factory=list)


class StoredSession(CamelModel):
    """Session record persisted in the local JSON store."""

    session_id: str
    status: SessionStatus
    onboarding_complete: bool
    profile_ready: bool
    growth_plan_ready: bool
    recommended_route: str
    display_name: str
    locale: str | None = None
    timezone: str | None = None
    current_level: int = 1
    total_xp: int = 0
    weekly_xp: int = 0
    streak_days: int = 0
    completed_tasks: int = 0
    focus_area: str = "Foundations"
    active_growth_path: str = "Initial onboarding"
    active_task_id: str | None = None
    updated_at: datetime
    intake: ProfileIntakePayload | None = None
    profile: ProfileSummary | None = None
    preferences: Preferences
    selected_sources: list[SourceSelection]
    growth_plan: GrowthPlan | None = None
    dashboard: DashboardView | None = None
    skill_profile: SkillProfileView | None = None
    tasks: dict[str, TaskDetail] = Field(default_factory=dict)
    task_theme_map: dict[str, str] = Field(default_factory=dict)

    def to_summary(self) -> SessionSummary:
        """Return the API-facing session summary."""
        return SessionSummary(
            session_id=self.session_id,
            status=self.status,
            onboarding_complete=self.onboarding_complete,
            profile_ready=self.profile_ready,
            growth_plan_ready=self.growth_plan_ready,
            recommended_route=self.recommended_route,
            display_name=self.display_name,
            current_level=self.current_level,
            total_xp=self.total_xp,
            active_task_id=self.active_task_id,
            updated_at=self.updated_at,
        )


class StoreState(CamelModel):
    """Top-level persisted store state."""

    sessions: dict[str, StoredSession] = Field(default_factory=dict)
    jobs: dict[str, JobStatusResponse] = Field(default_factory=dict)


class InternalSourceDocument(CamelModel):
    """Mocked internal source document loaded from local JSON."""

    id: str
    title: str
    summary: str
    tags: list[str]
    artifact_path: str
    link: str | None = None
    resource_type: ResourceType


class InternalSourceBundle(CamelModel):
    """Collection of documents for a mocked internal source."""

    source_id: str
    documents: list[InternalSourceDocument]


class InternalSourcesData(CamelModel):
    """Top-level internal source JSON payload."""

    sources: list[InternalSourceBundle]
