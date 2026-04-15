import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, PlayCircle, Clock, ArrowRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";

type TaskStatus = "completed" | "current" | "upcoming";

interface Task {
  id: string;
  title: string;
  xp: number;
  duration: string;
  status: TaskStatus;
}

interface GrowthArea {
  name: string;
  description: string;
  tasks: Task[];
}

const growthAreas: GrowthArea[] = [
  {
    name: "Error Handling",
    description: "Build robust, production-grade error handling patterns",
    tasks: [
      { id: "eh1", title: "Review team error handling standards doc", xp: 60, duration: "20 min", status: "completed" },
      { id: "eh2", title: "Refactor error handling in auth service", xp: 120, duration: "45 min", status: "completed" },
      { id: "1", title: "Implement structured error handling in async services", xp: 120, duration: "45 min", status: "current" },
      { id: "eh4", title: "Add error monitoring dashboard alerts", xp: 80, duration: "30 min", status: "upcoming" },
    ],
  },
  {
    name: "Observability & Logging",
    description: "Gain visibility into production system behavior",
    tasks: [
      { id: "ob1", title: "Study the team's logging conventions", xp: 50, duration: "15 min", status: "completed" },
      { id: "ob2", title: "Add structured logging to payment service", xp: 100, duration: "40 min", status: "current" },
      { id: "ob3", title: "Create a runbook for common alerts", xp: 90, duration: "35 min", status: "upcoming" },
    ],
  },
  {
    name: "API Design Patterns",
    description: "Design clean, consistent, and maintainable APIs",
    tasks: [
      { id: "api1", title: "Read internal API style guide", xp: 40, duration: "15 min", status: "upcoming" },
      { id: "api2", title: "Redesign user preferences endpoint", xp: 130, duration: "50 min", status: "upcoming" },
      { id: "api3", title: "Implement pagination in search API", xp: 100, duration: "40 min", status: "upcoming" },
    ],
  },
  {
    name: "System Design Basics",
    description: "Understand how systems scale and interact",
    tasks: [
      { id: "sd1", title: "Complete system design primer", xp: 80, duration: "30 min", status: "upcoming" },
      { id: "sd2", title: "Design a caching layer proposal", xp: 150, duration: "60 min", status: "upcoming" },
    ],
  },
  {
    name: "Public Speaking & Presentations",
    description: "Build confidence presenting ideas to teams and stakeholders",
    tasks: [
      { id: "ps1", title: "Practice a 5-min lightning talk on a recent project", xp: 80, duration: "30 min", status: "completed" },
      { id: "ps2", title: "Record yourself presenting a design decision", xp: 100, duration: "40 min", status: "current" },
      { id: "ps3", title: "Lead a team demo session", xp: 130, duration: "45 min", status: "upcoming" },
      { id: "ps4", title: "Present a technical proposal to leadership", xp: 150, duration: "60 min", status: "upcoming" },
    ],
  },
  {
    name: "Storytelling & Communication",
    description: "Communicate impact clearly through writing and narrative",
    tasks: [
      { id: "sc1", title: "Write a technical blog post draft", xp: 90, duration: "45 min", status: "upcoming" },
      { id: "sc2", title: "Structure a project update using STAR format", xp: 70, duration: "25 min", status: "upcoming" },
      { id: "sc3", title: "Present a post-mortem to stakeholders", xp: 120, duration: "40 min", status: "upcoming" },
    ],
  },
];

const statusIcon: Record<TaskStatus, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-primary" />,
  current: <PlayCircle className="h-4 w-4 text-primary" />,
  upcoming: <Circle className="h-4 w-4 text-muted-foreground/40" />,
};

export default function GrowthPath() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Growth Path</h1>
        <p className="text-muted-foreground mt-1">Your personalized learning journey toward production readiness.</p>
      </div>

      <div className="space-y-6">
        {growthAreas.map((area) => {
          const completed = area.tasks.filter((t) => t.status === "completed").length;
          const total = area.tasks.length;
          const pct = Math.round((completed / total) * 100);

          return (
            <Card key={area.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    <CardDescription>{area.description}</CardDescription>
                  </div>
                  <Badge variant={pct === 100 ? "default" : "secondary"}>
                    {completed}/{total} tasks
                  </Badge>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted mt-3">
                  <div
                    className="h-full rounded-full bg-gradient-xp transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {area.tasks.map((task) => (
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
                          <Clock className="h-3 w-3" /> {task.duration}
                        </span>
                        <Badge variant="xp" className="text-[10px]">+{task.xp} XP</Badge>
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
