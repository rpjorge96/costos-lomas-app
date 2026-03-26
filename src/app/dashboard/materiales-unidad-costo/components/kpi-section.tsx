"use client";

import type { DashboardKPIs } from "../types";
import { fmtQ, fmtNum } from "../constants";
import { KpiCard } from "@/app/dashboard/costos-destino/components/shared/kpi-card";

interface Props {
  kpis: DashboardKPIs;
}

export function KpiSection({ kpis }: Props) {
  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-4 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">{kpis.destino}</p>
            <p className="text-xs font-medium text-white/70">
              {[kpis.tipo, kpis.descripcion].filter(Boolean).join(" · ") || "Sin clasificación"}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Costo Materiales"
          value={fmtQ(kpis.costoMaterialesTotal)}
          color="bg-emerald-50 text-emerald-900"
          accentColor="bg-emerald-500"
        />
        <KpiCard
          label="Unidades de Costo"
          value={fmtNum(kpis.numUnidadesCosto)}
          color="bg-purple-50 text-purple-900"
          accentColor="bg-purple-500"
        />
        <KpiCard
          label="Materiales Distintos"
          value={fmtNum(kpis.numMaterialesDistintos)}
          color="bg-amber-50 text-amber-900"
          accentColor="bg-amber-500"
        />
        <KpiCard
          label="Total Salidas"
          value={fmtNum(kpis.numSalidasTotal)}
          color="bg-cyan-50 text-cyan-900"
          accentColor="bg-cyan-500"
        />
        <KpiCard
          label="Material Top"
          value={kpis.materialMasCostoso?.nombre ?? "—"}
          sub={kpis.materialMasCostoso ? fmtQ(kpis.materialMasCostoso.costo) : undefined}
          color="bg-orange-50 text-orange-900"
          accentColor="bg-orange-500"
        />
        <KpiCard
          label="UC Mayor Costo"
          value={kpis.ucConMasMateriales?.nombre ?? "—"}
          sub={kpis.ucConMasMateriales ? fmtQ(kpis.ucConMasMateriales.costo) : undefined}
          color="bg-blue-50 text-blue-900"
          accentColor="bg-blue-500"
        />
      </div>
    </div>
  );
}
