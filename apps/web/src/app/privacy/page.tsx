import Link from 'next/link';
import { Header } from '@/components/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - SPACE-App',
  description:
    'Learn how SPACE-App collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto prose prose-gray dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p className="lead">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <p>
              At SPACE-App ("we," "our," or "us"), we are committed to protecting
              your privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our platform.
            </p>

            <h2>1. Information We Collect</h2>

            <h3>1.1 Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide, including:</p>
            <ul>
              <li>Name and email address</li>
              <li>Account credentials</li>
              <li>Business information (for space owners)</li>
              <li>Payment information</li>
              <li>Communication preferences</li>
            </ul>

            <h3>1.2 Automatically Collected Information</h3>
            <p>When you access our platform, we automatically collect:</p>
            <ul>
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and preferences</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide and maintain our services</li>
              <li>Process transactions and bookings</li>
              <li>Send administrative notifications</li>
              <li>Respond to inquiries and support requests</li>
              <li>Improve our platform and user experience</li>
              <li>Comply with legal obligations</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul>
              <li>
                <strong>Other Users:</strong> Space owners and advertisers may see
                limited profile information necessary for bookings.
              </li>
              <li>
                <strong>Service Providers:</strong> Third-party vendors who assist
                in operating our platform (payment processors, hosting providers).
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect our rights and safety.
              </li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal information, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Secure data storage practices</li>
            </ul>
            <p>
              However, no method of transmission over the Internet is 100% secure.
              We cannot guarantee absolute security.
            </p>

            <h2>5. Your Rights and Choices</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@space-app.com">privacy@space-app.com</a>.
            </p>

            <h2>6. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience.
              You can control cookie preferences through your browser settings.
              Types of cookies we use:
            </p>
            <ul>
              <li>
                <strong>Essential Cookies:</strong> Required for platform
                functionality.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand usage
                patterns.
              </li>
              <li>
                <strong>Preference Cookies:</strong> Remember your settings and
                preferences.
              </li>
            </ul>

            <h2>7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to
              provide our services and fulfill the purposes outlined in this
              policy. When data is no longer needed, we securely delete or
              anonymize it.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              Our platform is not intended for children under 18 years of age. We
              do not knowingly collect personal information from children. If you
              believe we have collected information from a child, please contact
              us immediately.
            </p>

            <h2>9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries
              other than your own. We ensure appropriate safeguards are in place
              for such transfers in compliance with applicable data protection
              laws.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify
              you of any material changes by posting the new policy on this page
              and updating the "Last updated" date.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data
              practices, please contact us:
            </p>
            <ul>
              <li>
                Email:{' '}
                <a href="mailto:privacy@space-app.com">privacy@space-app.com</a>
              </li>
              <li>
                Mail: SPACE-App, Privacy Team, [Your Address]
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SPACE-App. All rights reserved.
            </p>
            <nav className="flex gap-6">
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
