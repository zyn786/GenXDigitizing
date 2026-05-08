import type { Metadata } from "next";
import React from "react";

import { PublicPageHero } from "@/components/marketing/public-page-hero";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Refund Policy"),
  description: "GenX Digitizing refund and revision policy for digitizing, vector art, and custom patch orders.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <PublicPageHero
        eyebrow="Legal"
        title="Refund Policy"
        description="Our commitment to getting it right — and what happens if we don't."
      />

      <section className="px-4 pb-16 md:px-8">
        <div className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-border/80 bg-card p-6 md:p-10">
          <LegalSection title="Our revision commitment">
            <p>
              Every order includes unlimited revisions until you approve the proof. We will not
              close an order or mark delivery complete until you are satisfied with the output.
              This commitment applies to embroidery digitizing, vector art conversion, and custom
              patch orders.
            </p>
          </LegalSection>

          <LegalSection title="Refund eligibility">
            <p>
              Because all work is custom-produced to your specifications, we evaluate refund
              requests case by case. Refunds or credits may be issued in the following situations:
            </p>
            <ul>
              <li>We are unable to complete your order due to technical limitations</li>
              <li>The final delivered file does not match the approved proof</li>
              <li>We missed a clearly agreed production deadline and you no longer need the work</li>
            </ul>
            <p>
              Refunds are not issued for orders where a proof has been approved and delivered
              correctly, or for change-of-mind cancellations after production has begun.
            </p>
          </LegalSection>

          <LegalSection title="Rush and same-day orders">
            <p>
              Rush and same-day fees are non-refundable once production has started. If a rush
              order is not delivered within the agreed window due to our error, the rush fee will
              be refunded or credited.
            </p>
          </LegalSection>

          <LegalSection title="Cancellations">
            <p>
              You may cancel an order at no charge before we begin production. Once a designer
              has started work on your file, a partial fee may apply to cover work completed.
              Contact us as soon as possible if you need to cancel — the sooner you notify us,
              the more we can accommodate.
            </p>
          </LegalSection>

          <LegalSection title="How to request a refund">
            <p>
              Contact us at info@genxdigitizing.com or through your client portal with your
              order reference number and a description of the issue. We respond within one
              business day and aim to resolve billing disputes fairly and quickly.
            </p>
          </LegalSection>

          <p className="text-xs text-muted-foreground">Last updated: April 2026</p>
        </div>
      </section>
    </>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-muted-foreground [&_li]:ml-4 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}
