'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Copy, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import { Checkbox } from '@/components/ui/checkbox'

interface StripeSettings {
  publishable_key: string
  secret_key: string
  webhook_secret: string
  sandbox: boolean
}

interface AdminSettingsEditorProps {
  initialStripeSettings: StripeSettings | null
  webhookUrl: string
  onSave: (data: FormData) => Promise<any>
}

export function AdminSettingsEditor({ 
  initialStripeSettings, 
  webhookUrl,
  onSave 
}: AdminSettingsEditorProps) {
  const [activeTab, setActiveTab] = useState<'payment' | 'general'>('payment')
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    publishable_key: initialStripeSettings?.publishable_key || '',
    secret_key: initialStripeSettings?.secret_key || '',
    webhook_secret: initialStripeSettings?.webhook_secret || '',
    sandbox: initialStripeSettings?.sandbox || false,
  })

  function handleInputChange(field: keyof typeof formData, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.append('stripeSettings', JSON.stringify(formData))
      await onSave(fd)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    })
  }

  const tabs = [
    { id: 'payment', label: 'Payment Settings' },
    { id: 'general', label: 'General Settings' },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payment Settings Tab */}
      {activeTab === 'payment' && (
        <Card className='bg-neutral-700'>
          <CardHeader>
            <CardTitle>Stripe Configuration</CardTitle>
            <CardDescription>
              Configure your Stripe API credentials and webhook settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Stripe Keys */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="publishable-key">Publishable Key</Label>
                  <Input
                    id="publishable-key"
                    type="text"
                    value={formData.publishable_key}
                    onChange={(e) => handleInputChange('publishable_key', e.target.value)}
                    placeholder="pk_live_..."
                    className="mt-1 font-mono text-sm bg-amber-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Found in your Stripe Dashboard → Developers → API keys
                  </p>
                </div>

                <div>
                  <Label htmlFor="secret-key">Secret Key</Label>
                  <Input
                    id="secret-key"
                    type="password"
                    value={formData.secret_key}
                    onChange={(e) => handleInputChange('secret_key', e.target.value)}
                    placeholder="sk_live_..."
                    className="mt-1 font-mono text-sm bg-amber-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep this secret! Never share or commit to version control
                  </p>
                </div>

                <div>
                  <Label htmlFor="webhook-secret">Webhook Secret</Label>
                  <Input
                    id="webhook-secret"
                    type="password"
                    value={formData.webhook_secret}
                    onChange={(e) => handleInputChange('webhook_secret', e.target.value)}
                    placeholder="whsec_..."
                    className="mt-1 font-mono text-sm bg-amber-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Generate this when creating your webhook endpoint in Stripe
                  </p>
                </div>

                <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-md">
                  <Checkbox 
                    id="sandbox" 
                    checked={formData.sandbox}
                    onCheckedChange={(checked) => handleInputChange('sandbox', !!checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="sandbox"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Sandbox Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Use sandbox configuration for testing payments
                    </p>
                  </div>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h3 className="font-medium text-sm">Stripe Webhook Endpoint</h3>
                <p className="text-xs text-muted-foreground">
                  Add this URL to your Stripe webhook configuration. Go to Stripe Dashboard → Developers → Webhooks → Add endpoint
                </p>
                
                <div className="flex items-center gap-2 bg-background border rounded p-2">
                  <code className="text-xs flex-1 overflow-auto font-mono">{webhookUrl}</code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="ml-1 text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="ml-1 text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 pt-2">
                  <p><strong>Required events to subscribe to:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>checkout.session.completed</li>
                    <li>customer.subscription.created</li>
                    <li>customer.subscription.updated</li>
                    <li>customer.subscription.deleted</li>
                  </ul>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Stripe Settings
              </Button>

              {showSuccess && (
                <div className="bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 p-3 rounded-lg text-sm flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Settings saved successfully!
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              General application settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No general settings configured yet. More features coming soon.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
