import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const { service, config } = await request.json();

    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let response;


    switch (service) {
      case "paddle":
        if (!config.apiKey || !config.vendorId) {
          response = {
            success: false,
            message: "API Key and Vendor ID are required for Paddle integration",
          };
        } else {
          try {
            const paddleEndpoint =
              config.environment === "sandbox"
                ? "https://sandbox-vendors.paddle.com/api/2.0/product/get"
                : "https://vendors.paddle.com/api/2.0/product/get";

            const paddleResponse = await fetch(paddleEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                vendor_id: parseInt(config.vendorId, 10),
                vendor_auth_code: config.apiKey,
              }),
            });

            if (paddleResponse.ok) {
              response = {
                success: true,
                message: "Successfully connected to Paddle",
              };
            } else {
              const errorData = await paddleResponse.json();
              response = {
                success: false,
                message: `Failed to connect to Paddle: ${errorData?.error?.message || "Invalid credentials"}`,
              };
            }
          } catch (error) {
            response = {
              success: false,
              message: `Failed to connect to Paddle: ${error.message}`,
            };
          }
        }
        break;

      case "openai":
        // Mock implementation, as there is no OpenAI library in the project
        if (!config.apiKey) {
          response = {
            success: false,
            message: "API Key is required for OpenAI integration",
          };
        } else if (!config.apiKey.startsWith("sk-")) {
          response = {
            success: false,
            message: "Invalid OpenAI API Key format",
          };
        } else {
          response = {
            success: true,
            message: "Successfully connected to OpenAI (mock)",
          };
        }
        break;

      case "resend":
        if (!config.apiKey) {
          response = {
            success: false,
            message: "API Key is required for Resend integration",
          };
        } else {
          try {
            const resend = new Resend(config.apiKey);
            await resend.domains.list();
            response = {
              success: true,
              message: "Successfully connected to Resend",
            };
          } catch (error) {
            response = {
              success: false,
              message: `Failed to connect to Resend: ${error.message}`,
            };
          }
        }
        break;

      case "vehicleApi":
        // Mock implementation, as the real implementation is missing
        if (!config.apiKey) {
          response = {
            success: false,
            message: "API Key is required for Vehicle API integration",
          };
        } else if (!config.endpoint) {
          response = {
            success: false,
            message: "API endpoint is required",
          };
        } else {
          response = {
            success: true,
            message: "Successfully connected to Vehicle API (mock)",
          };
        }
        break;
      
      case "stripe":
        // Mock implementation
        if (!config.secretKey) {
          response = {
            success: false,
            message: "Secret Key is required for Stripe integration",
          };
        } else {
          response = {
            success: true,
            message: "Successfully connected to Stripe (mock)",
          };
        }
        break;

      case "mollie":
        // Mock implementation
        if (!config.apiKey) {
          response = {
            success: false,
            message: "API Key is required for Mollie integration",
          };
        } else {
          response = {
            success: true,
            message: "Successfully connected to Mollie (mock)",
          };
        }
      break;

      case "fraudLabsPro":
        if (!config.apiKey) {
          response = {
            success: false,
            message: "API Key is required for FraudLabsPro integration",
          };
        } else {
          try {
            // Send a lightweight POST to the documented screen endpoint
            const params = new URLSearchParams();
            params.set('key', config.apiKey);
            params.set('format', 'json');

            const fraudLabsResponse = await fetch("https://api.fraudlabspro.com/v2/order/screen", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: params.toString(),
            });

            if (fraudLabsResponse.ok) {
              response = {
                success: true,
                message: "Successfully connected to FraudLabsPro",
              };
            } else {
              // Non-2xx from provider still indicates the endpoint is reachable; report provider status
              const body = await fraudLabsResponse.text().catch(() => "");
              response = {
                success: false,
                message: `FraudLabsPro returned status ${fraudLabsResponse.status}: ${body || fraudLabsResponse.statusText}`,
              };
            }
          } catch (error) {
            response = {
              success: false,
              message: `Failed to connect to FraudLabsPro: ${error instanceof Error ? error.message : String(error)}`,
            };
          }
        }
      break;

      case "viva":
        if (!config.merchantId || !config.apiKey || !config.sourceCode) {
          let missingFields = [];
          if (!config.merchantId) missingFields.push("Merchant ID");
          if (!config.apiKey) missingFields.push("API Key");
          if (!config.sourceCode) missingFields.push("Source Code");
          response = {
            success: false,
            message: `Missing required fields for Viva integration: ${missingFields.join(", ")}`,
          };
        } else {
          response = {
            success: true,
            message: "Successfully connected to Viva (mock)",
          };
        }
      break;

      default:
        response = {
          success: false,
          message: `Unknown service: ${service}`,
        };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error testing connection:", error);
    return NextResponse.json(
      { success: false, message: "Failed to test connection" },
      { status: 500 }
    );
  }
}
