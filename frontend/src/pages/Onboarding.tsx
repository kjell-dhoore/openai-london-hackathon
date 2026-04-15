import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  Linkedin,
  Sparkles,
  CheckCircle2,
  Brain,
  Target,
  ChevronRight,
  Loader2,
  ArrowRight,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useSubmitProfileIntake, useSubmitQuizResponses } from "@/hooks/useOnboarding";
import { useGenerateGrowthPlan } from "@/hooks/useGrowthPlan";
import { useJobPoller } from "@/hooks/useJobs";
import type { ProfileSummary, QuizResponseType } from "@/types/api";

const STEPS = ["Upload Resume", "Analyzing", "Quick Questions", "Your Profile", "Generating"];

const QUIZ_QUESTIONS = [
  {
    id: "ml-deploy",
    question: "How comfortable are you deploying ML models to production?",
    type: "slider" as const,
  },
  {
    id: "code-review",
    question: "How often do you participate in code reviews?",
    type: "choice" as const,
    options: ["Rarely", "A few times a month", "Weekly", "Daily"],
  },
  {
    id: "system-design",
    question: "How confident are you designing distributed systems?",
    type: "slider" as const,
  },
  {
    id: "testing",
    question: "What's your approach to testing?",
    type: "choice" as const,
    options: [
      "Manual testing mostly",
      "Some unit tests",
      "Good test coverage",
      "TDD practitioner",
    ],
  },
];

const PROCESSING_STAGES = [
  { label: "Extracting skills from experience", icon: Brain },
  { label: "Mapping to engineering competencies", icon: Target },
  { label: "Identifying growth opportunities", icon: Sparkles },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { session, refreshSession } = useSession();

  const [step, setStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | string>>({});

  // API mutations
  const profileIntake = useSubmitProfileIntake();
  const quizMutation = useSubmitQuizResponses();
  const growthPlanMutation = useGenerateGrowthPlan();

  // Job polling for profile analysis (step 1)
  const [profileJobId, setProfileJobId] = useState<string | null>(null);
  const profileJob = useJobPoller(profileJobId);

  // Job polling for growth plan generation (step 4)
  const [growthJobId, setGrowthJobId] = useState<string | null>(null);
  const growthJob = useJobPoller(growthJobId);

  // Profile data returned from quiz submission
  const [profileData, setProfileData] = useState<ProfileSummary | null>(null);

  // Advance from step 1 (analyzing) when profile job completes
  useEffect(() => {
    if (profileJob.isCompleted && step === 1) {
      setStep(2);
    }
  }, [profileJob.isCompleted, step]);

  // Navigate to dashboard when growth plan job completes
  useEffect(() => {
    if (growthJob.isCompleted && step === 4) {
      refreshSession().then(() => navigate("/"));
    }
  }, [growthJob.isCompleted, step, refreshSession, navigate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
      setFileName(file.name);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setFileName(file.name);
    }
  }, []);

  const handleAnalyze = () => {
    setStep(1);
    profileIntake.mutate(
      {
        file: uploadedFile ?? undefined,
        fields: {
          importMode: uploadedFile ? "resume_upload" : fileName === "linkedin-profile.txt" ? "linkedin_import" : "summary_only",
        },
      },
      {
        onSuccess: (data) => setProfileJobId(data.jobId),
        onError: () => setStep(0),
      },
    );
  };

  const handleQuizSubmit = (skipped: boolean) => {
    const responses = skipped
      ? []
      : Object.entries(quizAnswers).map(([questionId, value]) => {
          const q = QUIZ_QUESTIONS.find((qq) => qq.id === questionId);
          const responseType: QuizResponseType = q?.type === "slider" ? "slider" : "choice";
          return {
            questionId,
            responseType,
            ...(responseType === "slider"
              ? { numericValue: value as number }
              : { optionValue: value as string }),
          };
        });

    quizMutation.mutate(
      { skipped, responses },
      {
        onSuccess: (profile) => {
          setProfileData(profile);
          setStep(3);
        },
      },
    );
  };

  const handleGenerateGrowthPlan = () => {
    setStep(4);
    growthPlanMutation.mutate(undefined, {
      onSuccess: (data) => setGrowthJobId(data.jobId),
      onError: () => setStep(3),
    });
  };

  const analysisProgress = profileJob.job?.progressPercent ?? 0;
  const generationProgress = growthJob.job?.progressPercent ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Header */}
      {step < 4 && (
        <div className="w-full border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                <span className="font-semibold text-foreground">SkillPilot</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Step {step + 1} of 4
              </span>
            </div>
            <div className="flex gap-2">
              {STEPS.slice(0, 4).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i <= step ? "bg-gradient-xp" : "bg-secondary"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Step 0: Resume Upload */}
          {step === 0 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-mono font-bold text-foreground">
                  Let's build your growth profile
                </h1>
                <p className="text-muted-foreground text-lg">
                  Upload your resume and we'll map your skills automatically
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card
                  className={`border-2 border-dashed transition-colors cursor-pointer h-full ${
                    isDragging
                      ? "border-accent bg-accent/5"
                      : fileName && fileName !== "linkedin-profile.txt"
                      ? "border-accent/50 bg-accent/5"
                      : "border-border hover:border-accent/40"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <CardContent className="flex flex-col items-center justify-center py-12 gap-4 h-full">
                    {fileName && fileName !== "linkedin-profile.txt" ? (
                      <>
                        <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
                          <FileText className="h-7 w-7 text-accent" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-foreground">{fileName}</p>
                          <p className="text-sm text-muted-foreground">Ready to analyze</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
                          <Upload className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-foreground">Drop your resume here</p>
                          <p className="text-sm text-muted-foreground">PDF, DOCX, or TXT — up to 10 MB</p>
                        </div>
                      </>
                    )}
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileSelect}
                    />
                  </CardContent>
                </Card>

                <Card
                  className={`border-2 border-dashed transition-colors cursor-pointer h-full ${
                    fileName === "linkedin-profile.txt"
                      ? "border-accent/50 bg-accent/5"
                      : "border-border hover:border-accent/40"
                  }`}
                  onClick={() => {
                    setUploadedFile(null);
                    setFileName("linkedin-profile.txt");
                  }}
                >
                  <CardContent className="flex flex-col items-center justify-center py-12 gap-4 h-full">
                    <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
                      <Linkedin className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">Import from LinkedIn</p>
                      <p className="text-sm text-muted-foreground">We'll pull your profile automatically</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {profileIntake.isError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed to submit profile. Please try again.</span>
                </div>
              )}

              <Button
                variant="accent"
                size="lg"
                className="w-full"
                disabled={!fileName || profileIntake.isPending}
                onClick={handleAnalyze}
              >
                {profileIntake.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Analyze Profile
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Processing / Analyzing */}
          {step === 1 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-mono font-bold text-foreground">
                  Analyzing your experience
                </h1>
                <p className="text-muted-foreground text-lg">
                  {profileJob.job?.currentStage
                    ? profileJob.job.currentStage.replace(/_/g, " ")
                    : "We're identifying your strengths and opportunities"}
                </p>
              </div>

              <Card>
                <CardContent className="py-8 space-y-6">
                  <Progress value={analysisProgress} className="h-2" />
                  {PROCESSING_STAGES.map((stage, i) => {
                    const isActive = analysisProgress > 0 && analysisProgress < 100
                      ? i === Math.min(Math.floor(analysisProgress / 34), 2)
                      : false;
                    const isDone = analysisProgress >= (i + 1) * 34;
                    const Icon = stage.icon;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-4 transition-opacity duration-500 ${
                          !isDone && !isActive ? "opacity-30" : "opacity-100"
                        }`}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                            isDone || isActive ? "bg-accent/10" : "bg-secondary"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-accent" />
                          ) : isActive ? (
                            <Loader2 className="h-5 w-5 text-accent animate-spin" />
                          ) : (
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <span
                          className={`font-medium ${
                            isDone || isActive ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {profileJob.isFailed && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-destructive">
                    Analysis failed: {profileJob.job?.error?.message ?? "Unknown error"}
                  </p>
                  <Button variant="outline" onClick={() => { setProfileJobId(null); setStep(0); }}>
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Adaptive Quiz */}
          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-mono font-bold text-foreground">
                  Just a few quick questions
                </h1>
                <p className="text-muted-foreground text-lg">
                  Help us refine your profile with a few details
                </p>
              </div>

              <div className="space-y-6">
                {QUIZ_QUESTIONS.map((q) => (
                  <Card key={q.id}>
                    <CardContent className="py-5 space-y-4">
                      <p className="font-medium text-foreground">
                        {q.question}
                      </p>
                      {q.type === "slider" ? (
                        <div className="space-y-3">
                          <Slider
                            defaultValue={[50]}
                            max={100}
                            step={1}
                            onValueChange={(v) =>
                              setQuizAnswers((prev) => ({
                                ...prev,
                                [q.id]: v[0],
                              }))
                            }
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Beginner</span>
                            <span>Advanced</span>
                          </div>
                        </div>
                      ) : (
                        <RadioGroup
                          onValueChange={(v) =>
                            setQuizAnswers((prev) => ({ ...prev, [q.id]: v }))
                          }
                          className="space-y-2"
                        >
                          {q.options?.map((opt) => (
                            <div
                              key={opt}
                              className="flex items-center space-x-3"
                            >
                              <RadioGroupItem
                                value={opt}
                                id={`${q.id}-${opt}`}
                              />
                              <Label
                                htmlFor={`${q.id}-${opt}`}
                                className="cursor-pointer text-sm"
                              >
                                {opt}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {quizMutation.isError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed to submit quiz. Please try again.</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="text-muted-foreground"
                  disabled={quizMutation.isPending}
                  onClick={() => handleQuizSubmit(true)}
                >
                  Skip for now
                </Button>
                <Button
                  variant="accent"
                  size="lg"
                  className="flex-1"
                  disabled={quizMutation.isPending}
                  onClick={() => handleQuizSubmit(false)}
                >
                  {quizMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Profile Summary */}
          {step === 3 && (
            <div className="animate-fade-in space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex h-14 w-14 rounded-full bg-accent/10 items-center justify-center mx-auto mb-2">
                  <Sparkles className="h-7 w-7 text-accent" />
                </div>
                <h1 className="text-3xl font-mono font-bold text-foreground">
                  Your growth profile is ready
                </h1>
                <p className="text-muted-foreground text-lg">
                  Based on your experience and answers, here's what we found
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="py-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <h3 className="font-semibold text-foreground">Strengths</h3>
                    </div>
                    <div className="space-y-3">
                      {(profileData?.strengths ?? []).map((s) => (
                        <div key={s.id} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{s.name}</span>
                            <span className="text-muted-foreground">{s.levelPercent}%</span>
                          </div>
                          <Progress value={s.levelPercent} className="h-2" />
                        </div>
                      ))}
                      {(!profileData || profileData.strengths.length === 0) && (
                        <p className="text-sm text-muted-foreground">No strengths detected yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="py-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Growth Areas</h3>
                    </div>
                    <div className="space-y-3">
                      {(profileData?.growthAreas ?? []).map((g) => (
                        <div key={g.id} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{g.name}</span>
                            <span className="text-muted-foreground">{g.levelPercent}%</span>
                          </div>
                          <Progress value={g.levelPercent} className="h-2" />
                        </div>
                      ))}
                      {(!profileData || profileData.growthAreas.length === 0) && (
                        <p className="text-sm text-muted-foreground">No growth areas identified yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {profileData?.goalDirection && (
                <Card className="bg-accent/5 border-accent/20">
                  <CardContent className="py-4 flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground">{profileData.goalDirection}</p>
                  </CardContent>
                </Card>
              )}

              <Button
                variant="accent"
                size="lg"
                className="w-full"
                disabled={growthPlanMutation.isPending}
                onClick={handleGenerateGrowthPlan}
              >
                {growthPlanMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Generate My Growth Plan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 4: Generating Growth Plan */}
          {step === 4 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-mono font-bold text-foreground">
                  Generating Your Growth Plan
                </h1>
                <p className="text-muted-foreground text-lg">
                  {growthJob.job?.currentStage
                    ? growthJob.job.currentStage.replace(/_/g, " ")
                    : "Sit tight — we're building something great for you"}
                </p>
              </div>

              <Card>
                <CardContent className="py-8 space-y-6">
                  <Progress value={generationProgress} className="h-2" />

                  <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="h-6 w-6 text-accent animate-spin" />
                    <span className="text-sm font-medium text-foreground">
                      {growthJob.job?.currentStage
                        ? growthJob.job.currentStage.replace(/_/g, " ")
                        : "Preparing..."}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {growthJob.isFailed && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-destructive">
                    Generation failed: {growthJob.job?.error?.message ?? "Unknown error"}
                  </p>
                  <Button variant="outline" onClick={() => { setGrowthJobId(null); setStep(3); }}>
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
