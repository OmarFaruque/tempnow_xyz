"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Badge } from "@/shared/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Checkbox } from "@/shared/ui/checkbox"
import { Textarea } from "@/shared/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import {
    CreditCard,
    Database,
    Eye,
    EyeOff,
    TestTube,
    CheckCircle,
    AlertTriangle,
    Info,
    Construction,
    ChevronDown,
    ChevronUp,
    Activity,
    RefreshCw,
} from "lucide-react"
import { getConfiguredGatewayOrder, PAYMENT_GATEWAYS, type PaymentGatewayId } from "@/core/payment-gateways"

interface GatewayQuotaFieldProps {
    gateway: PaymentGatewayId
    label: string
    settings: any
    stats: any
    updateSetting: (category: string, key: string, value: any) => void
}

function GatewayQuotaField({ gateway, label, settings, stats, updateSetting }: GatewayQuotaFieldProps) {
    const providerSettings = settings?.[gateway] || {}
    const quota = Number(providerSettings.paymentQuota ?? 0)
    const used = Number(stats?.used ?? 0)
    const round = Number(stats?.round ?? 0)
    const quotaExhausted = quota > 0 && used >= quota

    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3 items-end">
                <div>
                    <Label htmlFor={`${gateway}-payment-quota`}>{label} payment quota</Label>
                    <Input
                        id={`${gateway}-payment-quota`}
                        type="number"
                        min={0}
                        step={1}
                        value={providerSettings.paymentQuota ?? 0}
                        onChange={(event) => updateSetting(gateway, "paymentQuota", Number(event.target.value || 0))}
                    />
                </div>
                <div className="text-sm text-slate-600 pb-2 space-y-1">
                    <div>{quota > 0 ? `${used} of ${quota} used` : `${used} used · unlimited`}</div>
                    {quota > 0 && (
                        <div className="text-xs text-gray-500">
                            Round {round + 1}{quotaExhausted ? " complete · next payment starts a new round" : ""}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-gray-500">0 means unlimited. Successful payments count until the quota is used up; active reservations also hold a slot temporarily. When the last provider in the routing order completes its quota, the next payment starts a new round at the first provider again.</p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateSetting(gateway, "quotaResetAt", new Date().toISOString())}
                >
                    Reset usage on save
                </Button>
            </div>
        </div>
    )
}

interface PaymentSettingsTabProps {
    settings: any
    updateSetting: (category: string, key: string, value: any) => void
    showKeys: Record<string, boolean>
    toggleKeyVisibility: (key: string) => void
    testConnection: (service: string) => void
    testing: Record<string, boolean>
    testResults: Record<string, any>
    maskApiKey: (key: string) => string
}

export function PaymentSettingsTab({
    settings,
    updateSetting,
    showKeys,
    toggleKeyVisibility,
    testConnection,
    testing,
    testResults,
    maskApiKey,
}: PaymentSettingsTabProps) {
    const [gatewayStats, setGatewayStats] = useState<Record<string, any>>({})
    const [statsLoading, setStatsLoading] = useState(false)
    const gatewayOrder = getConfiguredGatewayOrder(settings?.payment)
    const updateSquarePaymentMethod = (method: string, enabled: boolean) => {
        updateSetting("square", "paymentMethods", {
            ...settings.square?.paymentMethods,
            [method]: enabled,
        })
    }

    const updateGatewayOrder = (nextOrder: PaymentGatewayId[]) => {
        updateSetting("payment", "gatewayOrder", nextOrder)
        updateSetting("payment", "activeProcessor", nextOrder[0] || "none")
    }

    const toggleGateway = (gateway: PaymentGatewayId, enabled: boolean) => {
        const nextOrder = enabled
            ? [...gatewayOrder, gateway]
            : gatewayOrder.filter((item) => item !== gateway)
        updateGatewayOrder(nextOrder)
    }

    const moveGateway = (gateway: PaymentGatewayId, direction: -1 | 1) => {
        const index = gatewayOrder.indexOf(gateway)
        const target = index + direction
        if (index < 0 || target < 0 || target >= gatewayOrder.length) return
        const nextOrder = [...gatewayOrder]
            ;[nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]]
        updateGatewayOrder(nextOrder)
    }

    const refreshGatewayStats = async () => {
        setStatsLoading(true)
        try {
            const response = await fetch("/api/payment-routing?stats=1", { cache: "no-store" })
            const result = await response.json()
            if (response.ok && result.success) {
                setGatewayStats(Object.fromEntries((result.gateways || []).map((row: any) => [row.gateway, row])))
            }
        } catch (error) {
            console.error("Failed to load payment gateway stats:", error)
        } finally {
            setStatsLoading(false)
        }
    }

    useEffect(() => {
        void refreshGatewayStats()
    }, [])

    const isGatewayActive = (gateway: PaymentGatewayId) => gatewayOrder.includes(gateway)


    return (
        <div className="space-y-6">
            {/* Payment Processor Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        Payment Processor Rotation
                    </CardTitle>
                    <CardDescription>
                        Select one or more gateways, then order them by preference. Checkout uses the first healthy provider until its quota is used up, then moves to the next provider. After the last provider in the order completes its quota, the next payment automatically starts a new round at the first provider again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <section className="space-y-3">
                        <div>
                            <Label>Active payment processors</Label>
                            <p className="text-xs text-gray-500 mt-1">Select every provider that may receive payments. Disabled providers are skipped without changing the order of the rest. Doc Forge hosted checkout currently skips Airwallex and Authorize.Net.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {PAYMENT_GATEWAYS.map((gateway) => {
                                const checked = isGatewayActive(gateway.id)
                                return (
                                    <label key={gateway.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${checked ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(value) => toggleGateway(gateway.id, value === true)}
                                            aria-label={`Enable ${gateway.label}`}
                                        />
                                        <span className="font-medium text-sm text-gray-800">{gateway.label}</span>
                                        {checked && <Badge className="ml-auto bg-green-100 text-green-800">#{gatewayOrder.indexOf(gateway.id) + 1}</Badge>}
                                    </label>
                                )
                            })}
                        </div>

                        {gatewayOrder.length > 0 ? (
                            <div className="rounded-lg border border-gray-200 divide-y">
                                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Routing order · used in turn, top to bottom, then a new round starts at number 1</div>
                                {gatewayOrder.map((gatewayId, index) => {
                                    const gateway = PAYMENT_GATEWAYS.find((item) => item.id === gatewayId)
                                    if (!gateway) return null
                                    return (
                                        <div key={gatewayId} className="flex items-center gap-3 px-3 py-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">{index + 1}</span>
                                            <span className="flex-1 text-sm font-medium">{gateway.label}</span>
                                            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => moveGateway(gatewayId, -1)} disabled={index === 0} aria-label={`Move ${gateway.label} up`}>
                                                <ChevronUp className="h-4 w-4" />
                                            </Button>
                                            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => moveGateway(gatewayId, 1)} disabled={index === gatewayOrder.length - 1} aria-label={`Move ${gateway.label} down`}>
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <Alert className="bg-orange-50 border-orange-200">
                                <Construction className="h-4 w-4 text-orange-600" />
                                <AlertTitle className="text-orange-800">Online card payments are disabled</AlertTitle>
                                <AlertDescription className="text-orange-700 text-sm">Select at least one processor to accept online card payments. Bank transfer, if enabled, remains available separately.</AlertDescription>
                            </Alert>
                        )}
                    </section>

                    <section className="border-t pt-5 space-y-4">
                        <div>
                            <Label>Retry and gateway health policy</Label>
                            <p className="text-xs text-gray-500 mt-1">A retry always excludes gateways already attempted for that checkout. Card details are re-entered on the next provider.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="payment-max-retries">Maximum retries</Label>
                                <Input id="payment-max-retries" type="number" min={1} max={3} step={1} value={settings.payment.maxRetries ?? 2} onChange={(e) => updateSetting("payment", "maxRetries", Number(e.target.value || 2))} />
                                <p className="mt-1 text-xs text-gray-500">After the first attempt; choose 1–3.</p>
                            </div>
                            <div>
                                <Label htmlFor="payment-user-cooldown">Customer / gateway cooldown (minutes)</Label>
                                <Input id="payment-user-cooldown" type="number" min={0} max={1440} step={1} value={settings.payment.userCooldownMinutes ?? 30} onChange={(e) => updateSetting("payment", "userCooldownMinutes", Number(e.target.value || 0))} />
                                <p className="mt-1 text-xs text-gray-500">Do not retry a gateway that recently declined this customer.</p>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg border p-3">
                                <Checkbox id="payment-auto-pause" checked={settings.payment.autoPauseEnabled !== false} onCheckedChange={(value) => updateSetting("payment", "autoPauseEnabled", value === true)} />
                                <div>
                                    <Label htmlFor="payment-auto-pause">Automatically pause unhealthy gateways</Label>
                                    <p className="text-xs text-gray-500 mt-1">Traffic shifts to the next eligible provider while paused.</p>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="payment-failure-threshold">Failure-rate threshold (%)</Label>
                                <Input id="payment-failure-threshold" type="number" min={1} max={100} step={1} value={settings.payment.autoPauseFailureRate ?? 50} onChange={(e) => updateSetting("payment", "autoPauseFailureRate", Number(e.target.value || 50))} />
                            </div>
                            <div>
                                <Label htmlFor="payment-failure-sample">Minimum recent attempts</Label>
                                <Input id="payment-failure-sample" type="number" min={1} max={1000} step={1} value={settings.payment.autoPauseMinAttempts ?? 10} onChange={(e) => updateSetting("payment", "autoPauseMinAttempts", Number(e.target.value || 10))} />
                            </div>
                            <div>
                                <Label htmlFor="payment-health-window">Failure-rate observation window (minutes)</Label>
                                <Input id="payment-health-window" type="number" min={1} max={1440} step={1} value={settings.payment.autoPauseWindowMinutes ?? 15} onChange={(e) => updateSetting("payment", "autoPauseWindowMinutes", Number(e.target.value || 15))} />
                            </div>
                            <div>
                                <Label htmlFor="payment-pause-duration">Automatic pause duration (minutes)</Label>
                                <Input id="payment-pause-duration" type="number" min={1} max={1440} step={1} value={settings.payment.autoPauseDurationMinutes ?? 15} onChange={(e) => updateSetting("payment", "autoPauseDurationMinutes", Number(e.target.value || 15))} />
                            </div>
                        </div>
                    </section>

                    <section className="border-t pt-5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <Label className="flex items-center gap-2"><Activity className="h-4 w-4" /> Gateway health and volume</Label>
                                <p className="text-xs text-gray-500 mt-1">Successful payments, recent failure rates and quota consumption. Reservations expire after 30 minutes if checkout is abandoned.</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => void refreshGatewayStats()} disabled={statsLoading}>
                                <RefreshCw className={`mr-2 h-4 w-4 ${statsLoading ? "animate-spin" : ""}`} /> Refresh
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {PAYMENT_GATEWAYS.map(({ id, label }) => {
                                const stats = gatewayStats[id]
                                const quota = Number(settings[id]?.paymentQuota ?? 0)
                                const round = Number(stats?.round ?? 0)
                                const used = Number(stats?.used ?? 0)
                                return (
                                    <div key={id} className="flex items-center gap-3 rounded-lg border p-3">
                                        <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
                                        {stats?.autoPaused && <Badge className="bg-amber-100 text-amber-800">Auto-paused</Badge>}
                                        {stats?.quotaExhausted && <Badge className="bg-slate-200 text-slate-700">Round {round + 1} complete</Badge>}
                                        <span className="text-xs text-gray-600">{stats?.succeeded ?? 0} ok · {stats?.failed ?? 0} failed</span>
                                        <span className="text-xs font-medium text-gray-800">{quota > 0 ? `${used}/${quota}` : `${used}/∞`}</span>
                                        <span className={`text-xs ${Number(stats?.failureRate ?? 0) >= Number(settings.payment.autoPauseFailureRate ?? 50) ? "text-red-600" : "text-gray-500"}`}>{stats?.failureRate ?? 0}% recent</span>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    {gatewayOrder.length === 0 && (
                        <div className="space-y-3 border-t pt-5">
                            <div>
                                <Label htmlFor="payment-disabled-message" className="text-sm font-medium">Payment Disabled Message (HTML allowed)</Label>
                                <p className="text-xs text-gray-500 mb-2">This message appears on checkout while no online processor is selected.</p>
                                <Textarea
                                    id="payment-disabled-message"
                                    rows={5}
                                    className="font-mono text-sm"
                                    placeholder='We are currently performing system updates. Payments will be reactivated shortly.'
                                    value={settings.payment.paymentDisabledMessage || ""}
                                    onChange={(e) => updateSetting("payment", "paymentDisabledMessage", e.target.value)}
                                />
                                {settings.payment.paymentDisabledMessage && (
                                    <div className="mt-3">
                                        <Label className="text-xs text-gray-500">Preview:</Label>
                                        <div className="mt-1 p-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-700">
                                            <div dangerouslySetInnerHTML={{ __html: settings.payment.paymentDisabledMessage }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Paddle Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        Paddle Payment Settings
                        {isGatewayActive("paddle") && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Configure your Paddle payment processor integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GatewayQuotaField gateway="paddle" label="Paddle" settings={settings} stats={gatewayStats.paddle} updateSetting={updateSetting} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="paddle-vendor-id">Vendor ID</Label>
                            <Input
                                id="paddle-vendor-id"
                                placeholder="Enter your Paddle Vendor ID"
                                value={settings.paddle.vendorId}
                                onChange={(e) => updateSetting("paddle", "vendorId", e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="paddle-environment">Environment</Label>
                            <Select
                                value={settings.paddle.environment}
                                onValueChange={(value) => updateSetting("paddle", "environment", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sandbox">
                                        Sandbox
                                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                                    </SelectItem>
                                    <SelectItem value="production">
                                        Production
                                        <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="paddle-api-key">API Key</Label>
                        <div className="flex gap-2">
                            <Input
                                id="paddle-api-key"
                                type={showKeys.paddle ? "text" : "password"}
                                placeholder="Enter your Paddle API Key"
                                value={showKeys.paddle ? settings.paddle.apiKey : maskApiKey(settings.paddle.apiKey)}
                                onChange={(e) => updateSetting("paddle", "apiKey", e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("paddle")}>
                                {showKeys.paddle ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="paddle-client-token">Client Token</Label>
                        <div className="flex gap-2">
                            <Input
                                id="paddle-client-token"
                                type={showKeys.paddle ? "text" : "password"}
                                placeholder="Enter your Paddle Client Token"
                                value={showKeys.paddle ? settings.paddle.clientToken : maskApiKey(settings.paddle.clientToken)}
                                onChange={(e) => updateSetting("paddle", "clientToken", e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("paddle")}>
                                {showKeys.paddle ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="paddle-discord-refund-webhook">Refund Discord Webhook URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="paddle-discord-refund-webhook"
                                type={showKeys.paddle ? "text" : "password"}
                                placeholder="https://discord.com/api/webhooks/..."
                                value={showKeys.paddle ? settings.paddle.discordRefundWebhookUrl : maskApiKey(settings.paddle.discordRefundWebhookUrl)}
                                onChange={(e) => updateSetting("paddle", "discordRefundWebhookUrl", e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("paddle")}>
                                {showKeys.paddle ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <small className="text-xs text-gray-500">Instant refund/chargeback alerts are sent to this Discord webhook.</small>
                    </div>

                    <Button
                        onClick={() => testConnection("paddle")}
                        disabled={testing.paddle || !settings.paddle.apiKey}
                        variant="outline"
                        className="w-full"
                    >
                        {testing.paddle ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <TestTube className="h-4 w-4 mr-2" />
                                Test Paddle Connection
                            </>
                        )}
                    </Button>

                    {testResults.paddle && (
                        <div
                            className={`p-3 rounded-lg border ${testResults.paddle.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                        >
                            <div className="flex items-center space-x-2">
                                {testResults.paddle.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                )}
                                <span
                                    className={`text-sm font-medium ${testResults.paddle.success ? "text-green-800" : "text-red-800"}`}
                                >
                                    {testResults.paddle.message}
                                </span>
                                <span className="text-xs text-gray-500">({testResults.paddle.timestamp})</span>
                            </div>
                        </div>
                    )}

                    <div className="text-xs text-gray-500">
                        Use this Paddle webhook URL in your Paddle dashboard: <i>{process.env.NEXT_PUBLIC_BASE_URL}/api/paddle/hook</i>
                    </div>
                </CardContent>
            </Card>

            {/* Stripe Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        Stripe Payment Settings
                        {isGatewayActive("stripe") && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Configure your Stripe payment processor integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GatewayQuotaField gateway="stripe" label="Stripe" settings={settings} stats={gatewayStats.stripe} updateSetting={updateSetting} />
                    <div>
                        <Label htmlFor="stripe-environment">Environment</Label>
                        <Select
                            value={settings.stripe.environment}
                            onValueChange={(value) => updateSetting("stripe", "environment", value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="test">
                                    Test Mode
                                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                                </SelectItem>
                                <SelectItem value="production">
                                    Live Mode
                                    <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <br />
                    </div>
                    <div className="mt-2"><small className="text-xs text-gray-500"><i>Webhook URL: {process.env.NEXT_PUBLIC_BASE_URL}/api/stripe-webhook</i></small>, &nbsp;<small className="text-xs text-gray-500">Event: <i>payment_intent.succeeded</i></small></div>

                    <Button
                        onClick={() => testConnection("stripe")}
                        disabled={testing.stripe || !process.env.STRIPE_SECRET_KEY}
                        variant="outline"
                        className="w-full"
                    >
                        {testing.stripe ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <TestTube className="h-4 w-4 mr-2" />
                                Test Stripe Connection
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Lemon Squeezy Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-yellow-500" />
                        Lemon Squeezy Payment Settings
                        {isGatewayActive("lemonsqueezy") && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Configure your Lemon Squeezy payment processor integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GatewayQuotaField gateway="lemonsqueezy" label="Lemon Squeezy" settings={settings} stats={gatewayStats.lemonsqueezy} updateSetting={updateSetting} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="lemonsqueezy-store-id">Store ID</Label>
                            <Input
                                id="lemonsqueezy-store-id"
                                placeholder="Enter your Lemon Squeezy Store ID"
                                value={settings?.lemonsqueezy?.storeId}
                                onChange={(e) => updateSetting("lemonsqueezy", "storeId", e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="lemonsqueezy-variant-id">Variant ID</Label>
                            <Input
                                id="lemonsqueezy-variant-id"
                                placeholder="Enter your Lemon Squeezy Variant ID"
                                value={settings?.lemonsqueezy?.variantId}
                                onChange={(e) => updateSetting("lemonsqueezy", "variantId", e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="lemonsqueezy-api-key">API Key</Label>
                        <div className="flex gap-2">
                            <Input
                                id="lemonsqueezy-api-key"
                                type={showKeys.lemonsqueezy ? "text" : "password"}
                                placeholder="Enter your Lemon Squeezy API Key"
                                value={showKeys.lemonsqueezy ? settings?.lemonsqueezy?.apiKey : maskApiKey(settings?.lemonsqueezy?.apiKey)}
                                onChange={(e) => updateSetting("lemonsqueezy", "apiKey", e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("lemonsqueezy")}>
                                {showKeys.lemonsqueezy ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="lemonsqueezy-webhook-secret">Webhook Secret</Label>
                        <div className="flex gap-2">
                            <Input
                                id="lemonsqueezy-webhook-secret"
                                type={showKeys.lemonsqueezy_webhook ? "text" : "password"}
                                placeholder="webhook secret..."
                                value={showKeys.lemonsqueezy_webhook ? settings?.lemonsqueezy?.webhookSecret : maskApiKey(settings?.lemonsqueezy?.webhookSecret)}
                                onChange={(e) => updateSetting("lemonsqueezy", "webhookSecret", e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("lemonsqueezy_webhook")}>
                                {showKeys.lemonsqueezy_webhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <small> This is used to verify webhook events from Lemon Squeezy. <i>Webhook URL: {process.env.NEXT_PUBLIC_BASE_URL}/api/lemon-hook</i></small>
                    </div>

                    <Button
                        onClick={() => testConnection("lemonsqueezy")}
                        disabled={testing.lemonsqueezy || !settings?.lemonsqueezy?.apiKey}
                        variant="outline"
                        className="w-full"
                    >
                        {testing.lemonsqueezy ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <TestTube className="h-4 w-4 mr-2" />
                                Test Lemon Squeezy Connection
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Airwallex Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        Airwallex Payment Settings
                        {isGatewayActive("airwallex") && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                    </CardTitle>
                    <CardDescription>Configure your Airwallex payment processor integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GatewayQuotaField gateway="airwallex" label="Airwallex" settings={settings} stats={gatewayStats.airwallex} updateSetting={updateSetting} />
                    <div>
                        <Label htmlFor="airwallex-environment">Environment</Label>
                        <Select
                            value={settings?.airwallex?.environment}
                            onValueChange={(value) => updateSetting("airwallex", "environment", value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="test">
                                    Test Mode
                                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                                </SelectItem>
                                <SelectItem value="production">
                                    Live Mode
                                    <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="airwallex-publishable-key">Airwallex Client ID</Label>
                        <div className="flex gap-2">
                            <Input
                                id="airwallex-publishable-key"
                                type={showKeys.airwallex ? "text" : "password"}
                                placeholder="client id..."
                                value={
                                    showKeys.airwallex ? settings?.airwallex?.client_id : maskApiKey(settings?.airwallex?.client_id)
                                }
                                onChange={(e) => updateSetting("airwallex", "client_id", e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("airwallex")}>
                                {showKeys.airwallex ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="airwallex-secret-key">API Key</Label>
                        <Input
                            id="airwallex-secret-key"
                            type="password"
                            placeholder="apikey..."
                            value={settings?.airwallex?.apikey}
                            onChange={(e) => updateSetting("airwallex", "apikey", e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="airwallex-webhook-secret">Webhook Secret</Label>
                        <Input
                            id="airwallex-webhook-secret"
                            type="password"
                            placeholder="webhook secret..."
                            value={settings?.airwallex?.webhookSecret}
                            onChange={(e) => updateSetting("airwallex", "webhookSecret", e.target.value)}
                        />
                        <small> This is used to verify webhook events from Airwallex. <i>Webhook URL: {process.env.NEXT_PUBLIC_BASE_URL}/api/airwallex-hook</i></small>
                    </div>

                    <Button
                        onClick={() => testConnection("airwallex")}
                        disabled={testing.airwallex || !settings?.airwallex?.apikey}
                        variant="outline"
                        className="w-full"
                    >
                        {testing.airwallex ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <TestTube className="h-4 w-4 mr-2" />
                                Test Airwallex Connection
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Square Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-gray-800" />
                        Square Payment Settings
                        {isGatewayActive("square") && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Configure your Square payment processor integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GatewayQuotaField gateway="square" label="Square" settings={settings} stats={gatewayStats.square} updateSetting={updateSetting} />
                    <div>
                        <Label htmlFor="square-environment">Environment</Label>
                        <Select
                            value={settings.square.environment}
                            onValueChange={(value) => updateSetting("square", "environment", value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sandbox">
                                    Sandbox
                                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                                </SelectItem>
                                <SelectItem value="production">
                                    Production
                                    <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="square-app-id">App ID</Label>
                            <Input
                                id="square-app-id"
                                placeholder="Enter your Square App ID"
                                value={settings.square.appId}
                                onChange={(e) => updateSetting("square", "appId", e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="square-location-id">App Location ID</Label>
                            <Input
                                id="square-location-id"
                                placeholder="Enter your Square Location ID"
                                value={settings.square.appLocationId}
                                onChange={(e) => updateSetting("square", "appLocationId", e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="square-access-token">App Access Token</Label>
                        <Input
                            id="square-access-token"
                            type={showKeys.square ? "text" : "password"}
                            placeholder="Enter your Square Access Token"
                            value={showKeys.square ? settings.square.accessToken : maskApiKey(settings.square.accessToken)}
                            onChange={(e) => updateSetting("square", "accessToken", e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Square Payment Methods</Label>
                        <div className="mt-2 space-y-2 rounded-md border p-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="square-card" checked={settings.square?.paymentMethods?.card ?? true} onCheckedChange={(checked) => updateSquarePaymentMethod('card', !!checked)} />
                                <Label htmlFor="square-card">Card Payment</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="square-google" checked={settings.square?.paymentMethods?.googlePay ?? false} onCheckedChange={(checked) => updateSquarePaymentMethod('googlePay', !!checked)} />
                                <Label htmlFor="square-google">Google Pay</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="square-apple" checked={settings.square?.paymentMethods?.applePay ?? false} onCheckedChange={(checked) => updateSquarePaymentMethod('applePay', !!checked)} />
                                <Label htmlFor="square-apple">Apple Pay</Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mollie Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-orange-600" />
                        Mollie Payment Settings
                        {isGatewayActive("mollie") && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Configure your Mollie payment processor integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GatewayQuotaField gateway="mollie" label="Mollie" settings={settings} stats={gatewayStats.mollie} updateSetting={updateSetting} />
                    <div>
                        <Label htmlFor="mollie-environment">Environment</Label>
                        <Select
                            value={settings.mollie.environment}
                            onValueChange={(value) => updateSetting("mollie", "environment", value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="test">
                                    Test Mode
                                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                                </SelectItem>
                                <SelectItem value="production">
                                    Live Mode
                                    <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="mollie-api-key">API Key</Label>
                        <div className="flex gap-2">
                            <Input
                                id="mollie-api-key"
                                type={showKeys.mollie ? "text" : "password"}
                                placeholder="test_... or live_..."
                                value={showKeys.mollie ? settings.mollie.apiKey : maskApiKey(settings.mollie.apiKey)}
                                onChange={(e) => updateSetting("mollie", "apiKey", e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("mollie")}>
                                {showKeys.mollie ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <Button
                        onClick={() => testConnection("mollie")}
                        disabled={testing.mollie || !settings.mollie.apiKey}
                        variant="outline"
                        className="w-full"
                    >
                        {testing.mollie ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <TestTube className="h-4 w-4 mr-2" />
                                Test Mollie Connection
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* PayPal Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-700" />
                        PayPal Payment Settings
                        {isGatewayActive("paypal") && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Configure separate sandbox and live PayPal credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GatewayQuotaField gateway="paypal" label="PayPal" settings={settings} stats={gatewayStats.paypal} updateSetting={updateSetting} />
                    <div>
                        <Label htmlFor="paypal-environment">Mode</Label>
                        <Select
                            value={settings.paypal.environment}
                            onValueChange={(value) => updateSetting("paypal", "environment", value)}
                        >
                            <SelectTrigger id="paypal-environment">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sandbox">
                                    Sandbox
                                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                                </SelectItem>
                                <SelectItem value="live">
                                    Live
                                    <Badge className="ml-2 bg-green-100 text-green-800">Production</Badge>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">Credential inputs below automatically switch based on selected mode.</p>
                    </div>

                    {settings.paypal.environment === "sandbox" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="paypal-sandbox-client-id">Sandbox Client ID</Label>
                                <Input
                                    id="paypal-sandbox-client-id"
                                    type={showKeys.paypalSandbox ? "text" : "password"}
                                    placeholder="Enter your sandbox client ID"
                                    value={showKeys.paypalSandbox ? settings.paypal.sandboxClientId : maskApiKey(settings.paypal.sandboxClientId)}
                                    onChange={(e) => updateSetting("paypal", "sandboxClientId", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="paypal-sandbox-secret">Sandbox Secret</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="paypal-sandbox-secret"
                                        type={showKeys.paypalSandbox ? "text" : "password"}
                                        placeholder="Enter your sandbox secret"
                                        value={showKeys.paypalSandbox ? settings.paypal.sandboxSecret : maskApiKey(settings.paypal.sandboxSecret)}
                                        onChange={(e) => updateSetting("paypal", "sandboxSecret", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("paypalSandbox")}>
                                        {showKeys.paypalSandbox ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="paypal-live-client-id">Live Client ID</Label>
                                <Input
                                    id="paypal-live-client-id"
                                    type={showKeys.paypalLive ? "text" : "password"}
                                    placeholder="Enter your live client ID"
                                    value={showKeys.paypalLive ? settings.paypal.liveClientId : maskApiKey(settings.paypal.liveClientId)}
                                    onChange={(e) => updateSetting("paypal", "liveClientId", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="paypal-live-secret">Live Secret</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="paypal-live-secret"
                                        type={showKeys.paypalLive ? "text" : "password"}
                                        placeholder="Enter your live secret"
                                        value={showKeys.paypalLive ? settings.paypal.liveSecret : maskApiKey(settings.paypal.liveSecret)}
                                        onChange={(e) => updateSetting("paypal", "liveSecret", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("paypalLive")}>
                                        {showKeys.paypalLive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* checkout.com Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-indigo-700" />
                        Checkout.com Payment Settings
                        {isGatewayActive("checkoutcom") && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Configure separate sandbox and live Checkout.com credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GatewayQuotaField gateway="checkoutcom" label="Checkout.com" settings={settings} stats={gatewayStats.checkoutcom} updateSetting={updateSetting} />
                    <div>
                        <Label htmlFor="checkoutcom-environment">Mode</Label>
                        <Select
                            value={settings.checkoutcom.environment}
                            onValueChange={(value) => updateSetting("checkoutcom", "environment", value)}
                        >
                            <SelectTrigger id="checkoutcom-environment">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sandbox">
                                    Sandbox
                                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                                </SelectItem>
                                <SelectItem value="live">
                                    Live
                                    <Badge className="ml-2 bg-green-100 text-green-800">Production</Badge>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">Credential inputs below automatically switch based on selected mode.</p>
                    </div>

                    {settings.checkoutcom.environment === "sandbox" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="checkoutcom-sandbox-public-key">Sandbox Public Key</Label>
                                <Input
                                    id="checkoutcom-sandbox-public-key"
                                    type={showKeys.checkoutcomSandbox ? "text" : "password"}
                                    placeholder="pk_test_..."
                                    value={showKeys.checkoutcomSandbox ? settings.checkoutcom.sandboxPublicKey : maskApiKey(settings.checkoutcom.sandboxPublicKey)}
                                    onChange={(e) => updateSetting("checkoutcom", "sandboxPublicKey", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="checkoutcom-sandbox-secret-key">Sandbox Secret Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="checkoutcom-sandbox-secret-key"
                                        type={showKeys.checkoutcomSandbox ? "text" : "password"}
                                        placeholder="sk_test_..."
                                        value={showKeys.checkoutcomSandbox ? settings.checkoutcom.sandboxSecretKey : maskApiKey(settings.checkoutcom.sandboxSecretKey)}
                                        onChange={(e) => updateSetting("checkoutcom", "sandboxSecretKey", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("checkoutcomSandbox")}>
                                        {showKeys.checkoutcomSandbox ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="checkoutcom-live-public-key">Live Public Key</Label>
                                <Input
                                    id="checkoutcom-live-public-key"
                                    type={showKeys.checkoutcomLive ? "text" : "password"}
                                    placeholder="pk_live_..."
                                    value={showKeys.checkoutcomLive ? settings.checkoutcom.livePublicKey : maskApiKey(settings.checkoutcom.livePublicKey)}
                                    onChange={(e) => updateSetting("checkoutcom", "livePublicKey", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="checkoutcom-live-secret-key">Live Secret Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="checkoutcom-live-secret-key"
                                        type={showKeys.checkoutcomLive ? "text" : "password"}
                                        placeholder="sk_live_..."
                                        value={showKeys.checkoutcomLive ? settings.checkoutcom.liveSecretKey : maskApiKey(settings.checkoutcom.liveSecretKey)}
                                        onChange={(e) => updateSetting("checkoutcom", "liveSecretKey", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("checkoutcomLive")}>
                                        {showKeys.checkoutcomLive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Authorize.Net Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-sky-700" />
                        Authorize.Net Payment Settings
                        {isGatewayActive("authorizenet") && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Configure separate sandbox and live Authorize.Net credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GatewayQuotaField gateway="authorizenet" label="Authorize.Net" settings={settings} stats={gatewayStats.authorizenet} updateSetting={updateSetting} />
                    <div>
                        <Label htmlFor="authorizenet-environment">Mode</Label>
                        <Select
                            value={settings.authorizenet.environment}
                            onValueChange={(value) => updateSetting("authorizenet", "environment", value)}
                        >
                            <SelectTrigger id="authorizenet-environment">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sandbox">
                                    Sandbox
                                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                                </SelectItem>
                                <SelectItem value="live">
                                    Live
                                    <Badge className="ml-2 bg-green-100 text-green-800">Production</Badge>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {settings.authorizenet.environment === "sandbox" ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="authorizenet-sandbox-login-id">Sandbox API Login ID</Label>
                                <Input
                                    id="authorizenet-sandbox-login-id"
                                    type={showKeys.authorizenetSandbox ? "text" : "password"}
                                    placeholder="Enter sandbox API Login ID"
                                    value={showKeys.authorizenetSandbox ? settings.authorizenet.sandboxApiLoginId : maskApiKey(settings.authorizenet.sandboxApiLoginId)}
                                    onChange={(e) => updateSetting("authorizenet", "sandboxApiLoginId", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="authorizenet-sandbox-transaction-key">Sandbox Transaction Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="authorizenet-sandbox-transaction-key"
                                        type={showKeys.authorizenetSandbox ? "text" : "password"}
                                        placeholder="Enter sandbox transaction key"
                                        value={showKeys.authorizenetSandbox ? settings.authorizenet.sandboxTransactionKey : maskApiKey(settings.authorizenet.sandboxTransactionKey)}
                                        onChange={(e) => updateSetting("authorizenet", "sandboxTransactionKey", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("authorizenetSandbox")}>
                                        {showKeys.authorizenetSandbox ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="authorizenet-sandbox-client-key">Sandbox Client Key (Accept.js)</Label>
                                <Input
                                    id="authorizenet-sandbox-client-key"
                                    type={showKeys.authorizenetSandbox ? "text" : "password"}
                                    placeholder="Enter sandbox client key"
                                    value={showKeys.authorizenetSandbox ? settings.authorizenet.sandboxClientKey : maskApiKey(settings.authorizenet.sandboxClientKey)}
                                    onChange={(e) => updateSetting("authorizenet", "sandboxClientKey", e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="authorizenet-live-login-id">Live API Login ID</Label>
                                <Input
                                    id="authorizenet-live-login-id"
                                    type={showKeys.authorizenetLive ? "text" : "password"}
                                    placeholder="Enter live API Login ID"
                                    value={showKeys.authorizenetLive ? settings.authorizenet.liveApiLoginId : maskApiKey(settings.authorizenet.liveApiLoginId)}
                                    onChange={(e) => updateSetting("authorizenet", "liveApiLoginId", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="authorizenet-live-transaction-key">Live Transaction Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="authorizenet-live-transaction-key"
                                        type={showKeys.authorizenetLive ? "text" : "password"}
                                        placeholder="Enter live transaction key"
                                        value={showKeys.authorizenetLive ? settings.authorizenet.liveTransactionKey : maskApiKey(settings.authorizenet.liveTransactionKey)}
                                        onChange={(e) => updateSetting("authorizenet", "liveTransactionKey", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("authorizenetLive")}>
                                        {showKeys.authorizenetLive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="authorizenet-live-client-key">Live Client Key (Accept.js)</Label>
                                <Input
                                    id="authorizenet-live-client-key"
                                    type={showKeys.authorizenetLive ? "text" : "password"}
                                    placeholder="Enter live client key"
                                    value={showKeys.authorizenetLive ? settings.authorizenet.liveClientKey : maskApiKey(settings.authorizenet.liveClientKey)}
                                    onChange={(e) => updateSetting("authorizenet", "liveClientKey", e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Viva Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        Viva Payment Settings
                        {isGatewayActive("viva") && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                    </CardTitle>
                    <CardDescription>Configure your Viva payment processor integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GatewayQuotaField gateway="viva" label="Viva" settings={settings} stats={gatewayStats.viva} updateSetting={updateSetting} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="viva-merchant-id">Merchant ID / Client ID</Label>
                            <Input
                                id="viva-merchant-id"
                                placeholder="Enter your Viva Merchant ID"
                                value={settings.viva.merchantId}
                                onChange={(e) => updateSetting("viva", "merchantId", e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="viva-environment">Environment</Label>
                            <Select
                                value={settings.viva.env}
                                onValueChange={(value) => updateSetting("viva", "env", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="demo">
                                        Demo
                                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                                    </SelectItem>
                                    <SelectItem value="live">
                                        Live
                                        <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="viva-api-key">API Key / Client Secret</Label>
                        <div className="flex gap-2">
                            <Input
                                id="viva-api-key"
                                type={showKeys.viva ? "text" : "password"}
                                placeholder="Enter your Viva API Key"
                                value={showKeys.viva ? settings.viva.apiKey : maskApiKey(settings.viva.apiKey)}
                                onChange={(e) => updateSetting("viva", "apiKey", e.target.value)}
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("viva")}>
                                {showKeys.viva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="viva-source-code">Source Code</Label>
                        <Input
                            id="viva-source-code"
                            placeholder="Enter your Viva Source Code"
                            value={settings.viva.sourceCode}
                            onChange={(e) => updateSetting("viva", "sourceCode", e.target.value)}
                        />
                    </div>

                    <Alert className="mt-4">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Action Required: Configure Viva Settings</AlertTitle>
                        <AlertDescription>
                            Please set the following URLs in your Viva Payment profile settings:
                            <ul className="mt-2 list-disc pl-5 space-y-1">
                                <li><span className="font-medium">Success URL:</span> <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{process.env.NEXT_PUBLIC_BASE_URL}/payment-confirmation</code></li>
                                <li><span className="font-medium">Failed URL:</span> <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{process.env.NEXT_PUBLIC_BASE_URL}/payment-failed</code></li>
                            </ul>
                            These URLs are crucial for Viva to redirect your customers after payment.
                        </AlertDescription>
                    </Alert>

                    <Button
                        onClick={() => testConnection("viva")}
                        disabled={testing.viva || !settings.viva.apiKey}
                        variant="outline"
                        className="w-full"
                    >
                        {testing.viva ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <TestTube className="h-4 w-4 mr-2" />
                                Test Viva Connection
                            </>
                        )}
                    </Button>

                    {testResults.viva && (
                        <div
                            className={`p-3 rounded-lg border ${testResults.viva.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                        >
                            <div className="flex items-center space-x-2">
                                {testResults.viva.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                )}
                                <span
                                    className={`text-sm font-medium ${testResults.viva.success ? "text-green-800" : "text-red-800"}`}
                                >
                                    {testResults.viva.message}
                                </span>
                                <span className="text-xs text-gray-500">({testResults.viva.timestamp})</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bank Payment Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        Bank Payment Settings
                    </CardTitle>
                    <CardDescription>
                        Configure settings for manual bank transfers. This option will appear alongside your active payment processor.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Checkbox
                            id="show-bank-payment"
                            checked={settings.bank.show}
                            onCheckedChange={(checked) => updateSetting("bank", "show", !!checked)}
                        />
                        <Label htmlFor="show-bank-payment" className="font-medium text-blue-800">
                            Enable Bank Payment option at checkout
                        </Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="bank-account-name">Account Name</Label>
                            <Input
                                id="bank-account-name"
                                placeholder="Enter your Bank Account Name"
                                value={settings.bank.name}
                                onChange={(e) => updateSetting("bank", "name", e.target.value)}
                                disabled={!settings.bank.show}
                            />
                        </div>
                        <div>
                            <Label htmlFor="bank-account-number">Account Number</Label>
                            <Input
                                id="bank-account-number"
                                placeholder="Enter your Bank Account Number"
                                value={settings.bank.accountNumber}
                                onChange={(e) => updateSetting("bank", "accountNumber", e.target.value)}
                                disabled={!settings.bank.show}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="bank-sort-code">Sort Code</Label>
                            <Input
                                id="bank-sort-code"
                                placeholder="e.g., 04-00-04"
                                value={settings.bank.sortCode}
                                onChange={(e) => updateSetting("bank", "sortCode", e.target.value)}
                                disabled={!settings.bank.show}
                            />
                        </div>
                        <div>
                            <Label htmlFor="bank-reference">Reference Information</Label>
                            <Input
                                id="bank-reference"
                                placeholder="e.g., Use your quote ID as the payment reference."
                                value={settings.bank.reference}
                                onChange={(e) => updateSetting("bank", "reference", e.target.value)}
                                disabled={!settings.bank.show}
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="bank-info-text">Additional Info Text</Label>
                        <Textarea
                            id="bank-info-text"
                            placeholder="e.g., Your quote will be marked as paid once we confirm receipt of your payment."
                            value={settings.bank.info}
                            onChange={(e) => updateSetting("bank", "info", e.target.value)}
                            disabled={!settings.bank.show}
                        />
                    </div>
                    <div>
                        <Label htmlFor="bank-discount">Percentage Off for Bank Payment (%)</Label>
                        <Input id="bank-discount" type="number" value={settings.bank.discountPercentage} onChange={(e) => updateSetting("bank", "discountPercentage", Number(e.target.value))} disabled={!settings.bank.show} />
                        <p className="text-xs text-gray-500 mt-1">Apply a discount for customers who choose to pay via bank transfer. Enter 0 for no discount.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}