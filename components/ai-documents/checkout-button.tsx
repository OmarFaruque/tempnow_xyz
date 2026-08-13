'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { startCheckoutSession } from '@/app/actions/stripe'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type CheckoutButtonProps = {
  productId: string
  label?: string
  variant?: 'default' | 'outline' | 'ghost'
  publishableKey?: string
  isLoggedIn?: boolean
}

export function CheckoutButton({ 
  productId, 
  label = 'Purchase', 
  variant = 'default',
  isLoggedIn = false
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/pricing`)
      return
    }

    try {
      setIsLoading(true)
      const result = await startCheckoutSession(productId)
      
      if (result?.url) {
        window.location.href = result.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      
      // If the error is about unauthorized access, redirect to login
      if (error.message === 'Unauthorized') {
        router.push('/login?redirect=/pricing')
      } else {
        alert('Failed to start checkout. Please try again or contact support.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      className="w-full cursor-pointer" 
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {label}
    </Button>
  )
}
