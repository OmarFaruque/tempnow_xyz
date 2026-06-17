import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSettings } from "@/lib/database";

type FraudCheckRequest = {
  ip?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  amount?: number | string;
  userAgent?: string;
  cardBin?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: FraudCheckRequest = await request.json();
    // Log incoming body for debugging (developer requested)
    console.log("/api/fraud/check body:", JSON.stringify(body));

    // Load FraudLabsPro settings from DB
    const settings = await getSettings("fraudLabsPro");
    const apiKey: string | undefined = settings?.apiKey;

    if (!apiKey) {
      return NextResponse.json({ success: false, message: "FraudLabsPro API key not configured" }, { status: 400 });
    }

    // Build request body for FraudLabsPro /v2/order/screen endpoint (form-encoded)
    const params = new URLSearchParams();
    params.set("key", apiKey);
    params.set("format", "json");

    const isPrivateIp = (ip?: string) => {
      if (!ip) return true;
      if (ip === "::1" || ip === "127.0.0.1") return true;
      if (/^10\./.test(ip)) return true;
      if (/^192\.168\./.test(ip)) return true;
      if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
      if (/^fc00:/i.test(ip) || /^fe80:/i.test(ip)) return true;
      return false;
    };

    if (body.ip && !isPrivateIp(body.ip)) params.set("ip", body.ip);
    if (body.email) params.set("email", body.email);
    if (body.firstName) params.set("first_name", body.firstName as string);
    if (body.lastName) params.set("last_name", body.lastName as string);
    if (body.amount) params.set("amount", String(body.amount));
    if (body.userAgent) params.set("user_agent", body.userAgent as string);
    if (body.cardBin) params.set("bin_no", body.cardBin as string);

    const url = `https://api.fraudlabspro.com/v2/order/screen`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    console.log("FraudLabsPro HTTP status:", res.status, res.statusText);

    const raw = await res.json().catch(() => null);

    // If the provider returned a non-200 or included an error object, mark as provider error
    const providerError = !res.ok || (raw && (raw.error || raw.error_message || raw.error_code));

    // Normalize response and derive a risk score if available
    let score: number | null = null;
    if (raw) {
      // Common possible fields from /v2/order/screen
      score = raw.fraudlabspro_score ?? raw.risk_score ?? raw.score ?? null;
      if (typeof score === "string") {
        const n = Number(score);
        if (!Number.isNaN(n)) score = n;
      }
    }

    // Decision thresholds (can later be made configurable)
    const blockThreshold = settings?.blockThreshold ?? 80;
    const warnThreshold = settings?.warnThreshold ?? 60;

    // If API returns an explicit flag indicating fraud, use that
    const explicitFraud = raw && (raw.is_fraud === true || raw.is_highrisk === true || raw.is_flagged === true);

    let action: "block" | "warn" | "allow" | "error" = "allow";

    // If the provider errored, surface it explicitly so callers/admins can see it
    if (providerError) {
      action = "error";
    } else if (explicitFraud) action = "block";
    else if (typeof score === "number") {
      if (score >= blockThreshold) action = "block";
      else if (score >= warnThreshold) action = "warn";
      else action = "allow";
    }

    return NextResponse.json({ success: true, action, score, raw });
  } catch (error) {
    console.error("Error running fraud check:", error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
