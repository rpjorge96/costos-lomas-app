import { config } from "dotenv";
config({ path: ".env.local" });
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "../db/schema";
import { PERIODS, TABLES, type TableKey } from "./config";
import { syncTable } from "./sync-table";
import { fetchAllRecords } from "./airtable-client";

const ALL_TABLE_KEYS = Object.keys(TABLES) as TableKey[];

function parseArgs() {
  const args = process.argv.slice(2);
  let periodIds: string[] | null = null;
  let tableKeys: TableKey[] | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--periods" && args[i + 1]) {
      periodIds = args[i + 1].split(",").map((s) => s.trim());
      i++;
    }
    if (args[i] === "--tables" && args[i + 1]) {
      tableKeys = args[i + 1].split(",").map((s) => s.trim()) as TableKey[];
      i++;
    }
  }

  return { periodIds, tableKeys };
}

async function ensurePeriods(db: ReturnType<typeof drizzle>) {
  for (const period of PERIODS) {
    await db.execute(sql`
      INSERT INTO periods (id, base_id, label, name)
      VALUES (${period.id}, ${period.baseId}, ${period.label}, ${period.name})
      ON CONFLICT (id) DO UPDATE SET
        base_id = EXCLUDED.base_id,
        label = EXCLUDED.label,
        name = EXCLUDED.name
    `);
  }
}

async function main() {
  const startTime = Date.now();
  const { periodIds, tableKeys } = parseArgs();

  const selectedPeriods = periodIds
    ? PERIODS.filter((p) => periodIds.includes(p.id))
    : PERIODS;

  const selectedTables = tableKeys ?? ALL_TABLE_KEYS;

  // Validate inputs
  if (periodIds) {
    const invalid = periodIds.filter(
      (id) => !PERIODS.find((p) => p.id === id)
    );
    if (invalid.length > 0) {
      console.error(`Unknown period IDs: ${invalid.join(", ")}`);
      console.error(
        `Available: ${PERIODS.map((p) => p.id).join(", ")}`
      );
      process.exit(1);
    }
  }

  if (tableKeys) {
    const invalid = tableKeys.filter(
      (k) => !ALL_TABLE_KEYS.includes(k)
    );
    if (invalid.length > 0) {
      console.error(`Unknown table keys: ${invalid.join(", ")}`);
      console.error(`Available: ${ALL_TABLE_KEYS.join(", ")}`);
      process.exit(1);
    }
  }

  console.log("=== Costos Lomas - Airtable Sync ===\n");
  console.log(
    `Periods: ${selectedPeriods.map((p) => p.label).join(", ")}`
  );
  console.log(
    `Tables:  ${selectedTables.map((k) => TABLES[k].name).join(", ")}`
  );
  console.log("");

  // Connect to database
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    // Ensure periods exist
    await ensurePeriods(db);

    // Sync each period in parallel, tables sequentially within each period
    const results: Record<string, Record<string, number>> = {};

    await Promise.all(
      selectedPeriods.map(async (period) => {
        results[period.id] = {};
        console.log(`[${period.label}] Starting sync...`);

        for (const tableKey of selectedTables) {
          const tableName = TABLES[tableKey].name;
          process.stdout.write(
            `  [${period.label}] ${tableName}... `
          );

          try {
            const count = await syncTable(
              db as any,
              tableKey,
              period.baseId,
              period.id
            );
            results[period.id][tableKey] = count;
            console.log(`${count} records`);
          } catch (err) {
            console.error(
              `ERROR: ${err instanceof Error ? err.message : err}`
            );
            results[period.id][tableKey] = -1;
          }
        }

        // Update last_synced_at
        await db.execute(sql`
          UPDATE periods SET
            last_synced_at = NOW(),
            record_counts = ${JSON.stringify(results[period.id])}::jsonb
          WHERE id = ${period.id}
        `);

        console.log(`[${period.label}] Done.\n`);
      })
    );

    // Post-sync: resolve linked record IDs to names
    console.log("Resolving linked records...");

    // Resolve material names in salida_materiales via JOIN with materiales
    await db.execute(sql`
      UPDATE salida_materiales s
      SET material_nombre = m.id_materiales
      FROM materiales m
      WHERE s.material_nombre = m.airtable_id
        AND s.period_id = m.period_id
        AND s.material_nombre LIKE 'rec%'
    `);
    console.log("  salida_materiales.material_nombre resolved");

    // Resolve combustible names in despachos_combustible via JOIN with combustibles
    await db.execute(sql`
      UPDATE despachos_combustible d
      SET combustible_nombre = c.id_combustible
      FROM combustibles c
      WHERE d.combustible_nombre = c.airtable_id
        AND d.period_id = c.period_id
        AND d.combustible_nombre LIKE 'rec%'
    `);
    console.log("  despachos_combustible.combustible_nombre resolved");

    // Resolve maquinaria names in despachos_combustible
    // Maquinaria table (tblXbRQrvxiFBkfkT) isn't synced, so fetch names from Airtable
    const MAQUINARIA_TABLE_ID = "tblXbRQrvxiFBkfkT";
    const MAQUINARIA_NAME_FIELD = "fldA8CExwJGJEggX3"; // ID_MAQUINARIA (name field)

    // Find which periods have unresolved maquinaria names
    const unresolvedResult = await pool.query(
      "SELECT DISTINCT period_id FROM despachos_combustible WHERE maquinaria_nombre LIKE 'rec%'"
    );
    const unresolvedPeriods = unresolvedResult.rows.map(
      (r: { period_id: string }) => r.period_id
    );

    if (unresolvedPeriods.length > 0) {
      console.log(
        `  Fetching maquinaria names for periods: ${unresolvedPeriods.join(", ")}...`
      );

      for (const periodId of unresolvedPeriods) {
        const period = PERIODS.find((p) => p.id === periodId);
        if (!period) continue;

        // Fetch maquinaria table from this base (only the name field)
        const maqRecords = await fetchAllRecords(
          period.baseId,
          MAQUINARIA_TABLE_ID,
          [MAQUINARIA_NAME_FIELD]
        );

        // Build a map: airtable_id -> name
        for (const rec of maqRecords) {
          const name = rec.fields[MAQUINARIA_NAME_FIELD] as string | undefined;
          if (name) {
            await pool.query(
              "UPDATE despachos_combustible SET maquinaria_nombre = $1 WHERE maquinaria_nombre = $2 AND period_id = $3",
              [name, rec.id, periodId]
            );
          }
        }
        console.log(
          `    [${period.label}] ${maqRecords.length} maquinaria records fetched`
        );
      }
      console.log("  despachos_combustible.maquinaria_nombre resolved");
    }

    // Print summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("=== Sync Summary ===\n");
    console.log(
      "Period".padEnd(15) +
        selectedTables
          .map((k) => TABLES[k].name.slice(0, 12).padEnd(14))
          .join("")
    );
    console.log("-".repeat(15 + selectedTables.length * 14));

    for (const period of selectedPeriods) {
      const row = period.label.padEnd(15);
      const counts = selectedTables
        .map((k) => {
          const c = results[period.id]?.[k];
          if (c === undefined) return "skip".padEnd(14);
          if (c === -1) return "ERROR".padEnd(14);
          return String(c).padEnd(14);
        })
        .join("");
      console.log(row + counts);
    }

    console.log(`\nCompleted in ${elapsed}s`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
