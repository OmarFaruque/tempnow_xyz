import { Header } from '@letterise/components/header'
import { Footer } from '@letterise/components/footer'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@letterise/components/ui/card'
import { Badge } from '@letterise/components/ui/badge'
import { Check, Zap } from 'lucide-react'
import { CheckoutButton } from '@letterise/components/checkout-button'
import { getActivePlans } from '@letterise/lib/plans'
import { getSettings } from '@letterise/lib/admin-settings'
import { getCurrentUser } from '@letterise/lib/auth'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const user = await getCurrentUser()
  const isLoggedIn = !!user
  
  const stripeSettings = await getSettings('stripe')
  const publishableKey = stripeSettings?.publishable_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  const dbPlans = await getActivePlans()

  const subscriptionPlans = dbPlans.filter((p: any) => p.plan_type !== 'credits').map((plan: any) => ({
    id: `plan-${plan.id}`,
    name: plan.name,
    description: plan.description,
    priceInCents: plan.price_cents,
    type: 'subscription',
    features: [
      `${plan.monthly_document_limit ?? plan.credits_per_month ?? 0} documents per month`,
      ...(plan.features || []),
    ]
  }))

  const creditPackages = dbPlans.filter((p: any) => p.plan_type === 'credits').map((plan: any) => ({
    id: `credit-${plan.id}`,
    name: plan.name,
    description: plan.description,
    priceInCents: Number(plan.package_price_cents || plan.price_cents),
    credits: Number(plan.credit_amount || 0),
    creditsPerDocument: Number(plan.price_per_document_cents || 0),
  }))

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="border-b bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight">Simple, Transparent Pricing</h1>
              <p className="text-base sm:text-lg text-muted-foreground text-balance px-2">
                Choose between pay-per-use credits or monthly subscriptions. No hidden fees.
              </p>
            </div>
          </div>
        </section>

        {/* Credit Packages */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <Badge variant="secondary" className="mb-3">
              <Zap className="h-3 w-3 mr-1" />
              Pay Per Use
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Credit Packages</h2>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              Buy credits as needed. Credits never expire.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {creditPackages.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl">{product.name}</CardTitle>
                  <CardDescription className="text-sm">{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-3xl sm:text-4xl font-bold mb-4">
                    £{(product.priceInCents / 100).toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(product.creditsPerDocument || 1).toFixed(1).replace(/\.0$/, '')} credit{product.creditsPerDocument === 1 ? '' : 's'} per document
                  </p>
                </CardContent>
                <CardFooter>
                  <CheckoutButton 
                    productId={product.id} 
                    label="Buy Credits" 
                    publishableKey={publishableKey} 
                    isLoggedIn={isLoggedIn}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Subscription Plans */}
        <section className="bg-muted/50 py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-12">
              <Badge variant="default" className="mb-3">
                Best Value
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Monthly Subscriptions</h2>
              <p className="text-sm sm:text-base text-muted-foreground px-4">
                Save money with monthly plans. Cancel anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
              {subscriptionPlans.map((product, index) => {
                const originalPrices = [1499, 2799, 6999] // £14.99, £27.99, £69.99
                const originalPrice = originalPrices[index]
                
                return (
                  <Card key={product.id} className={`flex flex-col relative ${index === 1 ? 'border-primary shadow-lg md:scale-105' : ''}`}>
                    {index === 1 && (
                      <Badge className="absolute -top-2 right-4">
                        Popular
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl sm:text-2xl">{product.name}</CardTitle>
                      <CardDescription className="text-sm">{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {originalPrice && (
                        <div className="text-lg text-muted-foreground line-through mb-1">
                          £{(originalPrice / 100).toFixed(2)}
                        </div>
                      )}
                      <div className="flex items-baseline gap-2 mb-1">
                        <div className="text-3xl sm:text-4xl font-bold text-primary">
                          £{(product.priceInCents / 100).toFixed(2)}
                        </div>
                        {originalPrice && (
                          <Badge variant="destructive" className="text-xs">
                            Save {Math.round(((originalPrice - product.priceInCents) / originalPrice) * 100)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-6">per month</p>
                    
                      {product.features && (
                        <ul className="space-y-3">
                          {product.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                    <CardFooter>
                      <CheckoutButton 
                        productId={product.id} 
                        label="Subscribe" 
                        variant={index === 1 ? 'default' : 'outline'}
                        publishableKey={publishableKey}
                        isLoggedIn={isLoggedIn}
                      />
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What's the difference between credits and subscriptions?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Credits are pay-per-use and never expire. Subscriptions give you a monthly allocation of credits at a discounted rate. 
                    Choose credits if you need documents occasionally, or subscribe if you generate documents regularly.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I cancel my subscription anytime?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period, 
                    and any unused credits will remain available.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Do unused credits carry over?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Purchased credits never expire. For subscriptions, unused monthly credits do not roll over to the next month.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Is this legal advice?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No. Letterise generates template-based documents and does not provide legal advice. 
                    For legal matters, please consult with a licensed attorney.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
