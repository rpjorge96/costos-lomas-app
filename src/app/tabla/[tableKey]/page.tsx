import { TABLE_CONFIGS } from "@/lib/table-config";
import { pool } from "@/db";
import { notFound } from "next/navigation";
import { TableViewer } from "./table-viewer";
import { DestinosGrouped } from "./destinos-grouped";

export const dynamic = "force-dynamic";

interface PeriodOption {
  id: string;
  label: string;
}

export default async function TablaPage({
  params,
}: {
  params: Promise<{ tableKey: string }>;
}) {
  const { tableKey } = await params;
  const config = TABLE_CONFIGS[tableKey];
  if (!config) notFound();

  const periodsResult = await pool.query<PeriodOption>(
    "SELECT id, label FROM periods ORDER BY id"
  );

  const isDestinos = tableKey === "destinos";

  return (
    <main className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{config.name}</h1>
            <p className="text-sm text-gray-500">
              {isDestinos
                ? "Vista agrupada · Costos por período"
                : `${config.columns.length} columnas · Todos los períodos`}
            </p>
          </div>
        </div>
      </div>

      {isDestinos ? (
        <DestinosGrouped />
      ) : (
        <TableViewer
          tableKey={tableKey}
          columns={config.columns}
          periods={periodsResult.rows}
        />
      )}
    </main>
  );
}
