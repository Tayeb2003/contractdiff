import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-16 max-w-4xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-body-md text-gold hover:text-on-surface transition-colors mb-8"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Home
        </Link>

        <h1 className="font-serif text-on-surface mb-4" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
          Privacy <span className="text-gold italic font-light">Policy</span>
        </h1>
        <p className="text-body-md text-on-surface-variant mb-12 opacity-60">Last updated: July 2026</p>

        <div className="space-y-10 text-body-md text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">1. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-on-surface">Account Information:</strong> Name, email address, and encrypted password when you register.</li>
              <li><strong className="text-on-surface">Document Content:</strong> Contracts and legal documents you upload for analysis. We process these solely to provide the Service.</li>
              <li><strong className="text-on-surface">Usage Data:</strong> Information about how you interact with the Service, including pages visited and features used.</li>
              <li><strong className="text-on-surface">API Keys:</strong> If you provide a Gemini API key, it is stored encrypted and used only for AI analysis requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process and analyze contracts you upload</li>
              <li>Send service-related communications (e.g., password resets)</li>
              <li>Detect and prevent fraudulent or abusive use</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">3. Data Storage and Security</h2>
            <p>
              Your data is stored on secure servers using industry-standard encryption. Document content is
              encrypted at rest. We implement appropriate technical and organizational measures to protect
              your data against unauthorized access, alteration, or destruction.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">4. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-on-surface">AI Providers:</strong> Contract content may be sent to Google Gemini for analysis if you provide an API key.</li>
              <li><strong className="text-on-surface">Service Providers:</strong> Third-party services that help us operate the platform (hosting, database, email).</li>
              <li><strong className="text-on-surface">Legal Authorities:</strong> If required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">5. Data Retention</h2>
            <p>
              We retain your account information for as long as your account is active. Document content and
              analysis results are retained until you delete them or close your account. You may request
              deletion of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Access your personal data held by us</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and service functionality. We do not use tracking
              cookies or third-party analytics that collect personal data. You can control cookie settings
              through your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">8. International Data Transfers</h2>
            <p>
              Your data may be processed in countries where our servers or service providers are located.
              We ensure appropriate safeguards are in place for international data transfers in compliance
              with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">9. Self-Hosted Deployments</h2>
            <p>
              If you deploy ContractDiff on your own infrastructure, data handling is governed by your own
              policies. We do not have access to data processed in self-hosted instances.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with
              an updated revision date. Material changes will be communicated via email or through the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">11. Contact</h2>
            <p>
              For privacy-related inquiries, please contact us at{' '}
              <a href="mailto:hello@contractdiff.com" className="text-gold hover:underline">
                hello@contractdiff.com
              </a>.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}