import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, Target, Loader2 } from "lucide-react";
import { useSkillProfile } from "@/hooks/useSkillProfile";
import type { SkillRating } from "@/types/api";

export default function SkillProfile() {
  const { data, isLoading, isError } = useSkillProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center">
        <p className="text-muted-foreground">Failed to load skill profile. Please try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Skill Profile</h1>
        <p className="text-muted-foreground mt-1">Your strengths and growth areas based on real signals.</p>
      </div>

      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Target Role: {data.targetRole.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Key gaps to close:{" "}
                {data.targetRole.gapSkills.map((g) => (
                  <Badge key={g} variant="outline" className="ml-1">{g}</Badge>
                ))}
              </p>
              {data.targetRole.narrative && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  {data.targetRole.narrative}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Strengths</CardTitle>
          </div>
          <CardDescription>Skills where you're performing well</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {data.strengths.map((s) => (
            <SkillRow key={s.id} skill={s} type="strength" />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <CardTitle className="text-lg">Growth Areas</CardTitle>
          </div>
          <CardDescription>Skills identified for improvement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {data.growthAreas.map((s) => (
            <SkillRow key={s.id} skill={s} type="growth" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SkillRow({ skill, type }: { skill: SkillRating; type: "strength" | "growth" }) {
  const evidence = skill.evidence?.[0];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{skill.name}</span>
          {skill.priority === "high" && (
            <Badge variant="warning" className="text-[10px] px-1.5 py-0">High Priority</Badge>
          )}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
            {skill.band}
          </Badge>
        </div>
        <span className="text-sm font-medium">{skill.levelPercent}%</span>
      </div>
      <Progress value={skill.levelPercent} className="h-2" />
      {evidence && (
        <p className="text-xs text-muted-foreground italic">"{evidence.summary}"</p>
      )}
    </div>
  );
}
