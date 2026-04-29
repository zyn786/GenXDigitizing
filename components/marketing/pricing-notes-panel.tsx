import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const notes = [
  {
    q: "What formats do you deliver?",
    a: "We deliver in DST, PES, EMB, EXP, JEF, and most major machine formats. Just tell us your machine when ordering.",
  },
  {
    q: "Is rush turnaround available?",
    a: "Yes. Same-day and 4-hour rush options are available for most jobs. Rush pricing is quoted individually based on complexity and timing.",
  },
  {
    q: "What if the proof needs changes?",
    a: "Starter orders include one revision. Production orders include unlimited revisions until you approve. Rush jobs follow the same revision process.",
  },
  {
    q: "Do you digitize patches and specialty work?",
    a: "Yes — embroidered patches, chenille, 3D puff, appliqué, and specialty work are all quoted individually under the Rush & Specialty tier.",
  },
];

export function PricingNotesPanel() {
  return (
    <section className="px-4 py-8 md:px-8 md:py-10">
      <div className="page-shell">
        <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
          <CardHeader>
            <CardTitle className="text-xl">Common pricing questions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {notes.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-border/80 bg-secondary/60 p-5"
              >
                <div className="text-sm font-semibold">{item.q}</div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">{item.a}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
