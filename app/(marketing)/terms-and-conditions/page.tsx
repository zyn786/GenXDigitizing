import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";

export const metadata: Metadata = {
  alternates: { canonical: "/terms-and-conditions" },
  title: "Terms & Conditions — genxdigitizing",
  description: "Terms of service for using genxdigitizing embroidery digitizing services.",
};

export default function TermsPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Terms & Conditions", url: "/terms-and-conditions" },
        ]}
      />
      <div className="overflow-x-hidden bg-[var(--bg)] text-[var(--txt)]">
        <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6 sm:py-16">
          <span className="mb-4 inline-flex rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Legal
          </span>
          <h1 className="mb-3 font-syne text-[clamp(28px,5vw,42px)] font-bold leading-[1.15]">
            Terms &amp; Conditions
          </h1>
          <p className="mb-10 text-sm text-[var(--txt3)]">Last updated: May 23, 2026</p>

          <div className="prose prose-sm max-w-none space-y-8 leading-relaxed text-[var(--txt2)]">
            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using genxdigitizing services (&quot;Services&quot;), you agree to
                be bound by these Terms &amp; Conditions. If you do not agree, please do not use our
                Services. We reserve the right to update these terms at any time. Continued use
                after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                2. Services Provided
              </h2>
              <p>genxdigitizing provides professional embroidery digitizing services including:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Embroidery digitizing — converting artwork to machine-ready stitch files (DST,
                  PES, EMB, JEF, XXX, VIP, HUS)
                </li>
                <li>Vector art conversion — raster to vector conversion for logos and designs</li>
                <li>Custom patch digitizing — digitized patches with merrow borders</li>
              </ul>
              <p>
                All services include free unlimited revisions, free format conversions, and free
                rush/urgent turnaround as standard. There are no hidden fees.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                3. Orders &amp; Pricing
              </h2>
              <p>
                All prices are quoted in USD. Pricing is based on stitch count, design complexity,
                and size. Price estimates provided before order placement are final — we never
                increase prices after an order is placed. By submitting an order, you authorize us
                to begin work and agree to pay the quoted amount upon delivery.
              </p>
              <p>
                Turnaround times (Standard 12–24h, Rush 6h, Urgent 3h) are estimates based on
                current workload. While we consistently meet these targets, they are not guaranteed
                in cases of force majeure, technical issues, or unusually complex designs.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                4. Revisions &amp; Quality Guarantee
              </h2>
              <p>
                We offer unlimited free revisions on all orders. If the digitized output does not
                match your expectations or has errors, you may request revisions at no additional
                cost. Revision requests must be specific — please describe what needs adjustment.
                Our quality guarantee means we work until you&apos;re satisfied.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                5. Payment Terms
              </h2>
              <p>
                Payment is processed via Payoneer. For new clients, payment is required before file
                delivery. Established clients may be eligible for post-delivery payment terms. All
                invoices are due upon receipt unless otherwise agreed. Late payments may result in
                order processing delays.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                6. Refund Policy
              </h2>
              <p>
                Our refund policy is detailed on our{" "}
                <a href="/refund-policy" className="text-[#2563EB] hover:underline">
                  Refund Policy page
                </a>
                . In summary: we offer full refunds before work begins, partial refunds for quality
                issues unresolved by revisions, and no refunds after file delivery and acceptance.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                7. Intellectual Property
              </h2>
              <p>
                You retain all rights to artwork and designs you upload. The digitized output files
                we produce are your property upon delivery and payment. We claim no ownership over
                your designs. We may, with your explicit permission, showcase completed work in our
                portfolio. You can opt out at any time by contacting support.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                8. Limitation of Liability
              </h2>
              <p>
                genxdigitizing is not liable for indirect, incidental, or consequential damages
                arising from use of our Services. Our total liability for any claim related to our
                Services is limited to the amount paid for the specific order in question. We are
                not responsible for production issues caused by incorrect file format selection,
                machine compatibility problems not disclosed at order time, or artwork quality
                issues in the source files you provide.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                9. Account Responsibilities
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activity under your account. You agree to provide accurate, current, and
                complete information. Notify us immediately of any unauthorized account use.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">
                10. Termination
              </h2>
              <p>
                We reserve the right to suspend or terminate accounts for violation of these terms,
                fraudulent activity, or abusive behavior. You may close your account at any time by
                contacting support. Data retention follows our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-syne text-lg font-bold text-[var(--txt)]">11. Contact</h2>
              <p>
                Questions about these terms? Contact us at{" "}
                <a
                  href="mailto:support@genxdigitizing.com"
                  className="font-medium text-[#2563EB] hover:underline"
                >
                  support@genxdigitizing.com
                </a>{" "}
                or via our{" "}
                <a href="/contact" className="font-medium text-[#2563EB] hover:underline">
                  contact page
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
