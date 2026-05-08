import type { Metadata } from "next";

import { PublicPageHero } from "@/components/marketing/public-page-hero";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Privacy Policy"),
  description: "How GenX Digitizing collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PublicPageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="How we collect, use, and protect your information."
      />

      <section className="px-4 pb-16 md:px-8">
        <div className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-border/80 bg-card p-6 md:p-10">
          <LegalSection title="Information we collect">
            <p>
              When you use GenX Digitizing, we collect information you provide directly — such as
              your name, email address, company name, and phone number when you register, place an
              order, or contact us. We also collect information automatically, including your IP
              address, browser type, and usage data when you interact with our platform.
            </p>
            <p>
              For orders and billing, we collect artwork files, design specifications, invoice
              details, and payment records. We do not store full payment card numbers — payment
              processing is handled by our payment provider.
            </p>
          </LegalSection>

          <LegalSection title="How we use your information">
            <ul>
              <li>To process and fulfill your digitizing, vector art, and patch orders</li>
              <li>To communicate order status, proofs, and delivery updates</li>
              <li>To send invoices, receipts, and billing notifications</li>
              <li>To provide client portal access and support ticket functionality</li>
              <li>To improve our platform, services, and customer experience</li>
              <li>To comply with applicable legal obligations</li>
            </ul>
          </LegalSection>

          <LegalSection title="Artwork and file storage">
            <p>
              Files you upload — including source artwork, proofs, and production files — are stored
              securely in our cloud storage infrastructure. Files are retained for the duration of
              your engagement and for a reasonable period thereafter to support revision and
              re-order requests. You may request deletion of your files at any time by contacting
              support.
            </p>
          </LegalSection>

          <LegalSection title="Information sharing">
            <p>
              We do not sell your personal information. We share data only with trusted service
              providers who help us operate the platform (such as cloud storage, email delivery,
              and payment processing), and only to the extent necessary to provide our services.
              We may disclose information when required by law.
            </p>
          </LegalSection>

          <LegalSection title="Data security">
            <p>
              We use industry-standard encryption in transit (TLS) and at rest. Access to customer
              data within our team is role-based and limited to what is necessary to deliver your
              service. Despite these measures, no system is completely secure — if you have concerns,
              contact us at info@genxdigitizing.com.
            </p>
          </LegalSection>

          <LegalSection title="Your rights">
            <p>
              Depending on your jurisdiction, you may have the right to access, correct, or delete
              your personal information. To exercise these rights, contact us at
              info@genxdigitizing.com and we will respond within a reasonable time frame.
            </p>
          </LegalSection>

          <LegalSection title="Changes to this policy">
            <p>
              We may update this policy from time to time. When we do, we will revise the date
              at the bottom of this page. Continued use of our platform after changes are posted
              constitutes acceptance of the updated policy.
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
