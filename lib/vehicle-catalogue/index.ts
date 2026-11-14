import { CARDATA_ATTRIBUTION, cardataProvider, isCatalogConfigured } from "./provider";
import type { CatalogNext, CatalogSelection, VehicleType } from "./types";

/**
 * Vehicle catalogue entry point.
 *
 * The picker is served entirely by the cardata.wiki API - there is no bundled or
 * imported catalogue in the repository. Set `CARDATA_API_KEY` to enable it.
 */

export type CatalogSource = "cardata";

export interface CatalogResult extends CatalogNext {
  source: CatalogSource;
  attribution?: string;
}

/**
 * Resolves the next step for a (partial) vehicle selection.
 *
 * Returns `null` when the catalogue is not configured or the API cannot answer;
 * the route turns that into a clear 503 instead of a fake list.
 */
export async function getCatalogNext(
  type: VehicleType,
  selection: CatalogSelection,
): Promise<CatalogResult | null> {
  if (!isCatalogConfigured()) return null;

  const next = await cardataProvider.getNext(type, selection);
  if (!next) return null;

  return { ...next, source: "cardata", attribution: CARDATA_ATTRIBUTION };
}