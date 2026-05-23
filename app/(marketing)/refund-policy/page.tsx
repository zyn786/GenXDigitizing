import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — GenX Digitizing",
  description: "Our refund and satisfaction guarantee policy for embroidery digitizing services.",
};

export default function RefundPolicyPage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 mb-4">
          Legal
        </span>
        <h1 className="font-syne font-extrabold text-[clamp(28px,5vw,42px)] leading-[1.15] mb-3">
          Refund Policy
        </h1>
        <p className="text-[var(--txt3)] text-sm mb-10">Last updated: May 23, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-[var(--txt2)] leading-relaxed">
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-5">
            <p className="font-syne font-bold text-[#166534] mb-1">Our Promise</p>
            <p className="text-[#166534] text-sm">
              We stand behind every digitized file we deliver. With unlimited free revisions, most issues
              are resolved long before a refund is needed. If we cannot meet your requirements after
              reasonable revision attempts, we&apos;ll make it right.
            </p>
          </div>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">1. Full Refunds — Before Work Begins</h2>
            <p>
              You may cancel your order and receive a <strong>100% refund</strong> at any time before
              we begin digitizing your file. Once work has started, our digitizers have invested time
              and labor into your project.
            </p>
            <p>
              To cancel before work begins: contact{" "}
              <a href="mailto:support@genxdigitizing.com" className="text-[#2563EB] hover:underline">support@genxdigitizing.com</a>{" "}
              with your order number. We process pre-work cancellations within 24 hours.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">2. Quality-Based Refunds</h2>
            <p>
              If you are unsatisfied with the quality of our work and we cannot resolve the issue after
              reasonable revision attempts (typically 2–3 revision rounds addressing specific, actionable
              feedback), you may be eligible for a refund:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              {[
                { label: "Minor Issues", refund: "20–40%", desc: "Small corrections that could be done but you prefer not to continue" },
                { label: "Moderate Issues", refund: "40–60%", desc: "Significant quality gaps despite revision attempts" },
                { label: "Unusable Output", refund: "Full Refund", desc: "Fundamental digitizing errors that cannot be corrected" },
              ].map((tier) => (
                <div key={tier.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-center">
                  <p className="text-xs text-[var(--txt3)] uppercase tracking-wider font-semibold mb-2">{tier.label}</p>
                  <p className="font-syne font-bold text-2xl text-[#2563EB] mb-1">{tier.refund}</p>
                  <p className="text-xs text-[var(--txt3)]">{tier.desc}</p>
                </div>
              ))}
            </div>
            <p>
              Refund eligibility is determined on a case-by-case basis. We always prioritize fixing the
              issue first — refunds are a last resort.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">3. Non-Refundable Situations</h2>
            <p>Refunds are not available in the following cases:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>File already delivered and accepted</strong> — Once you download and use the digitized file in production, it is considered accepted.</li>
              <li><strong>Poor source artwork</strong> — If the original artwork you provided is low-resolution, heavily pixelated, or unclear, we&apos;ll communicate this upfront. Results limited by source quality are not grounds for refund.</li>
              <li><strong>Incorrect format selection</strong> — If you select the wrong machine format and we delivered exactly what was requested.</li>
              <li><strong>Change of mind</strong> — After work has started, &quot;I no longer need it&quot; is not eligible for refund.</li>
              <li><strong>Design complexity not disclosed</strong> — If the design is substantially more complex than the reference artwork suggested and we proceed after notifying you.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">4. Free Services Clause</h2>
            <p>
              Our free services — unlimited revisions, format conversions, rush/urgent turnaround — are
              complimentary and do not carry monetary value for refund calculations. Refund amounts are
              based solely on the base digitizing service price paid.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">5. How to Request a Refund</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Contact <a href="mailto:support@genxdigitizing.com" className="text-[#2563EB] hover:underline">support@genxdigitizing.com</a> with your order number</li>
              <li>Describe the specific issues you&apos;re experiencing</li>
              <li>We&apos;ll attempt to resolve through revisions first (typically 24–48 hours)</li>
              <li>If unresolved, we&apos;ll assess refund eligibility and process within 3–5 business days</li>
            </ol>
            <p>
              Approved refunds are returned via the original payment method (Payoneer). Processing time
              depends on your payment provider — typically 5–10 business days.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">6. Contact</h2>
            <p>
              Refund questions or disputes? Reach us at{" "}
              <a href="mailto:support@genxdigitizing.com" className="text-[#2563EB] hover:underline font-medium">support@genxdigitizing.com</a>{" "}
              or our{" "}
              <a href="/contact" className="text-[#2563EB] hover:underline font-medium">contact page</a>.
              We respond within 1 hour during business hours.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
