import { pool } from "@/db";
import { TABLE_CONFIGS, TABLE_KEYS } from "@/lib/table-config";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PeriodRow {
  id: string;
  label: string;
  name: string;
  last_synced_at: string | null;
}

interface TableCount {
  table_name: string;
  count: string;
}

interface PeriodTableCount {
  period_id: string;
  table_key: string;
  count: string;
}

export default async function Home() {
  const allPeriods = await pool.query<PeriodRow>(
    "SELECT id, label, name, last_synced_at FROM periods ORDER BY id"
  );

  const lastSyncResult = await pool.query<{ last_sync: string | null }>(
    "SELECT MAX(last_synced_at)::text AS last_sync FROM periods"
  );
  const lastSync = lastSyncResult.rows[0]?.last_sync ?? null;

  const periodTableCounts = await pool.query<PeriodTableCount>(`
    SELECT period_id, 'actividades' as table_key, COUNT(*)::text as count FROM actividades GROUP BY period_id
    UNION ALL SELECT period_id, 'destinos', COUNT(*)::text FROM destinos GROUP BY period_id
    UNION ALL SELECT period_id, 'materiales', COUNT(*)::text FROM materiales GROUP BY period_id
    UNION ALL SELECT period_id, 'salidaMateriales', COUNT(*)::text FROM salida_materiales GROUP BY period_id
    UNION ALL SELECT period_id, 'combustibles', COUNT(*)::text FROM combustibles GROUP BY period_id
    UNION ALL SELECT period_id, 'despachosCombustible', COUNT(*)::text FROM despachos_combustible GROUP BY period_id
    UNION ALL SELECT period_id, 'usoMaquinaria', COUNT(*)::text FROM uso_maquinaria GROUP BY period_id
  `);

  // Map: periodId → { tableKey → count }
  const periodCountMap: Record<string, Record<string, number>> = {};
  for (const row of periodTableCounts.rows) {
    if (!periodCountMap[row.period_id]) periodCountMap[row.period_id] = {};
    periodCountMap[row.period_id][row.table_key] = parseInt(row.count);
  }

  const tableCounts = await pool.query<TableCount>(`
    SELECT 'actividades' as table_name, COUNT(*)::text as count FROM actividades
    UNION ALL SELECT 'destinos', COUNT(*)::text FROM destinos
    UNION ALL SELECT 'materiales', COUNT(*)::text FROM materiales
    UNION ALL SELECT 'salida_materiales', COUNT(*)::text FROM salida_materiales
    UNION ALL SELECT 'combustibles', COUNT(*)::text FROM combustibles
    UNION ALL SELECT 'despachos_combustible', COUNT(*)::text FROM despachos_combustible
    UNION ALL SELECT 'uso_maquinaria', COUNT(*)::text FROM uso_maquinaria
  `);

  const countMap: Record<string, number> = {};
  let totalRecords = 0;
  for (const row of tableCounts.rows) {
    countMap[row.table_name] = parseInt(row.count);
    totalRecords += parseInt(row.count);
  }

  return (
    <main className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Resumen General</h1>
        <p className="text-sm text-gray-500 mt-1">
          {allPeriods.rows.length} períodos · {totalRecords.toLocaleString()} registros consolidados
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <SummaryCard
          label="Total Registros"
          value={totalRecords.toLocaleString()}
          accent="bg-brand-500"
        />
        <SummaryCard
          label="Períodos"
          value={String(allPeriods.rows.length)}
          accent="bg-blue-500"
        />
        <SummaryCard
          label="Tablas"
          value="7"
          accent="bg-amber-500"
        />
        <SummaryCard
          label="Último Sync"
          value={formatSyncDate(lastSync)}
          accent="bg-purple-500"
        />
      </div>

      {/* Period cards */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Períodos</h2>
      <div className="grid grid-cols-2 gap-4 mb-10">
        {allPeriods.rows.map((p) => (
          <PeriodCard key={p.id} period={p} counts={periodCountMap[p.id] ?? {}} />
        ))}
      </div>

      {/* Table overview */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Tablas</h2>
      <div className="grid grid-cols-3 gap-4">
        {TABLE_KEYS.map((key) => {
          const cfg = TABLE_CONFIGS[key];
          const count = countMap[cfg.dbTable] ?? 0;
          return (
            <Link
              key={key}
              href={`/tabla/${key}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-brand-300 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{cfg.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                    {cfg.name}
                  </p>
                  <p className="text-xs text-gray-400">{cfg.columns.length} columnas</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {count.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">registros</p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${accent}`} />
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function PeriodCard({ period, counts }: { period: PeriodRow; counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">{period.name}</p>
          <p className="text-xs text-gray-400">Período: {period.label}</p>
        </div>
        <span className="text-sm font-mono font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
          {total.toLocaleString()}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {Object.entries(counts).map(([key, count]) => {
          const cfg = TABLE_CONFIGS[key];
          return (
            <div key={key} className="text-center bg-gray-50 rounded-lg py-1.5 px-1">
              <p className="font-semibold text-gray-700">{typeof count === "number" && count >= 0 ? count.toLocaleString() : "—"}</p>
              <p className="text-gray-400 truncate">{cfg?.name?.split(" ")[0] ?? key}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatSyncDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-GT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}
