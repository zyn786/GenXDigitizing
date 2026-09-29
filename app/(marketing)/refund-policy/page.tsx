import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";

export const metadata: Metadata = {
  title: "Refund Policy — genxdigitizing",
  description: "Our refund and satisfaction guarantee policy for embroidery digitizing services.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Refund Policy", url: "/refund-policy" },
        ]}
      />
      <div className="overflow-x-hidden bg-[var(--bg)] text-[var(--txt)]">
        <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6 sm:py-16">
          <span className="mb-4 inline-flex rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Legal
          </span>
          <h1 className="mb-3 font-syne text-[clamp(28px,5vw,42px)] font-bold leading-[1.15]">
            Refund Policy
          </h1>
          <p className="mb-10 text-sm text-[var(--txt3)]">Last updated: May 23, 2026</p>

          <div className="prose prose-sm max-w-none space-y-8 leading-relaxed text-[var(--txt2)]">
            <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-5">
              <p className="mb-1 font-syne font-bold text-[#166534]">Our Promise</p>
              <p className="text-sm text-[#166534]">
                We stand behind every digitized file we deliver. With unlimited free revisions, most
                issues are resolved long before a refund is needed. If we cannot meet your
                requirements after reasonable revision attempts, we&apos;ll make it right.
              </p>
            </div>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                1. Full Refunds — Before Work Begins
              </h2>
              <p>
                You may cancel your order and receive a <strong>100% refund</strong> at any time
                before we begin digitizing your file. Once work has started, our digitizers have
                invested time and labor into your project.
              </p>
              <p>
                To cancel before work begins: contact{" "}
                <a
                  href="mailto:support@genxdigitizing.com"
                  className="text-[#2563EB] hover:underline"
                >
                  support@genxdigitizing.com
                </a>{" "}
                with your order number. We process pre-work cancellations within 24 hours.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                2. Quality-Based Refunds
              </h2>
              <p>
                If you are unsatisfied with the quality of our work and we cannot resolve the issue
                after reasonable revision attempts (typically 2–3 revision rounds addressing
                specific, actionable feedback), you may be eligible for a refund:
              </p>
              <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Minor Issues",
                    refund: "20–40%",
                    desc: "Small corrections that could be done but you prefer not to continue",
                  },
                  {
                    label: "Moderate Issues",
                    refund: "40–60%",
                    desc: "Significant quality gaps despite revision attempts",
                  },
                  {
                    label: "Unusable Output",
                    refund: "Full Refund",
                    desc: "Fundamental digitizing errors that cannot be corrected",
                  },
                ].map((tier) => (
                  <div
                    key={tier.label}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--txt3)]">
                      {tier.label}
                    </p>
                    <p className="mb-1 font-syne text-2xl font-bold text-[#2563EB]">
                      {tier.refund}
                    </p>
                    <p className="text-xs text-[var(--txt3)]">{tier.desc}</p>
                  </div>
                ))}
              </div>
              <p>
                Refund eligibility is determined on a case-by-case basis. We always prioritize
                fixing the issue first — refunds are a last resort.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                3. Non-Refundable Situations
              </h2>
              <p>Refunds are not available in the following cases:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>File already delivered and accepted</strong> — Once you download and use
                  the digitized file in production, it is considered accepted.
                </li>
                <li>
                  <strong>Poor source artwork</strong> — If the original artwork you provided is
                  low-resolution, heavily pixelated, or unclear, we&apos;ll communicate this
                  upfront. Results limited by source quality are not grounds for refund.
                </li>
                <li>
                  <strong>Incorrect format selection</strong> — If you select the wrong machine
                  format and we delivered exactly what was requested.
                </li>
                <li>
                  <strong>Change of mind</strong> — After work has started, &quot;I no longer need
                  it&quot; is not eligible for refund.
                </li>
                <li>
                  <strong>Design complexity not disclosed</strong> — If the design is substantially
                  more complex than the reference artwork suggested and we proceed after notifying
                  you.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                4. Free Services Clause
              </h2>
              <p>
                Our free services — unlimited revisions, format conversions, rush/urgent turnaround
                — are complimentary and do not carry monetary value for refund calculations. Refund
                amounts are based solely on the base digitizing service price paid.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                5. How to Request a Refund
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Contact{" "}
                  <a
                    href="mailto:support@genxdigitizing.com"
                    className="text-[#2563EB] hover:underline"
                  >
                    support@genxdigitizing.com
                  </a>{" "}
                  with your order number
                </li>
                <li>Describe the specific issues you&apos;re experiencing</li>
                <li>
                  We&apos;ll attempt to resolve through revisions first (typically 24–48 hours)
                </li>
                <li>
                  If unresolved, we&apos;ll assess refund eligibility and process within 3–5
                  business days
                </li>
              </ol>
              <p>
                Approved refunds are returned via the original payment method (Payoneer). Processing
                time depends on your payment provider — typically 5–10 business days.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">6. Contact</h2>
              <p>
                Refund questions or disputes? Reach us at{" "}
                <a
                  href="mailto:support@genxdigitizing.com"
                  className="font-medium text-[#2563EB] hover:underline"
                >
                  support@genxdigitizing.com
                </a>{" "}
                or our{" "}
                <a href="/contact" className="font-medium text-[#2563EB] hover:underline">
                  contact page
                </a>
                . We respond within 1 hour during business hours.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
