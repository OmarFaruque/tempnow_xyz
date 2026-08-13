import { Header } from '@letterise/components/header'
import { Footer } from '@letterise/components/footer'
import { Card, CardContent } from '@letterise/components/ui/card'

export default function RefundPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b bg-muted/50">
          <div className="container py-12">
            <h1 className="text-4xl font-bold mb-2">Refund Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </section>

        <div className="container py-12 max-w-4xl">
          <Card>
            <CardContent className="p-8 prose max-w-none">
              <section>
                <h2>1. Overview</h2>
                <p>
                  At Letterise, we strive to provide high-quality AI-generated documents. This Refund Policy outlines
                  the circumstances under which refunds are issued for credit purchases and subscriptions.
                </p>
              </section>

              <section>
                <h2>2. Credit Purchases (Pay-Per-Use)</h2>
                <h3>Full Refund</h3>
                <p>Credit purchases are eligible for a full refund within 14 days of purchase.</p>
              </section>

              <section>
                <h2>3. Subscription Plans</h2>
                <h3>Monthly Subscriptions</h3>
                <p>Subscriptions operate on a monthly billing cycle. You may cancel at any time, and you will:</p>
                <ul>
                  <li>Retain access until the end of the current billing period</li>
                  <li>Not be charged for the next billing period</li>
                  <li>Keep any unused credits for the remainder of the period</li>
                </ul>

                <h3>Refund Policy for Subscriptions</h3>
                <ul>
                  <li>
                    <strong>First Month:</strong> Full refund available within 14 days
                  </li>
                  <li>
                    <strong>Subsequent Months:</strong> Pro-rated refunds available for technical issues
                  </li>
                  <li>
                    <strong>Cancellation:</strong> No refund for the current billing period, but subscription will not
                    renew
                  </li>
                </ul>
              </section>

              <section>
                <h2>4. Document Quality Issues</h2>
                <p>If you experience issues with document quality:</p>
                <ul>
                  <li>
                    <strong>Technical Errors:</strong> We will refund the credit and regenerate the document at no
                    charge
                  </li>
                  <li>
                    <strong>Content Concerns:</strong> We will offer a free regeneration with adjusted inputs
                  </li>
                  <li>
                    <strong>User Input Errors:</strong> Eligible for refund
                  </li>
                </ul>
                <p className="font-semibold">
                  Important: Letterise does not provide legal advice. Please consult an attorney for legal matters.
                </p>
              </section>

              <section>
                <h2>5. Technical Issues</h2>
                <p>If technical problems prevent you from using the Service:</p>
                <ul>
                  <li>Contact us immediately at support@letterise.com</li>
                  <li>We will work to resolve the issue promptly</li>
                  <li>If unresolved, we will issue credit refunds or account credits</li>
                  <li>Extended service outages qualify for pro-rated refunds</li>
                </ul>
              </section>

              <section>
                <h2>6. How to Request a Refund</h2>
                <p>To request a refund:</p>
                <ol>
                  <li>Email support@letterise.com with your request</li>
                  <li>Include your account email and transaction details</li>
                  <li>Explain the reason for your refund request</li>
                  <li>Provide any relevant documentation or screenshots</li>
                </ol>
                <p>
                  We will respond to refund requests within 3-5 business days. Approved refunds are processed within
                  7-10 business days.
                </p>
              </section>

              <section>
                <h2>7. Refund Methods</h2>
                <p>Refunds are issued to the original payment method used for purchase. This includes:</p>
                <ul>
                  <li>Credit or debit card refund</li>
                  <li>Account credit (at your request)</li>
                </ul>
                <p>
                  Processing times vary by payment provider and may take 5-10 business days to appear on your statement.
                </p>
              </section>

              <section>
                <h2>8. Chargebacks</h2>
                <p>
                  We encourage you to contact us directly before initiating a chargeback. We will work with you to
                  resolve disputes fairly and promptly.
                </p>
              </section>

              <section>
                <h2>9. Promotional Credits and Free Trials</h2>
                <p>Promotional credits and free trials:</p>
                <ul>
                  <li>Have no cash value</li>
                  <li>Cannot be refunded</li>
                  <li>May expire according to promotional terms</li>
                </ul>
              </section>

              <section>
                <h2>10. Changes to Refund Policy</h2>
                <p>
                  We reserve the right to modify this Refund Policy at any time. Changes will be posted on this page
                  with an updated date. Your continued use of the Service after changes constitutes acceptance of the
                  modified policy.
                </p>
              </section>

              <section>
                <h2>11. Contact Information</h2>
                <p>For refund requests or questions about this policy:</p>
                <p>
                  Email: support@letterise.com
                  <br />
                  Response time: 3-5 business days
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
