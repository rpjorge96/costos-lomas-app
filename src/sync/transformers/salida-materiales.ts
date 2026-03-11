import type { AirtableRecord } from "../airtable-client";
import { extractFirstLookup, toNumeric } from "./utils";

export function transformSalidaMaterial(
  record: AirtableRecord,
  periodId: string
) {
  const f = record.fields;
  return {
    periodId,
    airtableId: record.id,
    numUso: f["fldrwZUJ33RDUzDAf"] as number | null,
    materialNombre: extractFirstLookup(f["fldrr9GGrMQ309tNA"]),
    cantidadEnviada: toNumeric(f["fld9BqGI1xhHaqYSc"]),
    costoMaterial: toNumeric(f["fldVGGF4rB2e9Dqo0"]),
    fechaSalida: (f["fldrqy3jQa8GQRHhb"] as string) ?? null,
    destinoSubdestinos: extractFirstLookup(f["fldOfByZZrAhUgS0W"]),
    unidadMedida: extractFirstLookup(f["fldsfTBWiKAAH5B8z"]),
    numActividad: extractFirstLookup(f["fldymYwQg5iHAaeKb"]),
  };
}
