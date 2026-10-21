import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode");

  if (!postcode) {
    return NextResponse.json(
      { error: "Postcode is required" },
      { status: 400 }
    );
  }

  try {
    const decodedPostcode = decodeURIComponent(postcode);
    // const url = `https://proxy.v1a.goshorty.co.uk/postcode/${decodedPostcode}/2a-925891-194addebafc-3887ee9e`;
    const url = `https://api.postcodes.io/postcodes/${decodedPostcode}`;

    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      const result = data.result;
      const addressSelector = result
        ? [result.admin_district, result.region, result.postcode]
            .filter(Boolean)
            .join(", ")
        : "";

      return NextResponse.json({
        addresses: addressSelector ? [{ address_selector: addressSelector }] : [],
      });
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