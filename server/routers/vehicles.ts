import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc.js";

type VpicResult = { Make_Name?: string; Model_Name?: string };
type VpicResponse = { Results?: VpicResult[] };
type VpicVinResult = { Make?: string; Model?: string; ModelYear?: string; Trim?: string; ErrorCode?: string; ErrorText?: string };

const VPIC_BASE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles";
let cachedMakes: string[] | null = null;
let makesCachedAt = 0;

export function normalizeVehicleOptions(results: VpicResult[], key: "Make_Name" | "Model_Name") {
  return Array.from(new Set(results.map(item => item[key]?.trim()).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b));
}

export function extractVinVehicle(result?: VpicVinResult) {
  const year = result?.ModelYear?.trim() ?? "";
  const make = result?.Make?.trim() ?? "";
  const model = result?.Model?.trim() ?? "";
  const trim = result?.Trim?.trim() || undefined;
  return { year, make, model, trim, decoded: Boolean(year && make && model) };
}

async function getMakes() {
  if (cachedMakes && Date.now() - makesCachedAt < 24 * 60 * 60 * 1000) return cachedMakes;
  const response = await fetch(`${VPIC_BASE_URL}/GetAllMakes?format=json`, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error("Vehicle catalog is temporarily unavailable.");
  const body = await response.json() as VpicResponse;
  cachedMakes = normalizeVehicleOptions(body.Results ?? [], "Make_Name");
  makesCachedAt = Date.now();
  return cachedMakes;
}

export const vehiclesRouter = router({
  makes: publicProcedure
    .input(z.object({ query: z.string().trim().min(2).max(60) }))
    .query(async ({ input }) => {
      const makes = await getMakes();
      const query = input.query.toLowerCase();
      return makes.filter(make => make.toLowerCase().includes(query)).slice(0, 30);
    }),
  models: publicProcedure
    .input(z.object({ year: z.string().regex(/^\d{4}$/), make: z.string().trim().min(1).max(100) }))
    .query(async ({ input }) => {
      const endpoint = `${VPIC_BASE_URL}/GetModelsForMakeYear/make/${encodeURIComponent(input.make)}/modelyear/${input.year}?format=json`;
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(8_000) });
      if (!response.ok) throw new Error("Vehicle catalog is temporarily unavailable.");
      const body = await response.json() as VpicResponse;
      return normalizeVehicleOptions(body.Results ?? [], "Model_Name").slice(0, 100);
    }),
  decodeVin: publicProcedure
    .input(z.object({ vin: z.string().trim().toUpperCase().regex(/^[A-HJ-NPR-Z0-9]{17}$/) }))
    .query(async ({ input }) => {
      const endpoint = `${VPIC_BASE_URL}/DecodeVinValuesExtended/${encodeURIComponent(input.vin)}?format=json`;
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(8_000) });
      if (!response.ok) throw new Error("VIN decoding is temporarily unavailable.");
      const body = await response.json() as { Results?: VpicVinResult[] };
      const vehicle = extractVinVehicle(body.Results?.[0]);
      if (!vehicle.decoded) throw new Error("We could not identify this VIN. You can enter vehicle details manually.");
      return { vin: input.vin, ...vehicle };
    }),
});
