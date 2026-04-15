// TypeScript interfaces derived from docs/skillpilot-openapi.yaml
// All property names use camelCase to match the backend's CamelModel alias.

export interface HealthStatus {
  status: string;
}

export interface SessionCreateRequest {
  displayName?: string;
  locale?: string;
  timezone?: string;
}

export type SessionStatus =
  | "new"
  | "onboarding_in_progress"
  | "profile_ready"
  | "growth_plan_ready";

export type RecommendedRoute =
  | "/onboarding"
  | "/sources"
  | "/preferences"
  | "/growth"
  | `/task/${string}`
  | "/dashboard";

export interface SessionSummary {
  sessionId: string;
  status: SessionStatus;
  onboardingComplete: boolean;
  profileReady: boolean;
  growthPlanReady: boolean;
  recommendedRoute: RecommendedRoute;
  displayName?: string;
  currentLevel?: number;
  totalXp?: number;
  activeTaskId?: string;
  updatedAt?: string;
}

// --- Onboarding / Profile ---

export type ImportMode =
  | "resume_upload"
  | "pasted_text"
  | "linkedin_import"
  | "summary_only";

export interface ProfileIntakePayload {
  importMode?: ImportMode;
  resumeText?: string;
  linkedinProfileUrl?: string;
  professionalSummary?: string;
  jobDescriptionText?: string;
  currentRole?: string;
  yearsOfExperience?: number;
  targetRole?: string;
  currentFocus?: string;
}

export type JobType = "profile_analysis" | "growth_plan_generation";
export type JobState = "queued" | "running" | "completed" | "failed";

export interface AsyncJobAccepted {
  jobId: string;
  sessionId: string;
  jobType: JobType;
  status: JobState;
  currentStage?: string;
  progressPercent?: number;
  pollUrl: string;
}

export interface JobResult {
  profileId?: string;
  growthPlanId?: string;
  recommendedRoute?: string;
}

export interface JobError {
  code: string;
  message: string;
}

export interface JobStatus {
  jobId: string;
  sessionId: string;
  jobType: JobType;
  status: JobState;
  currentStage?: string;
  progressPercent?: number;
  createdAt: string;
  updatedAt: string;
  result?: JobResult;
  error?: JobError;
}

export type QuizResponseType = "slider" | "choice" | "free_text";

export interface QuizResponse {
  questionId: string;
  responseType: QuizResponseType;
  numericValue?: number;
  optionValue?: string;
  textValue?: string;
}

export interface QuizSubmissionRequest {
  skipped?: boolean;
  responses: QuizResponse[];
}

export type SkillBand = "emerging" | "developing" | "strong" | "advanced";
export type SkillPriority = "low" | "medium" | "high";

export interface SkillEvidence {
  sourceId: string;
  sourceCategory: "internal" | "external" | "self_reported";
  title: string;
  summary: string;
  link?: string;
}

export interface SkillRating {
  id: string;
  name: string;
  category?: string;
  levelPercent: number;
  band: SkillBand;
  confidence: number;
  priority?: SkillPriority;
  evidence?: SkillEvidence[];
}

export interface ProfileSummary {
  profileId: string;
  displayName: string;
  currentRole?: string;
  targetRole?: string;
  yearsOfExperience?: number;
  currentFocus?: string;
  maturitySnapshot: string;
  goalDirection: string;
  explanation?: string;
  missingInformation?: string[];
  strengths: SkillRating[];
  growthAreas: SkillRating[];
}

// --- Sources ---

export type SourceCategory = "internal" | "external";
export type IntegrationMode = "local_json" | "mcp_connector" | "http_api";
export type SourceCapability =
  | "profile_analysis"
  | "recommendation_generation"
  | "evidence_lookup"
  | "learning_resources";
export type SourceStatus = "available" | "coming_soon";

export interface SourceDefinition {
  id: string;
  name: string;
  category: SourceCategory;
  integrationMode: IntegrationMode;
  isMocked: boolean;
  enabledByDefault: boolean;
  description?: string;
  capabilities: SourceCapability[];
  status?: SourceStatus;
}

export interface SourceCatalogResponse {
  sources: SourceDefinition[];
}

export interface SourceSelection extends SourceDefinition {
  enabled: boolean;
}

export interface SourceSelectionRequest {
  sources: SourceSelection[];
}

export interface SourceSelectionState {
  sessionId: string;
  sources: SourceSelection[];
}

// --- Preferences ---

export type LearningStyle = "hands_on" | "reading" | "video" | "discussion";
export type GrowthFocus =
  | "career_growth"
  | "mastery"
  | "exploration"
  | "delivery_impact";
export type CognitiveApproach =
  | "theory_first"
  | "practice_first"
  | "structured"
  | "exploratory";
export type RecommendationCadence = "daily" | "weekly";

export interface Preferences {
  learningStyle: LearningStyle;
  growthFocus: GrowthFocus;
  cognitiveApproach: CognitiveApproach;
  hoursPerWeek: number;
  recommendationCadence: RecommendationCadence;
  weeklyNudgesEnabled?: boolean;
}

export type PreferencesUpdateRequest = Preferences;

// --- Growth Plan ---

export interface GrowthPlanGenerateRequest {
  forceRefresh?: boolean;
  maxThemes?: number;
}

export type TaskStatus = "upcoming" | "current" | "completed";

export interface TaskSummary {
  id: string;
  title: string;
  growthArea?: string;
  xpReward: number;
  estimatedDurationMinutes: number;
  status: TaskStatus;
  rationaleSnippet?: string;
}

export interface GrowthTheme {
  id: string;
  name: string;
  description: string;
  whyItMatters: string;
  estimatedEffortHours?: number;
  progressPercent: number;
  tasks: TaskSummary[];
}

export interface GrowthThemeProgress {
  themeId: string;
  name: string;
  progressPercent: number;
}

export interface GrowthPlan {
  growthPlanId: string;
  summary: string;
  whyThisPath: string;
  currentThemeId?: string;
  currentTaskId?: string;
  themes: GrowthTheme[];
}

// --- Dashboard ---

export interface DashboardView {
  displayName: string;
  currentLevel: number;
  totalXp: number;
  weeklyXp: number;
  streakDays: number;
  completedTasks?: number;
  focusArea: string;
  activeGrowthPath?: string;
  nextAction: TaskSummary;
  progressSummary?: GrowthThemeProgress[];
}

// --- Skill Profile ---

export interface TargetRoleComparison {
  title: string;
  gapSkills: string[];
  narrative: string;
}

export interface SkillProfileView {
  targetRole: TargetRoleComparison;
  strengths: SkillRating[];
  growthAreas: SkillRating[];
}

// --- Tasks ---

export type ResourceType =
  | "internal_doc"
  | "pr_feedback"
  | "coaching_note"
  | "official_doc"
  | "blog"
  | "video"
  | "paper"
  | "search_result";

export interface LearningResource {
  id: string;
  title: string;
  resourceType: ResourceType;
  sourceId: string;
  sourceCategory: SourceCategory;
  integrationMode?: IntegrationMode;
  url?: string;
  artifactPath?: string;
  rationale: string;
}

export interface TaskDetail extends TaskSummary {
  description: string;
  whyRecommended: string[];
  expectedOutcomes: string[];
  resources: LearningResource[];
}

export interface TaskCompletionRequest {
  reflection?: string;
  evidenceNote?: string;
  completedAt?: string;
}

export interface TaskCompletionResponse {
  taskId: string;
  status: "completed";
  awardedXp: number;
  totalXp: number;
  currentLevel: number;
  streakDays: number;
  nextTaskId?: string;
  nextRecommendedRoute?: string;
}

// --- Error ---

export interface ErrorResponse {
  code: string;
  message: string;
  details?: string[];
}
