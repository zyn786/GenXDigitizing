import { Clock3, Mail, MessageSquare, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const details = [
  {
    icon: Mail,
    title: "Email us",
    text: "Send your artwork and project details to get a quote within one business day.",
    value: "info@genxdigitizing.com",
  },
  {
    icon: Clock3,
    title: "Response time",
    text: "Standard inquiries are answered within 24 hours. Rush requests are prioritized.",
    value: "Within 24 hours",
  },
  {
    icon: RefreshCw,
    title: "Revisions included",
    text: "Production orders include unlimited revisions until you approve the final file.",
    value: "Revision-inclusive",
  },
  {
    icon: MessageSquare,
    title: "Client portal support",
    text: "Existing clients can open support tickets directly from their order dashboard.",
    value: "Portal-based support",
  },
];

export function ContactDetailsPanel() {
  return (
    <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
      <CardHeader>
        <CardTitle className="text-xl">How we work together</CardTitle>
        <p className="text-sm text-muted-foreground">
          Fast replies, clear proofs, and revisions until you're satisfied.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {details.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-2xl border border-border/80 bg-secondary/60 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{item.text}</div>
                <div className="mt-1.5 text-xs font-medium text-primary">{item.value}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
