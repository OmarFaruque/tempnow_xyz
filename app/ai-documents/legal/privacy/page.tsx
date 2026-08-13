import { Header } from '@letterise/components/header'
import { Footer } from '@letterise/components/footer'
import { Card, CardContent } from '@letterise/components/ui/card'

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="border-b bg-muted/50">
          <div className="container py-12">
            <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </section>

        <div className="container py-12 max-w-4xl">
          <Card>
            <CardContent className="p-8 prose max-w-none">
              <section>
                <h2>1. Introduction</h2>
                <p>
                  Letterise ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we 
                  collect, use, disclose, and safeguard your information when you use our Service.
                </p>
                <p>
                  This policy complies with the General Data Protection Regulation (GDPR) and other applicable data protection laws.
                </p>
              </section>

              <section>
                <h2>2. Information We Collect</h2>
                <h3>Personal Information</h3>
                <p>
                  We collect information that you provide directly to us, including:
                </p>
                <ul>
                  <li>Name and email address (for account creation)</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Information you provide in document generation forms</li>
                  <li>Generated documents and related content</li>
                </ul>

                <h3>Automatically Collected Information</h3>
                <ul>
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Usage data and analytics</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section>
                <h2>3. How We Use Your Information</h2>
                <p>
                  We use collected information for the following purposes:
                </p>
                <ul>
                  <li>Providing and maintaining the Service</li>
                  <li>Processing your transactions</li>
                  <li>Generating personalized documents using AI</li>
                  <li>Sending service-related communications</li>
                  <li>Improving and optimizing the Service</li>
                  <li>Detecting and preventing fraud</li>
                  <li>Complying with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2>4. Legal Basis for Processing (GDPR)</h2>
                <p>
                  We process your personal data based on:
                </p>
                <ul>
                  <li><strong>Contract Performance:</strong> To provide the Service you've subscribed to</li>
                  <li><strong>Legitimate Interests:</strong> To improve our Service and prevent fraud</li>
                  <li><strong>Consent:</strong> When you've given explicit permission</li>
                  <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
                </ul>
              </section>

              <section>
                <h2>5. Data Sharing and Disclosure</h2>
                <p>
                  We do NOT sell your personal information. We may share your information with:
                </p>
                <ul>
                  <li><strong>Service Providers:</strong> Including Stripe (payments), Vercel (hosting), and OpenAI/Anthropic (AI processing)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or asset sale</li>
                </ul>
                <p>
                  All third-party service providers are contractually obligated to protect your data.
                </p>
              </section>

              <section>
                <h2>6. Data Retention</h2>
                <p>
                  We retain your information for as long as necessary to:
                </p>
                <ul>
                  <li>Provide the Service to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                </ul>
                <p>
                  You may request deletion of your account and data at any time (subject to legal retention requirements).
                </p>
              </section>

              <section>
                <h2>7. Your Rights (GDPR)</h2>
                <p>
                  Under GDPR, you have the right to:
                </p>
                <ul>
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                  <li><strong>Restriction:</strong> Limit how we use your data</li>
                  <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                  <li><strong>Objection:</strong> Object to certain types of processing</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
                </ul>
                <p>
                  To exercise these rights, contact us at privacy@letterise.com.
                </p>
              </section>

              <section>
                <h2>8. Data Security</h2>
                <p>
                  We implement appropriate technical and organizational measures to protect your data, including:
                </p>
                <ul>
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication and access controls</li>
                  <li>Regular security audits and updates</li>
                  <li>Employee training on data protection</li>
                </ul>
                <p>
                  However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2>9. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries outside your country of residence. 
                  We ensure appropriate safeguards are in place for such transfers in accordance with GDPR requirements.
                </p>
              </section>

              <section>
                <h2>10. Cookies and Tracking</h2>
                <p>
                  We use cookies and similar technologies to:
                </p>
                <ul>
                  <li>Maintain your session and authentication</li>
                  <li>Remember your preferences</li>
                  <li>Analyze usage patterns</li>
                </ul>
                <p>
                  You can control cookies through your browser settings. Disabling cookies may limit functionality.
                </p>
              </section>

              <section>
                <h2>11. Children's Privacy</h2>
                <p>
                  The Service is not intended for users under 18 years of age. We do not knowingly collect data from children. 
                  If we learn we have collected information from a child, we will delete it immediately.
                </p>
              </section>

              <section>
                <h2>12. Changes to Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of significant changes by email or 
                  through the Service. Your continued use after changes constitutes acceptance.
                </p>
              </section>

              <section>
                <h2>13. Contact Information</h2>
                <p>
                  For privacy-related questions or to exercise your rights, contact:
                </p>
                <p>
                  Email: privacy@letterise.com<br />
                  Data Protection Officer: dpo@letterise.com
                </p>
                <p>
                  You also have the right to lodge a complaint with your local data protection authority.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
