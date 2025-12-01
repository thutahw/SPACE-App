import Link from 'next/link';
import { Header } from '@/components/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - SPACE-App',
  description:
    'Read the terms and conditions for using the SPACE-App marketplace platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto prose prose-gray dark:prose-invert">
            <h1>Terms of Service</h1>
            <p className="lead">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <p>
              Welcome to SPACE-App. These Terms of Service ("Terms") govern your
              use of our platform and services. By accessing or using SPACE-App,
              you agree to be bound by these Terms.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By creating an account or using our services, you confirm that you
              are at least 18 years old and have the legal capacity to enter into
              these Terms. If you are using SPACE-App on behalf of an
              organization, you represent that you have the authority to bind that
              organization to these Terms.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              SPACE-App is a marketplace platform that connects advertisers with
              businesses offering in-store advertising spaces. We provide the
              technology and platform to facilitate these connections but are not
              a party to any agreements between users.
            </p>

            <h2>3. User Accounts</h2>

            <h3>3.1 Account Registration</h3>
            <p>To use certain features, you must create an account. You agree to:</p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update any changes to your information</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3>3.2 Account Termination</h3>
            <p>
              We reserve the right to suspend or terminate accounts that violate
              these Terms or for any other reason at our discretion. You may also
              close your account at any time through your account settings.
            </p>

            <h2>4. User Responsibilities</h2>

            <h3>4.1 For Space Owners</h3>
            <p>As a space owner, you agree to:</p>
            <ul>
              <li>Provide accurate descriptions and images of your spaces</li>
              <li>Have the legal right to offer the advertising space</li>
              <li>Honor confirmed bookings</li>
              <li>Respond to booking requests in a timely manner</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>

            <h3>4.2 For Advertisers</h3>
            <p>As an advertiser, you agree to:</p>
            <ul>
              <li>Provide lawful advertising content only</li>
              <li>Respect the space owner's property and guidelines</li>
              <li>Make timely payments for confirmed bookings</li>
              <li>Not use spaces for illegal or harmful purposes</li>
              <li>Comply with all applicable advertising laws and regulations</li>
            </ul>

            <h2>5. Bookings and Payments</h2>

            <h3>5.1 Booking Process</h3>
            <p>
              Bookings are requests until confirmed by the space owner. Once
              confirmed, both parties are expected to fulfill their obligations.
              Cancellation policies may vary by listing.
            </p>

            <h3>5.2 Pricing</h3>
            <p>
              Space owners set their own prices. All prices are displayed in the
              applicable currency and may be subject to applicable taxes and fees.
            </p>

            <h3>5.3 Payment Terms</h3>
            <p>
              Payment processing is handled through our secure payment partners.
              By making a payment, you agree to the payment processor's terms of
              service.
            </p>

            <h2>6. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Harass, threaten, or discriminate against other users</li>
              <li>Attempt to circumvent platform fees or security measures</li>
              <li>Use automated systems to access the platform without permission</li>
              <li>Distribute malware or harmful code</li>
              <li>Engage in any activity that disrupts the platform</li>
            </ul>

            <h2>7. Content and Intellectual Property</h2>

            <h3>7.1 User Content</h3>
            <p>
              You retain ownership of content you submit. By posting content, you
              grant us a non-exclusive, worldwide license to use, display, and
              distribute that content in connection with our services.
            </p>

            <h3>7.2 Platform Content</h3>
            <p>
              The SPACE-App platform, including its design, features, and content,
              is protected by intellectual property laws. You may not copy,
              modify, or distribute our platform without permission.
            </p>

            <h2>8. Disclaimers</h2>
            <p>
              SPACE-App is provided "as is" without warranties of any kind. We do
              not guarantee:
            </p>
            <ul>
              <li>The accuracy of listings or user information</li>
              <li>The quality or safety of advertised spaces</li>
              <li>Uninterrupted or error-free service</li>
              <li>That the platform will meet your specific requirements</li>
            </ul>

            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, SPACE-App and its
              affiliates, officers, employees, and agents shall not be liable for
              any indirect, incidental, special, consequential, or punitive
              damages arising from your use of the platform.
            </p>

            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless SPACE-App from any claims,
              damages, losses, or expenses arising from your use of the platform,
              violation of these Terms, or infringement of any third-party rights.
            </p>

            <h2>11. Dispute Resolution</h2>

            <h3>11.1 Between Users</h3>
            <p>
              Disputes between users should first be resolved through direct
              communication. SPACE-App may provide mediation assistance but is not
              obligated to resolve user disputes.
            </p>

            <h3>11.2 With SPACE-App</h3>
            <p>
              Any disputes with SPACE-App will be resolved through binding
              arbitration in accordance with applicable arbitration rules, except
              where prohibited by law.
            </p>

            <h2>12. Modifications to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify users of
              material changes via email or platform notification. Continued use
              of the platform after changes constitutes acceptance of the modified
              Terms.
            </p>

            <h2>13. General Provisions</h2>

            <h3>13.1 Governing Law</h3>
            <p>
              These Terms are governed by the laws of the jurisdiction where
              SPACE-App is incorporated, without regard to conflict of law
              principles.
            </p>

            <h3>13.2 Severability</h3>
            <p>
              If any provision of these Terms is found unenforceable, the
              remaining provisions will continue in effect.
            </p>

            <h3>13.3 Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire
              agreement between you and SPACE-App regarding the platform.
            </p>

            <h2>14. Contact Information</h2>
            <p>For questions about these Terms, please contact us:</p>
            <ul>
              <li>
                Email: <a href="mailto:legal@space-app.com">legal@space-app.com</a>
              </li>
              <li>
                Mail: SPACE-App, Legal Team, [Your Address]
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
