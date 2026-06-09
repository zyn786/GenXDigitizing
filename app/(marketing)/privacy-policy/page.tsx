import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — genxdigitizing",
  description: "How genxdigitizing collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 mb-4">
          Legal
        </span>
        <h1 className="font-syne font-bold text-[clamp(28px,5vw,42px)] leading-[1.15] mb-3">
          Privacy Policy
        </h1>
        <p className="text-[var(--txt3)] text-sm mb-10">Last updated: May 23, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-[var(--txt2)] leading-relaxed">
          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">1. Information We Collect</h2>
            <p>
              When you use genxdigitizing (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we collect information
              you provide directly: your name, email address, company name, phone number, and design files
              you upload for digitizing. We also collect order details including service type, turnaround
              preference, and output format requirements.
            </p>
            <p>
              Automatically: we collect standard server logs including IP address, browser type, pages visited,
              and time spent on site through Google Analytics. We do not sell, rent, or share your personal
              information with third parties for their own marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Process and fulfill your digitizing orders</li>
              <li>Communicate order status updates and delivery notifications</li>
              <li>Send invoices and payment confirmations</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Improve our services and website experience</li>
              <li>Send marketing communications (only with your consent, opt-out anytime)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">3. Design Files &amp; Intellectual Property</h2>
            <p>
              Design files you upload for digitizing remain your property. We store files securely for order
              processing and quality assurance. We do not use, share, or distribute your designs except as
              necessary to complete your order. Completed digitized output files are delivered to you and
              stored for reference purposes. You may request deletion of your files at any time.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">4. Data Storage &amp; Security</h2>
            <p>
              Your data is stored on Supabase (encrypted at rest and in transit) and AWS S3 for file storage.
              We use industry-standard security practices including TLS encryption, API authentication, and
              row-level security on our database. Payment processing is handled by Payoneer — we never see
              or store your full payment details.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">5. Cookies</h2>
            <p>
              We use essential cookies for authentication (Supabase session tokens) and optional analytics
              cookies via Google Analytics. You can disable analytics cookies through your browser settings
              without affecting core site functionality.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">6. Third-Party Services</h2>
            <p>
              We use the following trusted third-party services to operate our platform:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Supabase</strong> — Database, authentication, and file storage</li>
              <li><strong>Resend</strong> — Transactional email delivery</li>
              <li><strong>Payoneer</strong> — Payment processing</li>
              <li><strong>Google Analytics</strong> — Anonymous website analytics</li>
              <li><strong>Cloudinary</strong> — Image optimization and delivery</li>
            </ul>
            <p>Each provider has its own privacy policy governing their handling of your data.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data and design files</li>
              <li>Opt out of marketing communications</li>
              <li>Export your order history and data</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:support@genxdigitizing.com" className="text-[#2563EB] hover:underline">support@genxdigitizing.com</a>.</p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">8. Policy Updates</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated via email
              or through a notice on our website. Continued use of our services after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-bold text-lg text-[var(--txt)] mb-3">9. Contact</h2>
            <p>
              Questions about this privacy policy? Reach out at{" "}
              <a href="mailto:support@genxdigitizing.com" className="text-[#2563EB] hover:underline font-medium">support@genxdigitizing.com</a>{" "}
              or through our{" "}
              <a href="/contact" className="text-[#2563EB] hover:underline font-medium">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
