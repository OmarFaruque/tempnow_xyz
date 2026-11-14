/**
 * Shared types for the vehicle catalogue.
 *
 * The data itself comes from the cardata.wiki API (see `./provider.ts`); there is
 * no bundled catalogue in the repository any more.
 */

export type VehicleType = "car" | "van";

export const isVehicleType = (value: unknown): value is VehicleType =>
  value === "car" || value === "van";

export interface VehicleVariant {
  id: string;
  label: string;
  make: string;
  model: string;
  trim: string;
  engineLabel: string;
  engineCapacity: number;
  fuel: string;
  yearFrom: number;
  yearTo: number;
  /** End of the production range - what the quote page uses as "year". */
  year: number;
  vehicleType: VehicleType;
  bodyType?: string;
}

export type CatalogStepKey = "make" | "model" | "year" | "engine" | "fuel" | "variant";

export interface CatalogStep {
  /** Key used in the selection object / query string. */
  key: CatalogStepKey;
  label: string;
  placeholder: string;
}

export interface CatalogOption {
  value: string;
  label: string;
}

export type CatalogSelection = Record<string, string | undefined>;

export interface CatalogNext {
  /** The next question to ask, or null when the selection is complete. */
  step: CatalogStep | null;
  options: CatalogOption[];
  /** Set when `step` is null - the fully resolved vehicle. */
  vehicle?: VehicleVariant;
}

export interface CatalogProvider {
  id: string;
  /** True when the data distinguishes cars from vans. */
  supportsVehicleType: boolean;
  getNext(type: VehicleType, selection: CatalogSelection): Promise<CatalogNext | null>;
}

export const isSelectionComplete = (next: CatalogNext) => !next.step && Boolean(next.vehicle);