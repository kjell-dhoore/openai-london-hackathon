import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Database, FileText, GitBranch, MessageSquare, BookOpen, Video, Globe, Rss } from "lucide-react";
import { useState } from "react";

interface Source {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  impact: string;
}

const initialInternal: Source[] = [
  { id: "confluence", name: "Confluence", description: "Team documentation, standards, and runbooks", icon: FileText, enabled: true, impact: "Used for context & recommendations" },
  { id: "github", name: "GitHub / PR Feedback", description: "Code review comments and pull request history", icon: GitBranch, enabled: true, impact: "Primary signal for skill assessment" },
  { id: "gdrive", name: "Google Drive", description: "Coaching notes, 1:1 summaries, and planning docs", icon: Database, enabled: true, impact: "Used for goal alignment" },
  { id: "coaching", name: "Coaching Notes", description: "Manager feedback and development conversations", icon: MessageSquare, enabled: false, impact: "Enhances personalization" },
];

const initialExternal: Source[] = [
  { id: "blogs", name: "Engineering Blogs", description: "Curated blog posts and technical articles", icon: Globe, enabled: true, impact: "Used for learning resources" },
  { id: "docs", name: "Official Documentation", description: "Framework and library documentation", icon: BookOpen, enabled: true, impact: "Used for reference material" },
  { id: "videos", name: "Learning Videos", description: "Conference talks and tutorial videos", icon: Video, enabled: false, impact: "Used for visual learning paths" },
  { id: "papers", name: "Technical Papers", description: "Research papers and whitepapers", icon: Rss, enabled: false, impact: "Used for deep-dive content" },
];

export default function DataSources() {
  const [internal, setInternal] = useState(initialInternal);
  const [external, setExternal] = useState(initialExternal);

  const toggle = (list: Source[], setList: React.Dispatch<React.SetStateAction<Source[]>>, id: string) => {
    setList(list.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Data Sources</h1>
        <p className="text-muted-foreground mt-1">
          Control which knowledge sources power your recommendations. More sources = smarter guidance.
        </p>
      </div>

      <SourceGroup
        title="Internal Sources"
        description="Company knowledge that provides context about your work"
        sources={internal}
        onToggle={(id) => toggle(internal, setInternal, id)}
      />

      <SourceGroup
        title="External Sources"
        description="Public resources used for learning recommendations"
        sources={external}
        onToggle={(id) => toggle(external, setExternal, id)}
      />

      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            More integrations coming soon — Slack, Jira, Linear, Notion, and more.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            The system is designed to grow smarter with every new data source.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SourceGroup({
  title,
  description,
  sources,
  onToggle,
}: {
  title: string;
  description: string;
  sources: Source[];
  onToggle: (id: string) => void;
}) {
  const activeCount = sources.filter((s) => s.enabled).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="secondary">{activeCount}/{sources.length} active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${source.enabled ? "bg-primary/10" : "bg-muted"}`}>
              <source.icon className={`h-4 w-4 ${source.enabled ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{source.name}</p>
              <p className="text-xs text-muted-foreground">{source.description}</p>
            </div>
            <p className="text-[10px] text-muted-foreground/70 hidden sm:block max-w-[160px] text-right">{source.impact}</p>
            <Switch checked={source.enabled} onCheckedChange={() => onToggle(source.id)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
