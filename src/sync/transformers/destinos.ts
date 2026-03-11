import type { AirtableRecord } from "../airtable-client";
import { extractSelectName, toNumeric } from "./utils";

export function transformDestino(record: AirtableRecord, periodId: string) {
  const f = record.fields;
  return {
    periodId,
    airtableId: record.id,
    idDestino: (f["fld3UGDEy1qNjlres"] as string) ?? null,
    tipo: extractSelectName(f["fldjTloVmEmGIRWbi"]),
    costoTotal: toNumeric(f["fldRm9fOcs5yl2Gc8"]),
    costoMateriales: toNumeric(f["fldJsqPRK9gl7UwEK"]),
    costoMod: toNumeric(f["fldFVgjPexDrlJgQk"]),
    costoMoi: toNumeric(f["fldz7BcdgODPD2c2Q"]),
    costoMaquinaria: toNumeric(f["fldbw28FSmqc7VTHC"]),
    estatus: (f["fldYrVw9cs4QTomWP"] as string) ?? null,
    descripcion: (f["fld896yC1zuB0KfFM"] as string) ?? null,
  };
}
