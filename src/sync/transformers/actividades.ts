import type { AirtableRecord } from "../airtable-client";
import { extractSelectName, toNumeric } from "./utils";

export function transformActividad(record: AirtableRecord, periodId: string) {
  const f = record.fields;
  return {
    periodId,
    airtableId: record.id,
    numActividad: f["fldgF4UKI4ECmIMwp"] as number | null,
    fechaActividad: (f["fldhgcxLXNAvKuGM2"] as string) ?? null,
    unidadCosto: extractSelectName(f["fld8wkJbEactlmPsF"]),
    duracion: toNumeric(f["fldcI8jhajvx3ee8q"]),
    actividad: (f["fldGak9UH16Rb5eaZ"] as string) ?? null,
    costoTotal: toNumeric(f["fldrkYMlDiz8UnuaQ"]),
    mod: toNumeric(f["flde91EtNmxy6bo5j"]),
    moi: toNumeric(f["fldDSbDRC2FbrJ4rP"]),
    costoMateriales: toNumeric(f["fldcAZHvNlPo3zsUW"]),
    maquinariaCosto: toNumeric(f["fldyUMs7FEOXtiHSo"]),
    destinoSubdestinos: (f["fldCgH5RXH43aIHnD"] as string) ?? null,
    subdestino: (f["fldTwPgdaaMTBy2fs"] as string) ?? null,
  };
}
