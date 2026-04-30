import type { Metadata } from "next";
import React from "react";

import { PublicPageHero } from "@/components/marketing/public-page-hero";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Terms & Conditions"),
  description: "Terms and conditions governing use of GenX Digitizing services and platform.",
};

export default function TermsPage() {
  return (
    <>
      <PublicPageHero
        eyebrow="Legal"
        title="Terms &amp; Conditions"
        description="The terms governing your use of GenX Digitizing services and platform."
      />

      <section className="px-4 pb-16 md:px-8">
        <div className="mx-auto max-w-4xl space-y-8 rounded-[2rem] border border-border/80 bg-card/70 p-6 backdrop-blur-xl md:p-10">
          <LegalSection title="Acceptance of terms">
            <p>
              By using GenX Digitizing services — including our website, client portal, and any
              related services — you agree to these terms. If you do not agree, do not use our
              services.
            </p>
          </LegalSection>

          <LegalSection title="Services">
            <p>
              GenX Digitizing provides embroidery digitizing, vector art conversion, and custom
              patch production services. All work is custom-produced to client specifications.
              Service descriptions, pricing, and turnaround times are provided as estimates and
              may be subject to revision based on the complexity of your artwork.
            </p>
          </LegalSection>

          <LegalSection title="Client responsibilities">
            <ul>
              <li>You must own or have the right to use any artwork you submit for digitizing</li>
              <li>You are responsible for the accuracy of your order specifications</li>
              <li>You must review and approve or request revisions on all proofs in a timely manner</li>
              <li>You must not submit artwork that infringes intellectual property rights</li>
            </ul>
          </LegalSection>

          <LegalSection title="Intellectual property">
            <p>
              You retain ownership of your original artwork. GenX Digitizing retains ownership
              of its proprietary digitizing techniques, software, and production workflows. The
              production-ready files we deliver are licensed to you for use in your decoration
              and production activities.
            </p>
          </LegalSection>

          <LegalSection title="Payment terms">
            <p>
              Payment terms are as specified in your invoice. Overdue balances may incur late
              fees. We reserve the right to withhold delivery of final files until payment is
              received or a payment arrangement is confirmed in writing.
            </p>
          </LegalSection>

          <LegalSection title="Limitation of liability">
            <p>
              GenX Digitizing&apos;s liability for any claim arising out of our services is limited
              to the amount paid for the specific order in question. We are not liable for
              indirect, incidental, or consequential damages, including production losses or
              missed deadlines that arise from circumstances outside our control.
            </p>
          </LegalSection>

          <LegalSection title="Changes to services and terms">
            <p>
              We may update these terms or modify our services at any time. We will make
              reasonable efforts to notify active clients of material changes. Continued use of
              our services after changes are posted constitutes acceptance of the updated terms.
            </p>
          </LegalSection>

          <LegalSection title="Contact">
            <p>
              For questions about these terms, contact us at info@genxdigitizing.com or
              through your client portal support thread.
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
