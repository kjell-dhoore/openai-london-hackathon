import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lightbulb, BookOpen, ExternalLink, FileText, Video, CheckCircle2, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function TaskDetail() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
        <Link to="/growth"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Growth Path</Link>
      </Button>

      {/* Task Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">Error Handling</Badge>
          <Badge variant="xp">+120 XP</Badge>
          <Badge variant="outline">~45 min</Badge>
        </div>
        <h1 className="text-2xl font-mono font-bold tracking-tight">
          Improve error handling in async services
        </h1>
        <p className="text-muted-foreground mt-2">
          Implement structured error handling patterns across the notification and payment async services,
          following the team's established conventions.
        </p>
      </div>

      {/* CTA — prominent, right after header */}
      <div className="flex items-center justify-between p-5 rounded-xl border bg-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-xp flex items-center justify-center">
            <Zap className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">Ready to begin?</p>
            <p className="text-xs text-muted-foreground">Earn 120 XP upon completion</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Mark as Complete</Button>
          <Button variant="accent" size="sm">Start Task</Button>
        </div>
      </div>

      {/* Collapsible Details */}
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="why">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Why is this recommended for you?
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Your recent PR in <span className="font-medium text-foreground">notification-service</span> received feedback about inconsistent error handling</p>
              <p>• Error handling is a key gap for your target role as <span className="font-medium text-foreground">Mid-Level Backend Engineer</span></p>
              <p>• Your team lead flagged this as a high-priority growth area in your last 1:1</p>
              <p>• Completing this will improve your production readiness score by <span className="font-medium text-gradient-xp">+8%</span></p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="achieve">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              What you'll achieve
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Understand when to use custom error classes vs. generic errors
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Apply the team's error taxonomy to two production services
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Gain confidence handling async failures gracefully
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="resources">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Resources
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Internal</p>
                <div className="space-y-2">
                  <ResourceLink icon={FileText} label="Error Handling Standards (Confluence)" tag="Internal Doc" />
                  <ResourceLink icon={FileText} label="PR #482 — Error refactoring example" tag="GitHub" />
                  <ResourceLink icon={FileText} label="1:1 coaching notes — Q1 feedback" tag="Google Drive" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">External</p>
                <div className="space-y-2">
                  <ResourceLink icon={ExternalLink} label="Node.js Error Handling Best Practices" tag="Blog" />
                  <ResourceLink icon={Video} label="Async Error Patterns in Production" tag="Video · 12 min" />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function ResourceLink({ icon: Icon, label, tag }: { icon: any; label: string; tag: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <span className="text-sm flex-1">{label}</span>
      <Badge variant="secondary" className="text-[10px]">{tag}</Badge>
    </div>
  );
}
