
import { NextResponse } from "next/server";
import { getPolicyByNumber } from "@/lib/policy-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const policyNumber = searchParams.get("number");

  if (!policyNumber) {
    return NextResponse.json(
      { error: "Policy number is required" },
      { status: 400 }
    );
  }

  try {
    const policy = await getPolicyByNumber(policyNumber);
    if (policy) {
      return NextResponse.json(policy);
    } else {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching policy:", error);
    return NextResponse.json(
      { error: "Failed to fetch policy details" },
      { status: 500 }
    );
  }
}
