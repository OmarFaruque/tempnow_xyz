export type Product = {
  id: string
  name: string
  description: string
  priceInCents: number
  credits?: number
  type: 'credits' | 'subscription'
  features?: string[]
}

export const PRODUCTS: Product[] = [
  // Credit Packages
  {
    id: '3-credits',
    name: '3 Credits',
    description: 'Try it out',
    priceInCents: 249, // £2.49
    credits: 3,
    type: 'credits'
  },
  {
    id: '10-credits',
    name: '10 Credits',
    description: 'Standard',
    priceInCents: 699, // £6.99
    credits: 10,
    type: 'credits'
  },
  {
    id: '30-credits',
    name: '30 Credits',
    description: 'Most popular',
    priceInCents: 999, // £9.99
    credits: 30,
    type: 'credits'
  },
  
  // Subscription Plans
  {
    id: 'basic-plan',
    name: 'Basic Plan',
    description: 'Perfect for occasional users',
    priceInCents: 1599, // £15.99/month
    credits: 40,
    type: 'subscription',
    features: [
      '40 documents per month',
      'All document templates',
      'PDF export',
      'Email support'
    ]
  },
  {
    id: 'professional-plan',
    name: 'Professional Plan',
    description: 'For regular users',
    priceInCents: 3999, // £39.99/month
    credits: 250,
    type: 'subscription',
    features: [
      '250 documents per month',
      'All document templates',
      'PDF export',
      'Priority email support',
      'Document revision history'
    ]
  },
  {
    id: 'business-plan',
    name: 'Business Plan',
    description: 'Unlimited document generation',
    priceInCents: 7999, // £79.99/month
    credits: 999,
    type: 'subscription',
    features: [
      'Unlimited documents',
      'All document templates',
      'PDF export',
      'Priority support',
      'Document revision history',
      'API access',
      'Team collaboration'
    ]
  }
]
