import { NextResponse } from "next/server";
import { getCatalogNext } from "@/lib/vehicle-catalogue";
import { isVehicleType, type VehicleType } from "@/lib/vehicle-catalogue/types";

const SELECTION_KEYS = ["make", "model", "year", "engine", "fuel", "variant"] as const;

const STEP_LABELS: Record<string, string> = {
  make: "vehicle make",
  model: "vehicle model",
  year: "year of manufacture",
  engine: "engine size",
  fuel: "fuel type",
  variant: "vehicle variant",
};

/**
 * Step based vehicle search behind the "Choose vehicle manually" flow.
 *
 * The endpoint is deliberately stateless: the client sends the options chosen so
 * far, and gets back the next question plus its options (or the finished
 * vehicle). Data comes from the cardata.wiki API.
 *
 * GET /api/vehicle-catalog?type=car&make=Ford&model=Fiesta
 * ->
 * {
 *   type: "car",
 *   source: "cardata",
 *   attribution: "Vehicle data: cardata.wiki",
 *   selection: { make: "Ford", model: "Fiesta" },
 *   step: { key: "variant", label: "Variant", placeholder: "Select variant" },
 *   options: [{ value: "...", label: "..." }]
 * }
 *
 * When the selection is complete the response contains `step: null` and a
 * `vehicle` object which the quote page understands. A missing key or an API
 * failure returns 503 with a message the picker displays.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawType = searchParams.get("type");
  if (!isVehicleType(rawType)) {
    return NextResponse.json(
      { message: "A vehicle type of 'car' or 'van' is required." },
      { status: 400 },
    );
  }
  const type: VehicleType = rawType;

  const selection: Record<string, string> = {};
  for (const key of SELECTION_KEYS) {
    const value = searchParams.get(key)?.trim();
    if (value) selection[key] = value;
  }

  try {
    const result = await getCatalogNext(type, selection);

    if (!result) {
      return NextResponse.json(
        {
          message:
            "The vehicle list is not available right now. Enter your registration number instead, or try again shortly.",
          type,
          selection,
        },
        { status: 503 },
      );
    }

    if (result.step && result.options.length === 0) {
      const label = STEP_LABELS[result.step.key] ?? result.step.key;
      return NextResponse.json(
        {
          message: `No ${label} found for that selection. Please go back and choose again.`,
          type,
          selection,
          source: result.source,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        type,
        source: result.source,
        attribution: result.attribution ?? null,
        selection,
        step: result.step,
        options: result.options,
        vehicle: result.vehicle ?? null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Vehicle catalogue error:", error);
    return NextResponse.json({ message: "Could not load vehicle catalogue." }, { status: 500 });
  }
}