import type { AirtableRecord } from "../airtable-client";
import { extractSelectName, toNumeric } from "./utils";

export function transformCombustible(
  record: AirtableRecord,
  periodId: string
) {
  const f = record.fields;
  return {
    periodId,
    airtableId: record.id,
    idCombustible: (f["fldXUvhIKBDPJ1kC7"] as string) ?? null,
    disponible: toNumeric(f["fldCaCnk8naNEPz6U"]),
    unidadMedida: extractSelectName(f["fldvgWfVu9IgVAvNx"]),
    precioPromPonderado: toNumeric(f["fldhi8V5CJk9topnW"]),
    totalComprado: toNumeric(f["fldx4wGUrTyQGq6kl"]),
    totalUtilizado: toNumeric(f["fld7yJNKlijeWVehD"]),
    totalComprasQ: toNumeric(f["fldyiLlyeaRhQuvnb"]),
  };
}
