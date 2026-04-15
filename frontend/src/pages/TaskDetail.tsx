import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Lightbulb,
  BookOpen,
  ExternalLink,
  FileText,
  Video,
  CheckCircle2,
  Zap,
  Loader2,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useTaskDetail, useCompleteTask } from "@/hooks/useTasks";
import type { LearningResource, ResourceType } from "@/types/api";
import { toast } from "sonner";

const resourceTypeIcons: Record<ResourceType, React.ElementType> = {
  internal_doc: FileText,
  pr_feedback: FileText,
  coaching_note: FileText,
  official_doc: BookOpen,
  blog: ExternalLink,
  video: Video,
  paper: ExternalLink,
  search_result: ExternalLink,
};

const resourceTypeLabels: Record<ResourceType, string> = {
  internal_doc: "Internal Doc",
  pr_feedback: "PR Feedback",
  coaching_note: "Coaching Note",
  official_doc: "Documentation",
  blog: "Blog",
  video: "Video",
  paper: "Paper",
  search_result: "Search Result",
};

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading, isError } = useTaskDetail(id);
  const completeMutation = useCompleteTask(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-muted-foreground">Failed to load task. Please try refreshing.</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/growth">Back to Growth Path</Link>
        </Button>
      </div>
    );
  }

  const handleComplete = () => {
    completeMutation.mutate(
      { completedAt: new Date().toISOString() },
      {
        onSuccess: (res) => {
          toast.success(`+${res.awardedXp} XP earned!`);
          if (res.nextRecommendedRoute) {
            navigate(res.nextRecommendedRoute);
          }
        },
        onError: () => {
          toast.error("Failed to complete task. Please try again.");
        },
      },
    );
  };

  const internalResources = task.resources.filter((r) => r.sourceCategory === "internal");
  const externalResources = task.resources.filter((r) => r.sourceCategory === "external");

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link to="/growth"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Growth Path</Link>
      </Button>

      <div>
        <div className="flex items-center gap-2 mb-2">
          {task.growthArea && <Badge variant="secondary">{task.growthArea}</Badge>}
          <Badge variant="xp">+{task.xpReward} XP</Badge>
          <Badge variant="outline">~{task.estimatedDurationMinutes} min</Badge>
        </div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">{task.title}</h1>
        <p className="text-muted-foreground mt-2">{task.description}</p>
      </div>

      <div className="flex items-center justify-between p-5 rounded-xl border bg-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-xp flex items-center justify-center">
            <Zap className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {task.status === "completed" ? "Task completed" : "Ready to begin?"}
            </p>
            <p className="text-xs text-muted-foreground">
              {task.status === "completed" ? "Great work!" : `Earn ${task.xpReward} XP upon completion`}
            </p>
          </div>
        </div>
        {task.status !== "completed" && (
          <div className="flex gap-2">
            <Button
              variant="accent"
              size="sm"
              disabled={completeMutation.isPending}
              onClick={handleComplete}
            >
              {completeMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Mark as Complete
            </Button>
          </div>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["why"]} className="w-full">
        {task.whyRecommended.length > 0 && (
          <AccordionItem value="why">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Why is this recommended for you?
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                {task.whyRecommended.map((reason, i) => (
                  <p key={i}>• {reason}</p>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {task.expectedOutcomes.length > 0 && (
          <AccordionItem value="achieve">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                What you'll achieve
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm">
                {task.expectedOutcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {task.resources.length > 0 && (
          <AccordionItem value="resources">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Resources
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {internalResources.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Internal</p>
                    <div className="space-y-2">
                      {internalResources.map((r) => (
                        <ResourceLink key={r.id} resource={r} />
                      ))}
                    </div>
                  </div>
                )}
                {externalResources.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">External</p>
                    <div className="space-y-2">
                      {externalResources.map((r) => (
                        <ResourceLink key={r.id} resource={r} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

function ResourceLink({ resource }: { resource: LearningResource }) {
  const Icon = resourceTypeIcons[resource.resourceType] ?? ExternalLink;
  const label = resourceTypeLabels[resource.resourceType] ?? resource.resourceType;

  const content = (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <span className="text-sm flex-1">{resource.title}</span>
      <Badge variant="secondary" className="text-[10px]">{label}</Badge>
    </div>
  );

  if (resource.url) {
    return (
      <a href={resource.url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
