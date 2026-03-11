import type { AirtableRecord } from "../airtable-client";
import { extractFirstLookup, toNumeric } from "./utils";

/**
 * Parse "Resumen despacho" formula: "DD/MM/YY | CombustibleName | Cantidad:N | MaquinariaName\n"
 */
function parseResumen(resumen: unknown): { combustible: string | null; maquinaria: string | null } {
  if (typeof resumen !== "string") return { combustible: null, maquinaria: null };
  const parts = resumen.split("|").map((s) => s.trim());
  return {
    combustible: parts[1] || null,
    maquinaria: (parts[3] || "").replace(/\n/g, "").trim() || null,
  };
}

/**
 * Extract the first record ID from a linked record field (array of record IDs).
 */
function extractFirstRecordId(value: unknown): string | null {
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return null;
}

export function transformDespacho(record: AirtableRecord, periodId: string) {
  const f = record.fields;
  const resumen = parseResumen(f["fldkSnK5zNoXTuMeH"]);

  // Use Resumen formula if available (newer bases), otherwise fall back to linked record IDs
  // Linked record IDs (rec...) will be resolved post-sync via JOINs
  const combustibleNombre = resumen.combustible
    ?? extractFirstRecordId(f["fldSOIjoxoXqqdytI"]);
  const maquinariaNombre = resumen.maquinaria
    ?? extractFirstRecordId(f["fld8o0itkDKgwXbwR"]);

  return {
    periodId,
    airtableId: record.id,
    numDespacho: f["fldl0YhgTeAiA4uko"] as number | null,
    fechaDespacho: (f["fldUd3qj4K3TgCfIT"] as string) ?? null,
    cantidadDespachada: toNumeric(f["fldclrgDkJx3bxElm"]),
    costoDespacho: toNumeric(f["fldxrYVQzeb0hJAfO"]),
    observaciones: (f["fldix43WsFQDIEG1E"] as string) ?? null,
    hrKm: toNumeric(f["fldlQuQBkWi8qVYkQ"]),
    combustibleNombre,
    maquinariaNombre,
  };
}
