import type {
  CatalogNext,
  CatalogOption,
  CatalogProvider,
  CatalogSelection,
  VehicleType,
  VehicleVariant,
} from "./types";

/**
 * cardata.wiki API provider - the only vehicle catalogue in this app.
 *
 *   CARDATA_API_KEY=cdw_...            # required
 *   CARDATA_API_URL=...                # optional override (default https://cardata.wiki)
 *
 * £20 + VAT/month, cancel anytime: https://cardata.wiki/api-docs
 *
 * The API lists makes straight away, but has no "models of a make" endpoint, so
 * models are derived from the variant list (paged, cached). Variant names carry
 * the trim ("2.0 TDCi Titanium"), so the engine size is parsed from the name.
 *
 * The API has no car/van filter: every variant belongs to one flat list and no
 * body type is exposed. So the only local piece of knowledge is which makes are
 * van manufacturers (VAN_MAKES). Every model, year and variant for those makes
 * still comes straight from the API - nothing is hard-coded per model.
 *
 * Without a key, or when a request fails, `getNext` returns `null` and the route
 * answers 503 with a clear message - there is no bundled catalogue fallback.
 */

const DEFAULT_BASE_URL = "https://cardata.wiki";
const MAKES_TTL_MS = 6 * 60 * 60 * 1000;
const VARIANTS_TTL_MS = 60 * 60 * 1000;
const MAX_MAKE_PAGES = 8; // 8 x 200 variants = 1,600 variants per make
const MAX_MODEL_PAGES = 2;

export const CARDATA_ATTRIBUTION = "Vehicle data: cardata.wiki";

export const isCatalogConfigured = () => Boolean(process.env.CARDATA_API_KEY?.trim());

interface CacheEntry<T> {
  expires: number;
  value: T;
}

const cache = new Map<string, CacheEntry<unknown>>();

function readCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function writeCache<T>(key: string, value: T, ttl: number) {
  // Small, bounded cache: one instance is never going to hold thousands of keys.
  if (cache.size > 500) cache.clear();
  cache.set(key, { expires: Date.now() + ttl, value });
}

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const API_FUEL: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID_PETROL: "Hybrid",
  HYBRID_DIESEL: "Hybrid",
  PLUG_IN_HYBRID: "Plug-in Hybrid",
  HYDROGEN: "Hydrogen",
  LPG: "LPG",
};

/** "2.0 TDCi Titanium" -> 2000. Approximate is fine: the API gives no cc in lists. */
export function parseEngineCc(name: string): number {
  const cc = name.match(/(\d{3,5})\s*(?:cc|cm3)\b/i);
  if (cc) return Number(cc[1]);

  const litres = name.match(/(?:^|\s)(\d(?:[.,]\d{1,2})?)\s*(?:l\b|litres?|liters?)/i);
  if (litres) return Math.round(Number(litres[1].replace(",", ".")) * 1000);

  const leading = name.match(/^(\d(?:[.,]\d{1,2})?)(?!\d)/);
  if (leading) return Math.round(Number(leading[1].replace(",", ".")) * 1000);

  return 0;
}

/**
 * UK manufacturers that sell vans. Matched against the API's make slug, so
 * "Citroën" (citroen) and "Mercedes-Benz" (mercedes-benz) both work.
 */
const VAN_MAKES = new Set([
  "citroen",
  "fiat",
  "ford",
  "isuzu",
  "iveco",
  "ldv",
  "man",
  "maxus",
  "mercedes-benz",
  "nissan",
  "peugeot",
  "renault",
  "toyota",
  "vauxhall",
  "volkswagen",
]);

/** True when the make is a known UK van manufacturer. */
export const isVanMake = (make: string) => VAN_MAKES.has(slugify(make));

interface ApiVariant {
  id?: string;
  slug?: string;
  name?: string;
  make?: string;
  model?: string;
  yearFrom?: number | null;
  yearTo?: number | null;
  engineFuelType?: string | null;
  engineCapacityCc?: number | null;
  engineDisplacementCc?: number | null;
}

interface ApiList<T> {
  data?: T[];
  meta?: { page?: number; pages?: number; total?: number };
}

async function apiGet<T>(path: string, params: Record<string, string | number>): Promise<ApiList<T>> {
  const key = process.env.CARDATA_API_KEY?.trim();
  if (!key) throw new Error("CARDATA_API_KEY is not set");

  const base = (process.env.CARDATA_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const url = new URL(`${base}${path}`);
  for (const [name, value] of Object.entries(params)) {
    if (value !== "") url.searchParams.set(name, String(value));
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`cardata.wiki ${response.status} ${response.statusText} for ${path}`);
  }

  return (await response.json()) as ApiList<T>;
}

async function fetchMakes(): Promise<string[]> {
  const cached = readCache<string[]>("makes");
  if (cached) return cached;

  const names: string[] = [];
  for (let page = 1; page <= MAX_MAKE_PAGES; page++) {
    const { data, meta } = await apiGet<{ name?: string } | string>("/api/v1/makes", {
      page,
      limit: 200,
    });
    const items = Array.isArray(data) ? data : [];
    for (const item of items) {
      const name = typeof item === "string" ? item : item?.name;
      if (name && !names.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
        names.push(name.trim());
      }
    }
    if (!items.length || !meta?.pages || page >= meta.pages) break;
  }

  names.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  writeCache("makes", names, MAKES_TTL_MS);
  return names;
}

/** `A110` / `a110` / `A 110` are the same model. */
const sameModel = (candidate: string | undefined, wanted: string) => {
  if (!candidate) return false;
  return (
    slugify(candidate) === slugify(wanted) ||
    candidate.trim().toLowerCase() === wanted.trim().toLowerCase()
  );
};

async function fetchVariantPages(
  params: Record<string, string | number>,
  maxPages: number,
): Promise<ApiVariant[]> {
  const variants: ApiVariant[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const { data, meta } = await apiGet<ApiVariant>("/api/v1/variants", {
      ...params,
      page,
      limit: 200,
    });

    const items = Array.isArray(data) ? data : [];
    variants.push(...items);
    if (!items.length || !meta?.pages || page >= meta.pages) break;
  }

  return variants;
}

async function fetchVariants(make: string, model?: string): Promise<ApiVariant[]> {
  if (!model) {
    const cacheKey = `variants:${slugify(make)}:*`;
    const cached = readCache<ApiVariant[]>(cacheKey);
    if (cached) return cached;

    const variants = await fetchVariantPages({ make: slugify(make) }, MAX_MAKE_PAGES);
    writeCache(cacheKey, variants, VARIANTS_TTL_MS);
    return variants;
  }

  const cacheKey = `variants:${slugify(make)}:${slugify(model)}`;
  const cached = readCache<ApiVariant[]>(cacheKey);
  if (cached) return cached;

  // The docs only say "model", so try every shape the site itself uses:
  //   a110            model slug            (/alpine/a110/...)
  //   A110            display name          (as returned in variant.model)
  //   alpine-a110     make+model slug       (/api/download/model/alpine-a110)
  const queries = [
    ...new Set([slugify(model), model.trim(), `${slugify(make)}-${slugify(model)}`]),
  ];

  for (const query of queries) {
    const variants = await fetchVariantPages({ make: slugify(make), model: query }, MAX_MODEL_PAGES);
    if (variants.length) {
      console.warn(
        `[vehicle-catalogue] ${make} ${model}: model filter "${query}" returned ${variants.length} variants`,
      );
      writeCache(cacheKey, variants, VARIANTS_TTL_MS);
      return variants;
    }
    console.warn(`[vehicle-catalogue] ${make} ${model}: model filter "${query}" returned 0`);
  }

  // Neither filter variant worked. Fall back to the make level list - the same
  // data the model dropdown was built from - so a model can never be offered
  // and then have no variants.
  const all = await fetchVariants(make);
  const fallback = all.filter((variant) => sameModel(variant.model, model));

  if (!fallback.length) {
    console.warn(
      `[vehicle-catalogue] no variants for "${make} ${model}" (${all.length} variants for the make)`,
    );
  }

  writeCache(cacheKey, fallback, VARIANTS_TTL_MS);
  return fallback;
}

const toVariant = (raw: ApiVariant, type: VehicleType): VehicleVariant | null => {
  // Most records carry a name ("1.8 Turbo S"); fall back to the slug rather than
  // dropping the variant, which would show the customer an empty dropdown.
  const label = raw.name?.trim() || raw.slug?.trim();
  if (!label) return null;

  const yearFrom = Number(raw.yearFrom) || 0;
  // `yearTo: null` means "still in production".
  const yearTo = Number(raw.yearTo) || (yearFrom ? new Date().getFullYear() : 0);
  const fuelKey = (raw.engineFuelType || "").toUpperCase();

  return {
    id: raw.slug?.trim() || raw.id || slugify(`${label}-${yearFrom}`),
    label,
    make: raw.make?.trim() || "",
    model: raw.model?.trim() || "",
    trim: label,
    engineLabel: "",
    engineCapacity:
      Number(raw.engineCapacityCc) || Number(raw.engineDisplacementCc) || parseEngineCc(label),
    fuel: API_FUEL[fuelKey] ?? "",
    yearFrom,
    yearTo,
    year: yearTo,
    vehicleType: type,
  };
};

/**
 * Returns the next step from cardata.wiki, or `null` when the API is not
 * configured or cannot answer.
 */
export async function getCardataNext(
  type: VehicleType,
  selection: CatalogSelection,
): Promise<CatalogNext | null> {
  if (!isCatalogConfigured()) return null;

  const make = selection.make?.trim();
  const model = selection.model?.trim();

  try {
    if (!make) {
      const makes = await fetchMakes();
      if (!makes.length) return null;

      // Vans: the API has no vehicle-type flag, so only offer makes that build
      // them. Cars: every make the API knows.
      const relevant = type === "van" ? makes.filter(isVanMake) : makes;
      const options: CatalogOption[] = relevant.map((name) => ({ value: name, label: name }));
      return { step: { key: "make", label: "Make", placeholder: "Select make" }, options };
    }

    if (!model) {
      const variants = await fetchVariants(make);
      const models = [
        ...new Set(variants.map((variant) => variant.model?.trim()).filter(Boolean) as string[]),
      ];

      models.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

      // Empty (rather than null) when the API answered but lists no models, so
      // the route reports "no model found" instead of "service unavailable".
      return {
        step: { key: "model", label: "Model", placeholder: "Select model" },
        options: models.map((name) => ({ value: name, label: name })),
      };
    }

    const rawVariants = await fetchVariants(make, model);
    const variants = rawVariants
      .map((raw) => toVariant(raw, type))
      .filter((variant): variant is VehicleVariant => Boolean(variant));

    if (!variants.length) {
      if (rawVariants.length) {
        console.warn(
          `[vehicle-catalogue] ${rawVariants.length} variants for ${make} ${model} but none could be mapped; first record: ${JSON.stringify(rawVariants[0]).slice(0, 300)}`,
        );
      }
      return {
        step: { key: "variant", label: "Variant", placeholder: "Select variant" },
        options: [],
      };
    }

    const step = { key: "variant", label: "Variant", placeholder: "Select variant" } as const;
    const options: CatalogOption[] = variants.map((variant) => ({
      value: variant.id,
      label:
        variant.yearFrom && variant.yearTo && variant.yearFrom !== variant.yearTo
          ? `${variant.label} · ${variant.yearFrom}-${variant.yearTo}`
          : variant.label,
    }));

    if (!selection.variant) return { step, options };

    const vehicle = variants.find((variant) => variant.id === selection.variant) ?? null;
    if (!vehicle) return { step, options };

    return { step: null, options: [], vehicle };
  } catch (error) {
    console.warn(
      `[vehicle-catalogue] cardata.wiki request failed: ${
        error instanceof Error ? error.message : error
      }`,
    );
    return null;
  }
}

export const cardataProvider: CatalogProvider = {
  id: "cardata",
  supportsVehicleType: true,
  getNext: getCardataNext,
};