import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Option {
  id: string;
  label: string;
  description: string;
}

const learningStyles: Option[] = [
  { id: "hands-on", label: "Hands-on", description: "Learn by building and doing" },
  { id: "reading", label: "Reading", description: "Articles, docs, and written guides" },
  { id: "video", label: "Video", description: "Tutorials and conference talks" },
  { id: "discussion", label: "Discussion", description: "Pair programming and mentorship" },
];

const goals: Option[] = [
  { id: "career", label: "Career Growth", description: "Advance to next level" },
  { id: "mastery", label: "Deep Mastery", description: "Become an expert in your domain" },
  { id: "exploration", label: "Exploration", description: "Broaden your skill set" },
  { id: "delivery", label: "Delivery", description: "Ship faster and more reliably" },
];

const approaches: Option[] = [
  { id: "theory", label: "Theory First", description: "Understand why before how" },
  { id: "practice", label: "Practice First", description: "Dive in and learn by doing" },
  { id: "structured", label: "Structured", description: "Step-by-step guided paths" },
  { id: "exploratory", label: "Exploratory", description: "Self-directed discovery" },
];

const timeOptions = ["2 hrs/week", "4 hrs/week", "6 hrs/week", "8+ hrs/week"];

export default function Preferences() {
  const [style, setStyle] = useState("hands-on");
  const [goal, setGoal] = useState("career");
  const [approach, setApproach] = useState("practice");
  const [time, setTime] = useState("4 hrs/week");

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
        onSelect={setStyle}
      />

      <PreferenceSection
        title="Growth Focus"
        description="What's your primary goal right now?"
        options={goals}
        selected={goal}
        onSelect={setGoal}
      />

      <PreferenceSection
        title="Cognitive Approach"
        description="How do you prefer to approach new concepts?"
        options={approaches}
        selected={approach}
        onSelect={setApproach}
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
                key={t}
                onClick={() => setTime(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  time === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="accent" size="lg">Save Preferences</Button>
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
