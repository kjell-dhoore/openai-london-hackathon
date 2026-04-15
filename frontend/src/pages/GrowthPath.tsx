import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, PlayCircle, Clock, ArrowRight, Eye, Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useGrowthPlan } from "@/hooks/useGrowthPlan";
import type { TaskStatus } from "@/types/api";

const statusIcon: Record<TaskStatus, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-primary" />,
  current: <PlayCircle className="h-4 w-4 text-primary" />,
  upcoming: <Circle className="h-4 w-4 text-muted-foreground/40" />,
};

export default function GrowthPath() {
  const { data, isLoading, isError } = useGrowthPlan();

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
        <p className="text-muted-foreground">Failed to load growth path. Please try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Growth Path</h1>
        <p className="text-muted-foreground mt-1">{data.summary}</p>
      </div>

      {data.whyThisPath && (
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="py-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{data.whyThisPath}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {data.themes.map((theme) => {
          const completed = theme.tasks.filter((t) => t.status === "completed").length;
          const total = theme.tasks.length;

          return (
            <Card key={theme.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{theme.name}</CardTitle>
                    <CardDescription>{theme.description}</CardDescription>
                  </div>
                  <Badge variant={theme.progressPercent === 100 ? "default" : "secondary"}>
                    {completed}/{total} tasks
                  </Badge>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted mt-3">
                  <div
                    className="h-full rounded-full bg-gradient-xp transition-all"
                    style={{ width: `${theme.progressPercent}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {theme.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        task.status === "current"
                          ? "bg-primary/5 border border-primary/20"
                          : task.status === "completed"
                          ? "opacity-60"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {statusIcon[task.status]}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : "font-medium"}`}>
                          {task.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {task.estimatedDurationMinutes} min
                        </span>
                        <Badge variant="xp" className="text-[10px]">+{task.xpReward} XP</Badge>
                        {task.status === "current" && (
                          <Button asChild size="sm" variant="accent" className="ml-2">
                            <Link to={`/task/${task.id}`}>
                              Start <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        )}
                        {task.status === "upcoming" && (
                          <Button asChild size="sm" variant="outline" className="ml-2">
                            <Link to={`/task/${task.id}`}>
                              Start <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        )}
                        {task.status === "completed" && (
                          <Button asChild size="sm" variant="ghost" className="ml-2">
                            <Link to={`/task/${task.id}`}>
                              <Eye className="mr-1 h-3 w-3" /> Review
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
