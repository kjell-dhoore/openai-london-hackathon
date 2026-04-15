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
} from "lucide-react";

const STEPS = ["Upload Resume", "Analyzing", "Quick Questions", "Your Profile", "Generating"];

const GENERATION_STAGES = [
  "Analyzing your skill profile...",
  "Determining skill gaps and priorities...",
  "Matching learning resources...",
  "Building personalized milestones...",
  "Generating your growth plan...",
  "Finalizing recommendations...",
];

const MOCK_SKILLS = [
  "Python",
  "Machine Learning",
  "SQL",
  "Data Analysis",
  "REST APIs",
  "Git",
  "Docker",
  "TensorFlow",
  "Pandas",
  "Scikit-learn",
];

const PROCESSING_STAGES = [
  { label: "Extracting skills from experience", icon: Brain },
  { label: "Mapping to engineering competencies", icon: Target },
  { label: "Identifying growth opportunities", icon: Sparkles },
];

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

const PROFILE_STRENGTHS = [
  { name: "Python & Data Analysis", level: 85 },
  { name: "SQL & Databases", level: 78 },
  { name: "Machine Learning Fundamentals", level: 72 },
  { name: "Version Control (Git)", level: 80 },
];

const PROFILE_GROWTH = [
  { name: "Production ML Deployment", level: 35 },
  { name: "System Design", level: 28 },
  { name: "Observability & Monitoring", level: 20 },
  { name: "CI/CD Pipelines", level: 32 },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [visibleSkills, setVisibleSkills] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | string>>({});
  const [generating, setGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  // Processing animation
  useEffect(() => {
    if (step !== 1) return;
    const stageTimer = setInterval(() => {
      setProcessingStage((prev) => {
        if (prev >= PROCESSING_STAGES.length - 1) {
          clearInterval(stageTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    const skillTimers: ReturnType<typeof setTimeout>[] = [];
    MOCK_SKILLS.forEach((skill, i) => {
      skillTimers.push(
        setTimeout(() => {
          setVisibleSkills((prev) => [...prev, skill]);
        }, 800 + i * 300)
      );
    });

    const advanceTimer = setTimeout(() => setStep(2), 4500);

    return () => {
      clearInterval(stageTimer);
      skillTimers.forEach(clearTimeout);
      clearTimeout(advanceTimer);
    };
  }, [step]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setFileName(file.name);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  }, []);

  const handleComplete = () => {
    localStorage.setItem("onboardingComplete", "true");
    setGenerating(true);
    setGenerationStage(0);
    setGenerationProgress(0);
    setStep(4);
  };

  // Generation animation
  useEffect(() => {
    if (!generating) return;

    const totalStages = GENERATION_STAGES.length;
    const stageInterval = setInterval(() => {
      setGenerationStage((prev) => {
        if (prev >= totalStages - 1) {
          clearInterval(stageInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    const navTimer = setTimeout(() => {
      navigate("/");
    }, 5500);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
      clearTimeout(navTimer);
    };
  }, [generating, navigate]);

  const progressPercent = ((step + 1) / STEPS.length) * 100;

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
                {/* Resume Upload Card */}
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

                {/* LinkedIn Import Card */}
                <Card
                  className={`border-2 border-dashed transition-colors cursor-pointer h-full ${
                    fileName === "linkedin-profile.txt"
                      ? "border-accent/50 bg-accent/5"
                      : "border-border hover:border-accent/40"
                  }`}
                  onClick={() => setFileName("linkedin-profile.txt")}
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

              <Button
                variant="accent"
                size="lg"
                className="w-full"
                disabled={!fileName}
                onClick={() => {
                  setProcessingStage(0);
                  setVisibleSkills([]);
                  setStep(1);
                }}
              >
                Analyze Profile
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Processing */}
          {step === 1 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-mono font-bold text-foreground">
                  Analyzing your experience
                </h1>
                <p className="text-muted-foreground text-lg">
                  We're identifying your strengths and opportunities
                </p>
              </div>

              <Card>
                <CardContent className="py-8 space-y-6">
                  {PROCESSING_STAGES.map((stage, i) => {
                    const Icon = stage.icon;
                    const isActive = i === processingStage;
                    const isDone = i < processingStage;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-4 transition-opacity duration-500 ${
                          i > processingStage ? "opacity-30" : "opacity-100"
                        }`}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                            isDone
                              ? "bg-accent/10"
                              : isActive
                              ? "bg-accent/10"
                              : "bg-secondary"
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
                            isDone || isActive
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {visibleSkills.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Skills detected
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {visibleSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="animate-fade-in"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
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

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => setStep(3)}
                >
                  Skip for now
                </Button>
                <Button
                  variant="accent"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(3)}
                >
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
                      <h3 className="font-semibold text-foreground">
                        Strengths
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {PROFILE_STRENGTHS.map((s) => (
                        <div key={s.name} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{s.name}</span>
                            <span className="text-muted-foreground">
                              {s.level}%
                            </span>
                          </div>
                          <Progress value={s.level} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="py-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">
                        Growth Areas
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {PROFILE_GROWTH.map((g) => (
                        <div key={g.name} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{g.name}</span>
                            <span className="text-muted-foreground">
                              {g.level}%
                            </span>
                          </div>
                          <Progress value={g.level} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-accent/5 border-accent/20">
                <CardContent className="py-4 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground">
                    We'll use this profile to create a personalized growth path
                    with actionable tasks, curated resources, and progress
                    tracking tailored to your goals.
                  </p>
                </CardContent>
              </Card>

              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={handleComplete}
              >
                Generate My Growth Plan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 4: Generating */}
          {step === 4 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-mono font-bold text-foreground">
                  Generating Your Growth Plan
                </h1>
                <p className="text-muted-foreground text-lg">
                  Sit tight — we're building something great for you
                </p>
              </div>

              <Card>
                <CardContent className="py-8 space-y-6">
                  <Progress value={generationProgress} className="h-2" />

                  <div className="space-y-4">
                    {GENERATION_STAGES.map((stage, i) => {
                      const isActive = i === generationStage;
                      const isDone = i < generationStage;
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 transition-opacity duration-500 ${
                            i > generationStage ? "opacity-30" : "opacity-100"
                          }`}
                        >
                          <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5 text-accent" />
                            ) : isActive ? (
                              <Loader2 className="h-5 w-5 text-accent animate-spin" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                            )}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              isDone || isActive
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
