export const PAYMENT_GATEWAYS = [
    { id: "stripe", label: "Stripe" },
    { id: "square", label: "Square" },
    { id: "airwallex", label: "Airwallex" },
    { id: "authorizenet", label: "Authorize.Net" },
    { id: "mollie", label: "Mollie" },
    { id: "paddle", label: "Paddle" },
    { id: "viva", label: "Viva" },
    { id: "lemonsqueezy", label: "Lemon Squeezy" },
    { id: "paypal", label: "PayPal" },
    { id: "checkoutcom", label: "Checkout.com" },
] as const;

export type PaymentGatewayId = (typeof PAYMENT_GATEWAYS)[number]["id"];
export type PaymentProduct = "quote" | "doc-forge";

/**
 * Gateways the document service (doc-forge) can actually be paid through.
 *
 * Every entry here is a hosted payment page: the storefront redirects to the
 * provider, so no card fields are mounted on our pages. Square, Authorize.Net
 * and Airwallex are quote-only - their card forms are embedded components on
 * the quote checkout - and routing a doc-forge purchase to one of them would
 * produce a purchase the storefront cannot complete.
 */
export const DOC_FORGE_GATEWAYS: readonly PaymentGatewayId[] = [
    "stripe",
    "mollie",
    "paddle",
    "viva",
    "lemonsqueezy",
    "paypal",
    "checkoutcom",
];

const gatewayIds = new Set<string>(PAYMENT_GATEWAYS.map((gateway) => gateway.id));

/** Read the new ordered list while remaining compatible with older settings. */
export function getConfiguredGatewayOrder(paymentSettings: unknown): PaymentGatewayId[] {
    if (!paymentSettings || typeof paymentSettings !== "object") return [];

    const payment = paymentSettings as Record<string, unknown>;
    const rawOrder = Array.isArray(payment.gatewayOrder)
        ? payment.gatewayOrder
        : payment.activeProcessor && payment.activeProcessor !== "none"
            ? [payment.activeProcessor]
            : [];

    const seen = new Set<string>();
    return rawOrder.filter((value): value is PaymentGatewayId => {
        if (typeof value !== "string" || !gatewayIds.has(value) || seen.has(value)) return false;
        seen.add(value);
        return true;
    });
}

export function getProductGatewayOrder(
    paymentSettings: unknown,
    product: PaymentProduct,
): PaymentGatewayId[] {
    const order = getConfiguredGatewayOrder(paymentSettings);
    return product === "doc-forge"
        ? order.filter((gateway) => DOC_FORGE_GATEWAYS.includes(gateway))
        : order;
}

export function getRetryLimit(paymentSettings: unknown): number {
    if (!paymentSettings || typeof paymentSettings !== "object") return 2;
    const configured = Number((paymentSettings as Record<string, unknown>).maxRetries);
    return Number.isInteger(configured) ? Math.min(3, Math.max(0, configured)) : 2;
}

export function getGatewayDisplayName(gateway: string): string {
    return PAYMENT_GATEWAYS.find((entry) => entry.id === gateway)?.label ?? gateway;
}