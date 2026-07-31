import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { settings as settingsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const settingsFromDb = await db.select().from(settingsTable);

    const settings = settingsFromDb.reduce((acc, setting) => {
      try {
        if (setting.value === null || setting.value === undefined) {
          acc[setting.param] = {};
        } else if (typeof setting.value === 'object') {
          acc[setting.param] = setting.value;
        } else if (typeof setting.value === 'string') {
          acc[setting.param] = JSON.parse(setting.value);
        } else {
          acc[setting.param] = setting.value;
        }
      } catch (e) {
        acc[setting.param] = {};
      }
      return acc;
    }, {} as { [key: string]: any });



    return NextResponse.json(
      {
        success: true,
        settings: settings,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();

    if (!settings) {
      return NextResponse.json(
        { error: "Settings data required" },
        { status: 400 }
      );
    }

    // Use a transaction to ensure all settings are saved or none are.
    // Note: Using select-then-update/insert because the DB table may lack
    // a UNIQUE constraint on "param" (needed for ON CONFLICT DO UPDATE).
    await db.transaction(async (tx) => {
      for (const key in settings) {
        if (Object.prototype.hasOwnProperty.call(settings, key)) {
          const value = JSON.stringify(settings[key]);
          const existing = await tx
            .select()
            .from(settingsTable)
            .where(eq(settingsTable.param, key))
            .limit(1);

          if (existing.length > 0) {
            await tx
              .update(settingsTable)
              .set({ value: value })
              .where(eq(settingsTable.param, key));
          } else {
            await tx
              .insert(settingsTable)
              .values({ param: key, value: value });
          }
        }
      }
    });

    // Redact sensitive data before logging
    const logData = JSON.parse(JSON.stringify(settings));
    if (logData.paddle?.apiKey) logData.paddle.apiKey = "[REDACTED]";
    if (logData.paddle?.discordRefundWebhookUrl) logData.paddle.discordRefundWebhookUrl = "[REDACTED]";
    if (logData.openai?.apiKey) logData.openai.apiKey = "[REDACTED]";
    if (logData.resend?.apiKey) logData.resend.apiKey = "[REDACTED]";
    if (logData.vehicleApi?.apiKey) logData.vehicleApi.apiKey = "[REDACTED]";
    if (logData.stripe?.secretKey) logData.stripe.secretKey = "[REDACTED]";
    if (logData.mollie?.apiKey) logData.mollie.apiKey = "[REDACTED]";
    if (logData.fraudLabsPro?.apiKey) logData.fraudLabsPro.apiKey = "[REDACTED]";
    if (logData.paypal?.sandboxClientId) logData.paypal.sandboxClientId = "[REDACTED]";
    if (logData.paypal?.sandboxSecret) logData.paypal.sandboxSecret = "[REDACTED]";
    if (logData.paypal?.liveClientId) logData.paypal.liveClientId = "[REDACTED]";
    if (logData.paypal?.liveSecret) logData.paypal.liveSecret = "[REDACTED]";
    if (logData.checkoutcom?.sandboxPublicKey) logData.checkoutcom.sandboxPublicKey = "[REDACTED]";
    if (logData.checkoutcom?.sandboxSecretKey) logData.checkoutcom.sandboxSecretKey = "[REDACTED]";
    if (logData.checkoutcom?.livePublicKey) logData.checkoutcom.livePublicKey = "[REDACTED]";
    if (logData.checkoutcom?.liveSecretKey) logData.checkoutcom.liveSecretKey = "[REDACTED]";
    if (logData.authorizenet?.sandboxApiLoginId) logData.authorizenet.sandboxApiLoginId = "[REDACTED]";
    if (logData.authorizenet?.sandboxTransactionKey) logData.authorizenet.sandboxTransactionKey = "[REDACTED]";
    if (logData.authorizenet?.liveApiLoginId) logData.authorizenet.liveApiLoginId = "[REDACTED]";
    if (logData.authorizenet?.liveTransactionKey) logData.authorizenet.liveTransactionKey = "[REDACTED]";
    if (logData.motApi?.mot_api_key) logData.motApi.mot_api_key = "[REDACTED]";
    if (logData.motApi?.check_car_details_api_key) logData.motApi.check_car_details_api_key = "[REDACTED]";
    if (logData.motApi?.mot_client_id) logData.motApi.mot_client_id = "[REDACTED]";
    if (logData.motApi?.mot_client_secret) logData.motApi.mot_client_secret = "[REDACTED]";
    if (logData.motApi?.mot_scope_url) logData.motApi.mot_scope_url = "[REDACTED]";
    if (logData.motApi?.mot_token_url) logData.motApi.mot_token_url = "[REDACTED]";

    revalidatePath('/');
    revalidatePath('/administrator');
    revalidatePath('/api/admin/settings');


    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}