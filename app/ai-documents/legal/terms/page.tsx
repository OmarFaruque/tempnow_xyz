import { Header } from '@letterise/components/header'
import { Footer } from '@letterise/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@letterise/components/ui/card'

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="border-b bg-muted/50">
          <div className="container py-12">
            <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </section>

        <div className="container py-12 max-w-4xl">
          <Card>
            <CardContent className="p-8 prose max-w-none">
              <section>
                <h2>1. Acceptance of Terms</h2>
                <p>
                  By accessing and using Letterise (Letterise Ltd), you accept and agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use the Service.
                </p>
              </section>

              <section>
                <h2>2. Description of Service</h2>
                <p>
                  Letterise is an AI-powered document generation platform that creates template-based letters and documents. 
                  The Service uses artificial intelligence to generate customized documents based on user-provided information.
                </p>
                <p className="font-semibold">
                  IMPORTANT: Letterise does NOT provide legal advice. The documents generated are for informational purposes only 
                  and do not constitute legal counsel. For legal matters, consult a licensed attorney.
                </p>
              </section>

              <section>
                <h2>3. User Accounts</h2>
                <p>
                  To use certain features of the Service, you must create an account. You are responsible for:
                </p>
                <ul>
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
                <p>
                  You must be at least 18 years old to create an account and use the Service.
                </p>
              </section>

              <section>
                <h2>4. Credits and Subscriptions</h2>
                <p>
                  The Service operates on a credit-based system. You may:
                </p>
                <ul>
                  <li>Purchase credits for one-time use (credits never expire)</li>
                  <li>Subscribe to a monthly plan with recurring credit allocations</li>
                </ul>
                <p>
                  All purchases are subject to our Refund Policy. Subscription credits do not roll over to the next billing period. 
                  Purchased one-time credits never expire.
                </p>
              </section>

              <section>
                <h2>5. Acceptable Use</h2>
                <p>
                  You agree NOT to use the Service to:
                </p>
                <ul>
                  <li>Generate fraudulent, illegal, or misleading documents</li>
                  <li>Harass, threaten, or harm any person or entity</li>
                  <li>Violate any laws, regulations, or third-party rights</li>
                  <li>Impersonate any person or entity</li>
                  <li>Distribute malware or engage in hacking</li>
                  <li>Attempt to circumvent payment or credit systems</li>
                  <li>Resell or redistribute generated documents commercially without permission</li>
                </ul>
                <p>
                  We reserve the right to suspend or terminate accounts that violate these terms.
                </p>
              </section>

              <section>
                <h2>6. Intellectual Property</h2>
                <p>
                  The Service, including all content, features, and functionality, is owned by Letterise and protected by 
                  copyright, trademark, and other intellectual property laws.
                </p>
                <p>
                  You retain ownership of the content you provide. Generated documents are provided to you for your personal use. 
                  You are responsible for ensuring the accuracy and legality of information you provide and how you use generated documents.
                </p>
              </section>

              <section>
                <h2>7. Disclaimers and Limitation of Liability</h2>
                <p className="font-semibold">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                </p>
                <p>
                  We do not warrant that:
                </p>
                <ul>
                  <li>The Service will be uninterrupted or error-free</li>
                  <li>Generated documents will meet your specific needs</li>
                  <li>Generated documents are legally valid or enforceable</li>
                  <li>The Service will be available at all times</li>
                </ul>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
                </p>
              </section>

              <section>
                <h2>8. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless Letterise and its affiliates from any claims, damages, or expenses 
                  arising from your use of the Service or violation of these Terms.
                </p>
              </section>

              <section>
                <h2>9. Privacy and Data Protection</h2>
                <p>
                  Your use of the Service is also governed by our Privacy Policy. We are committed to protecting your personal 
                  information in accordance with GDPR and applicable data protection laws.
                </p>
              </section>

              <section>
                <h2>10. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. 
                  Your continued use of the Service after changes constitutes acceptance of the modified Terms.
                </p>
              </section>

              <section>
                <h2>11. Termination</h2>
                <p>
                  We may terminate or suspend your account immediately, without prior notice, for any violation of these Terms. 
                  Upon termination, your right to use the Service will cease immediately.
                </p>
              </section>

              <section>
                <h2>12. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the United States, 
                  without regard to conflict of law provisions.
                </p>
              </section>

              <section>
                <h2>13. Contact Information</h2>
                <p>
                  For questions about these Terms, please contact us at legal@letterise.com.
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
