import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
          Terms of <span className="text-gold italic font-light">Service</span>
        </h1>
        <p className="text-body-md text-on-surface-variant mb-12 opacity-60">Last updated: July 2026</p>

        <div className="space-y-10 text-body-md text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ContractDiff ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to all the terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">2. Description of Service</h2>
            <p>
              ContractDiff provides an AI-powered contract comparison and analysis platform. Users may upload
              contracts, receive automated diff analyses, and access AI-generated summaries. The Service is
              provided "as is" and is not a substitute for professional legal advice.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activity that occurs under your account. You must notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">5. Intellectual Property</h2>
            <p>
              The Service, including its original content, features, and functionality, is owned by ContractDiff
              International and is protected by international copyright, trademark, and other intellectual
              property laws. You may not modify, reproduce, distribute, or create derivative works without our
              express written consent.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">6. User Content</h2>
            <p>
              You retain all rights to the contracts and documents you upload. By uploading content, you grant
              us a limited license to process, store, and analyze the content solely for the purpose of
              providing the Service. We do not claim ownership of your content.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">7. AI Analysis Disclaimer</h2>
            <p>
              ContractDiff uses artificial intelligence to generate contract analyses and summaries. These
              outputs are for informational purposes only and do not constitute legal advice. You should
              consult a qualified legal professional for any legal matters. We make no warranties regarding
              the accuracy, completeness, or reliability of AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">8. Limitation of Liability</h2>
            <p>
              In no event shall ContractDiff International be liable for any indirect, incidental, special,
              consequential, or punitive damages arising out of or relating to your use of the Service. Our
              total liability for any claims shall not exceed the amount you paid us, if any, for accessing
              the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these
              terms or for any other reason at our discretion. Upon termination, your right to use the
              Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of material changes
              via email or through the Service. Continued use of the Service after changes constitutes
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">11. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of England and Wales,
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-on-surface text-2xl mb-4">12. Contact</h2>
            <p>
              For questions about these Terms, please contact us at{' '}
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