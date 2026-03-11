import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { fetchAllRecords } from "./airtable-client";
import type { TableKey } from "./config";
import { TABLES, FIELD_IDS } from "./config";
import type * as schema from "../db/schema";

import { transformActividad } from "./transformers/actividades";
import { transformDestino } from "./transformers/destinos";
import { transformMaterial } from "./transformers/materiales";
import { transformSalidaMaterial } from "./transformers/salida-materiales";
import { transformCombustible } from "./transformers/combustibles";
import { transformDespacho } from "./transformers/despachos";
import { transformUsoMaquinaria } from "./transformers/uso-maquinaria";

type TransformFn = (
  record: { id: string; createdTime: string; fields: Record<string, unknown> },
  periodId: string
) => Record<string, unknown>;

const TRANSFORMERS: Record<TableKey, TransformFn> = {
  destinos: transformDestino,
  actividades: transformActividad,
  materiales: transformMaterial,
  salidaMateriales: transformSalidaMaterial,
  combustibles: transformCombustible,
  despachosCombustible: transformDespacho,
  usoMaquinaria: transformUsoMaquinaria,
};

const DB_TABLE_NAMES: Record<TableKey, string> = {
  destinos: "destinos",
  actividades: "actividades",
  materiales: "materiales",
  salidaMateriales: "salida_materiales",
  combustibles: "combustibles",
  despachosCombustible: "despachos_combustible",
  usoMaquinaria: "uso_maquinaria",
};

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Sync a single table from a single base/period into PostgreSQL.
 * Uses INSERT ... ON CONFLICT DO UPDATE to avoid duplicates.
 */
export async function syncTable(
  db: NodePgDatabase<typeof schema>,
  tableKey: TableKey,
  baseId: string,
  periodId: string
): Promise<number> {
  const transform = TRANSFORMERS[tableKey];
  const tableInfo = TABLES[tableKey];
  const fieldIds = FIELD_IDS[tableKey];
  const dbTableName = DB_TABLE_NAMES[tableKey];

  // 1. Fetch all records from Airtable
  const records = await fetchAllRecords(baseId, tableInfo.id, fieldIds);
  if (records.length === 0) return 0;

  // 2. Transform records
  const rows = records.map((r) => transform(r, periodId));

  // 3. Upsert in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const columns = Object.keys(batch[0]);
    const snakeColumns = columns.map(camelToSnake);

    const valueSets = batch.map((row) => {
      const vals = columns.map((col) => escapeValue(row[col]));
      return `(${vals.join(", ")})`;
    });

    const updateCols = snakeColumns
      .filter((c) => c !== "period_id" && c !== "airtable_id")
      .map((c) => `${c} = EXCLUDED.${c}`)
      .join(", ");

    const query = `
      INSERT INTO ${dbTableName} (${snakeColumns.join(", ")})
      VALUES ${valueSets.join(",\n")}
      ON CONFLICT (period_id, airtable_id) DO UPDATE SET ${updateCols}
    `;

    await db.execute(sql.raw(query));
  }

  return records.length;
}
