import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { quotes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSettings } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const policyId = body?.policyId;
    if (!policyId) return NextResponse.json({ success: false, message: "policyId is required" }, { status: 400 });

    const quoteRow = await db.query.quotes.findFirst({ where: eq(quotes.id, policyId) });
    if (!quoteRow) return NextResponse.json({ success: false, message: "Policy not found" }, { status: 404 });

    const fraudSettings = await getSettings("fraudLabsPro");
    const apiKey = fraudSettings?.apiKey;
    if (!apiKey) return NextResponse.json({ success: false, message: "Fraud provider not configured" }, { status: 400 });

    const params = new URLSearchParams();
    params.set("key", apiKey);
    params.set("format", "json");
    // Extract details from stored quoteData when available
    let parsedQuoteData: any = null;
    try {
      if (quoteRow.quoteData) parsedQuoteData = JSON.parse(quoteRow.quoteData as string);
    } catch (e) {
      parsedQuoteData = null;
    }

    const email = parsedQuoteData?.customerData?.email || undefined;
    if (email) params.set('email', email);
    if (quoteRow.firstName) params.set("first_name", quoteRow.firstName as string);
    if (quoteRow.lastName) params.set("last_name", quoteRow.lastName as string);

    const amountValue = quoteRow.updatePrice || quoteRow.cpw || parsedQuoteData?.total || parsedQuoteData?.amount || 0;
    if (amountValue) params.set('amount', String(amountValue));

    // Optional additional fields from quote row
    if (quoteRow.id) params.set('order_id', String(quoteRow.id));
    const currency = (quoteRow as any)?.currency || 'GBP';
    if (currency) params.set('currency', currency);
    if (quoteRow.address) params.set('billing_address', quoteRow.address as string);
    if (quoteRow.postCode) params.set('billing_postcode', quoteRow.postCode as string);
    if (quoteRow.phone) params.set('billing_phone', quoteRow.phone as string);

    // Try to extract IP from stored quoteData if available
    try {
      if (quoteRow.quoteData) {
        const parsed = JSON.parse(quoteRow.quoteData as string || '{}');
        const ipFromQuote = parsed?.customerData?.ip || parsed?.ip;
        const isPrivateIp = (ip?: string) => {
          if (!ip) return true;
          if (ip === '::1' || ip === '127.0.0.1') return true;
          if (/^10\./.test(ip)) return true;
          if (/^192\.168\./.test(ip)) return true;
          if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
          if (/^fc00:/i.test(ip) || /^fe80:/i.test(ip)) return true;
          return false;
        }
        if (ipFromQuote && !isPrivateIp(ipFromQuote)) params.set('ip', ipFromQuote);
      }
    } catch (e) {
      // ignore parse errors
    }

    const url = `https://api.fraudlabspro.com/v2/order/screen`;
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() });
    const raw = await res.json().catch(() => null);

    let score: number | null = null;
    if (raw) {
      score = raw.fraudlabspro_score ?? raw.risk_score ?? raw.score ?? null;
      if (typeof score === "string") {
        const n = Number(score);
        if (!Number.isNaN(n)) score = n;
      }
    }

    const providerError = !res.ok || (raw && (raw.error || raw.error_message || raw.error_code));

    const blockThreshold = fraudSettings?.blockThreshold ?? 80;
    const warnThreshold = fraudSettings?.warnThreshold ?? 60;
    const explicitFraud = raw && (raw.is_fraud === true || raw.is_highrisk === true || raw.is_flagged === true);

    let action: "block" | "warn" | "allow" | "error" = "allow";
    if (providerError) action = "error";
    else if (explicitFraud) action = "block";
    else if (typeof score === "number") {
      if (score >= blockThreshold) action = "block";
      else if (score >= warnThreshold) action = "warn";
      else action = "allow";
    }

    await db.update(quotes).set({
      fraudStatus: action === "allow" ? "ok" : action,
      fraudScore: score ?? undefined,
      fraudDetails: raw ?? undefined,
      fraudCheckedAt: new Date().toISOString(),
    }).where(eq(quotes.id, policyId));

    return NextResponse.json({ success: true, action, score, raw });
  } catch (error) {
    console.error("Retry fraud check failed:", error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
