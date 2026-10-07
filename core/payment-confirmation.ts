import 'server-only'

/**
 * Shared "a quote was paid" side effects for every gateway webhook.
 *
 * The confirmation e-mail is the slow half of a payment (invoice PDF
 * generation), so it is never awaited inside a webhook - providers time out
 * long before that finishes. Instead the request is started while the webhook
 * (or the customer's own confirm-on-return call) is still open, and the quote
 * stays `mail_sent = false` until `/api/dispatch-confirmation` has delivered
 * it. `/api/scheduled/resend-confirmations` retries anything that was missed,
 * and the conditional `mail_sent` claim inside the endpoint makes sure a quote
 * can only ever be confirmed once.
 */
export function triggerConfirmationEmail(quoteId: number): void {
    if (!Number.isSafeInteger(quoteId) || quoteId <= 0) {
        console.error(`Payment confirmation: invalid quote id (${quoteId}) - confirmation email not triggered.`)
        return
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, '')
    if (!baseUrl) {
        console.error(
            `Payment confirmation: cannot trigger the confirmation email for quote ${quoteId} - NEXT_PUBLIC_BASE_URL is not set.`,
        )
        return
    }

    try {
        fetch(`${baseUrl}/api/send-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quoteId }),
        })
            .then(async (response) => {
                if (!response.ok) {
                    const detail = await response.text().catch(() => '')
                    console.error(
                        `Payment confirmation: confirmation email for quote ${quoteId} failed (${response.status}): ${detail.slice(0, 300)}`,
                    )
                }
            })
            .catch((error) => {
                console.error(`Payment confirmation: confirmation email trigger for quote ${quoteId} failed:`, error)
            })
    } catch (error) {
        console.error(`Payment confirmation: could not trigger the confirmation email for quote ${quoteId}:`, error)
    }
}

const ORDER_CACHES = ['/api/quotes', '/ops-hub', '/api/ops/orders']

/**
 * Revalidate the caches that show order/payment state.
 *
 * Cache invalidation must never be able to fail a payment: when this runs from
 * a task that outlived its response (`revalidatePath` needs a request context)
 * the paths are simply skipped with a log line.
 */
export function revalidateOrderCaches(revalidatePath: (path: string) => unknown): void {
    for (const path of ORDER_CACHES) {
        try {
            revalidatePath(path)
        } catch (error) {
            console.error(`Payment confirmation: revalidatePath(${path}) failed:`, error)
        }
    }
}
