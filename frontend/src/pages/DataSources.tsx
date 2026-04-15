import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Database, FileText, GitBranch, MessageSquare, BookOpen, Video, Globe, Rss, Loader2 } from "lucide-react";
import { useSelectedSources, useUpdateSources } from "@/hooks/useSources";
import type { SourceSelection, SourceCategory } from "@/types/api";
import { toast } from "sonner";

const sourceIcons: Record<string, React.ElementType> = {
  confluence: FileText,
  github: GitBranch,
  gdrive: Database,
  google_drive: Database,
  coaching: MessageSquare,
  coaching_notes: MessageSquare,
  blogs: Globe,
  engineering_blogs: Globe,
  docs: BookOpen,
  official_docs: BookOpen,
  videos: Video,
  youtube: Video,
  learning_videos: Video,
  papers: Rss,
  technical_papers: Rss,
};

function getIcon(sourceId: string): React.ElementType {
  return sourceIcons[sourceId] ?? Database;
}

export default function DataSources() {
  const { data, isLoading, isError } = useSelectedSources();
  const updateMutation = useUpdateSources();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-muted-foreground">Failed to load data sources. Please try refreshing.</p>
      </div>
    );
  }

  const internal = data.sources.filter((s) => s.category === "internal");
  const external = data.sources.filter((s) => s.category === "external");

  const handleToggle = (id: string) => {
    const updated = data.sources.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s,
    );
    updateMutation.mutate(
      { sources: updated },
      {
        onError: () => toast.error("Failed to update source. Please try again."),
      },
    );
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
        onToggle={handleToggle}
      />

      <SourceGroup
        title="External Sources"
        description="Public resources used for learning recommendations"
        sources={external}
        onToggle={handleToggle}
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
  sources: SourceSelection[];
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
        {sources.map((source) => {
          const Icon = getIcon(source.id);
          return (
            <div
              key={source.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${source.enabled ? "bg-primary/10" : "bg-muted"}`}>
                <Icon className={`h-4 w-4 ${source.enabled ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{source.name}</p>
                <p className="text-xs text-muted-foreground">{source.description ?? ""}</p>
              </div>
              <p className="text-[10px] text-muted-foreground/70 hidden sm:block max-w-[160px] text-right capitalize">
                {source.capabilities.join(", ").replace(/_/g, " ")}
              </p>
              <Switch
                checked={source.enabled}
                onCheckedChange={() => onToggle(source.id)}
                disabled={source.status === "coming_soon"}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
