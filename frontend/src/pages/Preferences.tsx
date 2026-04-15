import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { usePreferences, useUpdatePreferences } from "@/hooks/usePreferences";
import type {
  LearningStyle,
  GrowthFocus,
  CognitiveApproach,
  RecommendationCadence,
} from "@/types/api";
import { toast } from "sonner";

interface Option {
  id: string;
  label: string;
  description: string;
}

const learningStyles: Option[] = [
  { id: "hands_on", label: "Hands-on", description: "Learn by building and doing" },
  { id: "reading", label: "Reading", description: "Articles, docs, and written guides" },
  { id: "video", label: "Video", description: "Tutorials and conference talks" },
  { id: "discussion", label: "Discussion", description: "Pair programming and mentorship" },
];

const goals: Option[] = [
  { id: "career_growth", label: "Career Growth", description: "Advance to next level" },
  { id: "mastery", label: "Deep Mastery", description: "Become an expert in your domain" },
  { id: "exploration", label: "Exploration", description: "Broaden your skill set" },
  { id: "delivery_impact", label: "Delivery", description: "Ship faster and more reliably" },
];

const approaches: Option[] = [
  { id: "theory_first", label: "Theory First", description: "Understand why before how" },
  { id: "practice_first", label: "Practice First", description: "Dive in and learn by doing" },
  { id: "structured", label: "Structured", description: "Step-by-step guided paths" },
  { id: "exploratory", label: "Exploratory", description: "Self-directed discovery" },
];

const timeOptions = [
  { label: "2 hrs/week", value: 2 },
  { label: "4 hrs/week", value: 4 },
  { label: "6 hrs/week", value: 6 },
  { label: "8+ hrs/week", value: 8 },
];

export default function Preferences() {
  const { data, isLoading, isError } = usePreferences();
  const updateMutation = useUpdatePreferences();

  const [style, setStyle] = useState<LearningStyle>("hands_on");
  const [goal, setGoal] = useState<GrowthFocus>("career_growth");
  const [approach, setApproach] = useState<CognitiveApproach>("practice_first");
  const [hours, setHours] = useState(4);

  useEffect(() => {
    if (data) {
      setStyle(data.learningStyle);
      setGoal(data.growthFocus);
      setApproach(data.cognitiveApproach);
      setHours(data.hoursPerWeek);
    }
  }, [data]);

  const handleSave = () => {
    updateMutation.mutate(
      {
        learningStyle: style,
        growthFocus: goal,
        cognitiveApproach: approach,
        hoursPerWeek: hours,
        recommendationCadence: (data?.recommendationCadence ?? "weekly") as RecommendationCadence,
        weeklyNudgesEnabled: data?.weeklyNudgesEnabled ?? true,
      },
      {
        onSuccess: () => toast.success("Preferences saved!"),
        onError: () => toast.error("Failed to save preferences. Please try again."),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-muted-foreground">Failed to load preferences. Please try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground mt-1">Help SkillPilot tailor recommendations to how you learn best.</p>
      </div>

      <PreferenceSection
        title="Learning Style"
        description="How do you prefer to learn?"
        options={learningStyles}
        selected={style}
        onSelect={(id) => setStyle(id as LearningStyle)}
      />

      <PreferenceSection
        title="Growth Focus"
        description="What's your primary goal right now?"
        options={goals}
        selected={goal}
        onSelect={(id) => setGoal(id as GrowthFocus)}
      />

      <PreferenceSection
        title="Cognitive Approach"
        description="How do you prefer to approach new concepts?"
        options={approaches}
        selected={approach}
        onSelect={(id) => setApproach(id as CognitiveApproach)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Time Availability</CardTitle>
          <CardDescription>How much time can you dedicate to growth each week?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {timeOptions.map((t) => (
              <button
                key={t.value}
                onClick={() => setHours(t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  hours === t.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="accent"
          size="lg"
          disabled={updateMutation.isPending}
          onClick={handleSave}
        >
          {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

function PreferenceSection({
  title,
  description,
  options,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  options: Option[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`text-left p-4 rounded-lg border transition-all ${
                selected === opt.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <p className={`text-sm font-medium ${selected === opt.id ? "text-primary" : ""}`}>
                {opt.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
