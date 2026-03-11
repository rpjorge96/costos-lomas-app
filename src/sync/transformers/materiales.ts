import type { AirtableRecord } from "../airtable-client";
import { extractSelectName, toNumeric } from "./utils";

export function transformMaterial(record: AirtableRecord, periodId: string) {
  const f = record.fields;
  return {
    periodId,
    airtableId: record.id,
    idMateriales: (f["fldN6tvSBYB2cX9ao"] as string) ?? null,
    unidadMedida: extractSelectName(f["fld2HlZprHJSLGJVW"]),
    precioPromPonderado: toNumeric(f["fldGcji3923FNP11a"]),
    disponibleCentral: toNumeric(f["fld4Veo3NaYfzPYQM"]),
    totalComprasQ: toNumeric(f["fld0ysJFZZ7f1D78m"]),
    totalIngresos: toNumeric(f["fldWnttBlUAKMs3KM"]),
    totalSalidas: toNumeric(f["fldRutMFRyLNARmOl"]),
  };
}
