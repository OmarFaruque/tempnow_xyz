import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const policyNumber = searchParams.get("number");

  if (!policyNumber) {
    return NextResponse.json(
      { error: "Policy number is required" },
      { status: 400 }
    );
  }

  // If database is not configured, return a mock response for development
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      isValid: false,
      postcode: null,
      reason: "database_not_configured",
      message: "Database not configured in development environment"
    });
  }

  try {
    // Dynamic import to avoid initializing database at module load time
    const { getPolicyByNumber } = await import("@/lib/policy-server");
    const policy = await getPolicyByNumber(policyNumber);

    if (!policy) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    const postcode = policy.postCode;
    
    // If no postcode in record, treat as invalid (user needs to provide one)
    if (!postcode || !postcode.trim()) {
      return NextResponse.json({
        isValid: false,
        postcode: null,
        reason: "no_postcode_in_record"
      });
    }

    // Check postcode validity using the address-lookup API
    const addressLookupUrl = new URL("/api/postcode-lookup", request.url);
    addressLookupUrl.searchParams.set("postcode", postcode);
    const response = await fetch(addressLookupUrl);

    let data: Record<string, unknown>;
    try {
      const body: unknown = await response.json();
      if (!isRecord(body)) {
        throw new Error("Address lookup response was not a JSON object");
      }
      data = body;
    } catch {
      console.error(
        "Address lookup returned a non-JSON response:",
        response.status,
        response.headers.get("content-type")
      );
      return NextResponse.json({
        isValid: true,
        postcode,
        reason: "service_unavailable_assumed_valid"
      });
    }

    if (response.ok) {
      // Valid postcode: format is correct AND found in address database
      return NextResponse.json({
        isValid: true,
        postcode: postcode,
        addresses: data.addresses
      });
    } else if (response.status === 400) {
      // Invalid format
      if (data.code === "invalid_postcode") {
        return NextResponse.json({
          isValid: false,
          postcode: postcode,
          reason: "invalid_format"
        });
      }
      return NextResponse.json({
        isValid: false,
        postcode: postcode,
        reason: "invalid_format"
      });
    } else if (response.status === 404) {
      // Valid format but not found in database
      if (data.code === "postcode_not_found") {
        return NextResponse.json({
          isValid: false,
          postcode: postcode,
          reason: "not_found"
        });
      }
      return NextResponse.json({
        isValid: false,
        postcode: postcode,
        reason: "not_found"
      });
    } else {
      // Service unavailable (503) or other errors - treat as valid to not block user
      return NextResponse.json({
        isValid: true,
        postcode: postcode,
        reason: "service_unavailable_assumed_valid"
      });
    }
  } catch (error) {
    console.error("Error checking postcode validity:", error);
    // On error, assume valid to not block the user
    return NextResponse.json({
      isValid: true,
      postcode: null,
      reason: "error_assumed_valid"
    });
  }
}