import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Flame, CheckCircle2, ArrowRight, BookOpen, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Welcome back, Alex</h1>
        <p className="text-muted-foreground mt-1">Here's your growth snapshot for this week.</p>
      </div>


      {/* Next Recommended Action */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Your Next Step</CardTitle>
          </div>
          <CardDescription>Recommended based on your recent PR feedback and growth goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-base">Improve error handling in async services</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Practice structured error handling patterns used in your team's production codebase.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="xp">+120 XP</Badge>
                <Badge variant="secondary">Error Handling</Badge>
                <Badge variant="secondary">~45 min</Badge>
              </div>
            </div>
            <Button asChild variant="accent" size="lg">
              <Link to="/task/1">
                Start Task <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Tasks Completed" value="12" />
        <StatCard icon={Flame} label="Day Streak" value="7" accent />
        <StatCard icon={BookOpen} label="Focus Area" value="Backend" />
        <StatCard icon={Zap} label="XP This Week" value="+340" />
      </div>

      {/* Growth Path Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Growth Path</CardTitle>
          <CardDescription>Backend Engineering — Production Readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Error Handling", progress: 80, active: false },
              { name: "Observability & Logging", progress: 45, active: true },
              { name: "API Design Patterns", progress: 10, active: false },
              { name: "System Design Basics", progress: 0, active: false },
            ].map((area) => (
              <div key={area.name} className="flex items-center gap-4">
                <span className={`text-sm w-44 truncate ${area.active ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {area.active && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mr-2" />}
                  {area.name}
                </span>
                <Progress value={area.progress} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground w-10 text-right">{area.progress}%</span>
              </div>
            ))}
          </div>
          <Button asChild variant="ghost" className="mt-4 text-primary">
            <Link to="/growth">View full growth path <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
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
