import { db } from "@/lib/db";
import { settings as settingsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

export interface VivaConfig {
  merchantId: string;
  apiKey: string;
  sourceCode: string;
  env: "demo" | "live";
}

async function getVivaConfig(): Promise<VivaConfig> {
  const vivaSettings = await db.query.settings.findFirst({
    where: eq(settingsTable.param, "viva"),
  });

  if (!vivaSettings || !vivaSettings.value) {
    throw new Error("Viva settings not found in database.");
  }

  return JSON.parse(vivaSettings.value as string) as VivaConfig;
}

export async function getVivaClient() {
  const config = await getVivaConfig();
  const apiBaseUrl =
    config.env === "demo"
      ? "https://demo-api.vivapayments.com"
      : "https://api.vivapayments.com";

  const getAccessToken = async () => {
    const authUrl =
      config.env === "demo"
        ? "https://demo-accounts.vivapayments.com/connect/token"
        : "https://accounts.vivapayments.com/connect/token";

    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(
          `${config.merchantId}:${config.apiKey}`
        )}`,
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();
    return data.access_token;
  };

  const createOrder = async (amount: number, customerTrns: string, email: string, fullName: string, phone: string, countryCode: string, requestLang: string) => {
    const accessToken = await getAccessToken();
    const response = await fetch(`${apiBaseUrl}/checkout/v2/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // amount in cents
        customerTrns,
        customer: {
          email,
          fullName,
          phone,
          countryCode,
          requestLang,
        },
        sourceCode: config.sourceCode,
      }),
    });
    return response.json();
  };

  const retrieveTransaction = async (transactionId: string) => {
    const accessToken = await getAccessToken();
    const response = await fetch(
      `${apiBaseUrl}/checkout/v2/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.json();
  };

  return {
    createOrder,
    retrieveTransaction,
  };
}
