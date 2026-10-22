import { type NextRequest, NextResponse } from "next/server";


function normalizeAddresses(payload: any): { address_selector: string }[] {
  if (!payload) return [];
  if (Array.isArray(payload.result)) {
    return payload.result
      .map((entry: any) => {
        if (!entry || typeof entry !== "object") return null;
        const addressSelector = [entry.line_1, entry.line_2, entry.line_3, entry.post_town, entry.postcode]
          .filter((part) => typeof part === "string" && part.trim())
          .join(", ");
        return addressSelector ? { address_selector: addressSelector } : null;
      })
      .filter(Boolean) as { address_selector: string }[];
  }
}

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode");
  const api_key = process.env.IDEAL_POSTCODES_API_KEY;

  if (!postcode) {
    return NextResponse.json(
      { error: "Postcode is required" },
      { status: 400 }
    );
  }

  try {
    const decodedPostcode = decodeURIComponent(postcode);
    // const url = `https://proxy.v1a.goshorty.co.uk/postcode/${decodedPostcode}/2a-925891-194addebafc-3887ee9e`;
    const url = `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(decodedPostcode)}?api_key=${api_key}`;

    const response = await fetch(url);
    let data: any;

    if (response.ok) {   
        try {
          data = await response.json();
        } catch {
          return NextResponse.json(
            { error: "The address lookup service is temporarily unavailable. Please type the address manually below.", code: "address_lookup_unavailable" },
            { status: 503 }
          );
        }
      const addresses = normalizeAddresses(data);
      return NextResponse.json({ addresses });
     
    } else {
      const errorBody = await response.text();
      return NextResponse.json(
        {
          error: "Failed to fetch address data",
          details: errorBody,
        },
        { status: response.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}