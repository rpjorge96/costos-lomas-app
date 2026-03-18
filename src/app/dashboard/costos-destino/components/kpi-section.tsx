import type { DestinoKPIs } from "../types";
import { fmtQ, fmtPct, KEY_MATERIALS } from "../constants";
import { KpiCard } from "./shared/kpi-card";

interface Props {
  kpis: DestinoKPIs;
}

export function KpiSection({ kpis }: Props) {
  const matTotal = kpis.costoMateriales;
  const costoTotal = kpis.costoTotal;

  const keyMatData = [
    { label: "Cemento", costo: kpis.costoCemento },
    { label: "Arena", costo: kpis.costoArena },
    { label: "Piedrín", costo: kpis.costoPiedrin },
    { label: "Hierro", costo: kpis.costoHierro },
    { label: "Block", costo: kpis.costoBlock },
  ];

  return (
    <div className="space-y-3">
      {/* Destino header */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-lg font-bold text-brand-800">{kpis.destino}</h2>
          {kpis.tipo && (
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              {kpis.tipo}
            </span>
          )}
          {kpis.descripcion && (
            <span className="text-sm text-brand-600">{kpis.descripcion}</span>
          )}
        </div>
      </div>

      {/* Row 1: Main KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <KpiCard
          label="Costo Total"
          value={fmtQ(kpis.costoTotal)}
          color="bg-emerald-50 text-emerald-700"
        />
        <KpiCard
          label="MOD"
          value={fmtQ(kpis.costoMod)}
          sub={fmtPct(kpis.pctMod)}
          color="bg-blue-50 text-blue-700"
        />
        <KpiCard
          label="MOI"
          value={fmtQ(kpis.costoMoi)}
          sub={fmtPct(kpis.pctMoi)}
          color="bg-violet-50 text-violet-700"
        />
        <KpiCard
          label="Materiales"
          value={fmtQ(kpis.costoMateriales)}
          sub={fmtPct(kpis.pctMateriales)}
          color="bg-amber-50 text-amber-700"
        />
        <KpiCard
          label="Maquinaria"
          value={fmtQ(kpis.costoMaquinaria)}
          sub={fmtPct(kpis.pctMaquinaria)}
          color="bg-red-50 text-red-700"
        />
        <KpiCard
          label="Unidades Costo"
          value={kpis.numUnidadesCosto.toLocaleString()}
          color="bg-purple-50 text-purple-700"
        />
        <KpiCard
          label="Actividades"
          value={kpis.numActividades.toLocaleString()}
          sub={`${kpis.numActividadesConMod} con MOD`}
          color="bg-cyan-50 text-cyan-700"
        />
      </div>

      {/* Row 2: Key materials */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {keyMatData.map((m) => {
          const pctMat = matTotal > 0 ? (m.costo / matTotal) * 100 : 0;
          const pctTotal = costoTotal > 0 ? (m.costo / costoTotal) * 100 : 0;
          return (
            <KpiCard
              key={m.label}
              label={m.label}
              value={fmtQ(m.costo)}
              sub={`${fmtPct(pctMat)} mat · ${fmtPct(pctTotal)} total`}
              color="bg-gray-50 text-gray-700"
            />
          );
        })}
      </div>

      {/* Row 3: Additional KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="UC más cara"
          value={kpis.ucMasCara ? kpis.ucMasCara.nombre : "—"}
          sub={kpis.ucMasCara ? fmtQ(kpis.ucMasCara.costo) : undefined}
          color="bg-orange-50 text-orange-700"
        />
        <KpiCard
          label="Actividad más cara"
          value={
            kpis.actividadMasCara
              ? kpis.actividadMasCara.nombre.length > 25
                ? kpis.actividadMasCara.nombre.slice(0, 24) + "…"
                : kpis.actividadMasCara.nombre
              : "—"
          }
          sub={kpis.actividadMasCara ? fmtQ(kpis.actividadMasCara.costo) : undefined}
          color="bg-orange-50 text-orange-700"
        />
        <KpiCard
          label="Material más costoso"
          value={
            kpis.materialMasCostoso
              ? kpis.materialMasCostoso.nombre.length > 25
                ? kpis.materialMasCostoso.nombre.slice(0, 24) + "…"
                : kpis.materialMasCostoso.nombre
              : "—"
          }
          sub={kpis.materialMasCostoso ? fmtQ(kpis.materialMasCostoso.costo) : undefined}
          color="bg-orange-50 text-orange-700"
        />
        <KpiCard
          label="Prom. costo/actividad"
          value={fmtQ(kpis.promedioCostoActividad)}
          sub={`${kpis.numSalidasMateriales} salidas mat.`}
          color="bg-orange-50 text-orange-700"
        />
      </div>
    </div>
  );
}
