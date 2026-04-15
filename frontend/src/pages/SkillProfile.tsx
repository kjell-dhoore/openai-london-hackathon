import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, Target } from "lucide-react";

const strengths = [
  { skill: "TypeScript", level: 82, evidence: "Consistent quality in recent PRs" },
  { skill: "REST API Development", level: 75, evidence: "Strong API design in project Alpha" },
  { skill: "Git & Collaboration", level: 88, evidence: "Clean commit history, helpful code reviews" },
  { skill: "Unit Testing", level: 70, evidence: "Good coverage in last 3 sprints" },
];

const growthAreas = [
  { skill: "Error Handling", level: 35, evidence: "Recurring feedback in PR reviews", priority: "high" as const },
  { skill: "Observability", level: 25, evidence: "Limited logging in recent services", priority: "high" as const },
  { skill: "System Design", level: 20, evidence: "Based on your career goal assessment", priority: "medium" as const },
  { skill: "Performance Optimization", level: 30, evidence: "Identified in team retro", priority: "medium" as const },
];

const targetRole = {
  title: "Mid-Level Backend Engineer",
  gaps: ["System Design", "Observability", "Error Handling"],
};

export default function SkillProfile() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Skill Profile</h1>
        <p className="text-muted-foreground mt-1">Your strengths and growth areas based on real signals.</p>
      </div>

      {/* Target Role */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Target Role: {targetRole.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Key gaps to close: {targetRole.gaps.map((g, i) => (
                  <Badge key={g} variant="outline" className="ml-1">{g}</Badge>
                ))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Strengths</CardTitle>
          </div>
          <CardDescription>Skills where you're performing well</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {strengths.map((s) => (
            <SkillRow key={s.skill} {...s} type="strength" />
          ))}
        </CardContent>
      </Card>

      {/* Growth Areas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <CardTitle className="text-lg">Growth Areas</CardTitle>
          </div>
          <CardDescription>Skills identified for improvement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {growthAreas.map((s) => (
            <SkillRow key={s.skill} {...s} type="growth" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SkillRow({
  skill,
  level,
  evidence,
  type,
  priority,
}: {
  skill: string;
  level: number;
  evidence: string;
  type: "strength" | "growth";
  priority?: "high" | "medium";
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{skill}</span>
          {priority === "high" && <Badge variant="warning" className="text-[10px] px-1.5 py-0">High Priority</Badge>}
        </div>
        <span className="text-sm font-medium">{level}%</span>
      </div>
      <Progress value={level} className="h-2" />
      <p className="text-xs text-muted-foreground italic">"{evidence}"</p>
    </div>
  );
}
