import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Flame, CheckCircle2, ArrowRight, BookOpen, Zap, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";

export default function Dashboard() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center">
        <p className="text-muted-foreground">Failed to load dashboard. Please try refreshing.</p>
      </div>
    );
  }

  const nextAction = data.nextAction;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">
          Welcome back, {data.displayName}
        </h1>
        <p className="text-muted-foreground mt-1">Here's your growth snapshot for this week.</p>
      </div>

      {nextAction && (
        <Card className="border-primary/20 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Your Next Step</CardTitle>
            </div>
            <CardDescription>
              {nextAction.rationaleSnippet ?? "Recommended based on your growth goals"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-base">{nextAction.title}</h3>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="xp">+{nextAction.xpReward} XP</Badge>
                  {nextAction.growthArea && (
                    <Badge variant="secondary">{nextAction.growthArea}</Badge>
                  )}
                  <Badge variant="secondary">~{nextAction.estimatedDurationMinutes} min</Badge>
                </div>
              </div>
              <Button asChild variant="accent" size="lg">
                <Link to={`/task/${nextAction.id}`}>
                  Start Task <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Tasks Completed" value={String(data.completedTasks ?? 0)} />
        <StatCard icon={Flame} label="Day Streak" value={String(data.streakDays)} accent />
        <StatCard icon={BookOpen} label="Focus Area" value={data.focusArea} />
        <StatCard icon={Zap} label="XP This Week" value={`+${data.weeklyXp}`} />
      </div>

      {data.progressSummary && data.progressSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Growth Path</CardTitle>
            {data.activeGrowthPath && (
              <CardDescription>{data.activeGrowthPath}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.progressSummary.map((theme) => (
                <div key={theme.themeId} className="flex items-center gap-4">
                  <span className="text-sm w-44 truncate text-muted-foreground">
                    {theme.name}
                  </span>
                  <Progress value={theme.progressPercent} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {theme.progressPercent}%
                  </span>
                </div>
              ))}
            </div>
            <Button asChild variant="ghost" className="mt-4 text-primary">
              <Link to="/growth">View full growth path <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accent ? "bg-gradient-xp" : "bg-secondary"}`}>
            <Icon className={`h-4 w-4 ${accent ? "text-accent-foreground" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
