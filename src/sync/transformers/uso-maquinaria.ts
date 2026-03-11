import type { AirtableRecord } from "../airtable-client";
import { extractFirstLookup, toNumeric } from "./utils";

/**
 * Parse "ID_USO_MAQUINARIA" formula: "D/M/YYYY-MachineName-UseNumber"
 * Example: "29/9/2025-Vibrador Joper 6.5 hp - Horas-5225"
 */
function parseMaquinariaName(formula: unknown): string | null {
  if (typeof formula !== "string") return null;
  const firstDash = formula.indexOf("-");
  if (firstDash < 0) return null;
  const afterDate = formula.slice(firstDash + 1);
  const lastDash = afterDate.lastIndexOf("-");
  if (lastDash < 0) return afterDate.trim();
  return afterDate.slice(0, lastDash).trim() || null;
}

export function transformUsoMaquinaria(
  record: AirtableRecord,
  periodId: string
) {
  const f = record.fields;
  return {
    periodId,
    airtableId: record.id,
    numUso: f["flddw8zg0LGzw7Qxj"] as number | null,
    cantidadHrKm: toNumeric(f["fldAdUsfrVP3LnuuG"]),
    fechaUso: (f["fldUx0OuuEBtviONl"] as string) ?? null,
    costoUso: toNumeric(f["fldsEHSmhUSVKmeqy"]),
    maquinariaNombre: parseMaquinariaName(f["fld2Byq1r5TzNhSbF"]),
    generadorCosto: toNumeric(f["fldYVJlRPChP0yw19"]),
    destino: extractFirstLookup(f["fldTJsdHROMcMFNvY"]),
  };
}
