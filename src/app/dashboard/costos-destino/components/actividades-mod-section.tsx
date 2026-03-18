"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ActividadesData, ActividadRow } from "../types";
import { COLORS, fmtQ, fmtPct } from "../constants";
import { SectionWrapper } from "./shared/section-wrapper";

interface Props {
  data: ActividadesData | null;
  unidadesCosto: string[];
}

function CostTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-gray-900">{label}</p>
      {payload.map((p: any) => (
        <p
          key={p.dataKey}
          style={{ color: p.color }}
          className="flex justify-between gap-4"
        >
          <span>{p.name}</span>
          <span className="font-mono font-semibold">{fmtQ(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function ActividadesTable({ rows }: { rows: ActividadRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <th className="px-3 py-2 text-left">UC</th>
            <th className="px-3 py-2 text-left">Actividad</th>
            <th className="px-3 py-2 text-left">Fecha</th>
            <th className="px-3 py-2 text-right">MOD</th>
            <th className="px-3 py-2 text-right">MOI</th>
            <th className="px-3 py-2 text-right">Mat.</th>
            <th className="px-3 py-2 text-right">Maq.</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2 text-right">% MOD</th>
            <th className="px-3 py-2 text-right">Dur.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={`${r.numActividad}-${i}`}
              className="border-b border-gray-100 transition-colors hover:bg-gray-50"
            >
              <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[140px] truncate" title={r.unidadCosto}>
                {r.unidadCosto}
              </td>
              <td className="px-3 py-1.5 font-medium text-gray-900 max-w-[200px] truncate" title={r.actividad}>
                {r.actividad}
              </td>
              <td className="px-3 py-1.5 text-xs text-gray-500">
                {r.fechaActividad
                  ? new Date(r.fechaActividad).toLocaleDateString("es-GT")
                  : "—"}
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-blue-600">
                {fmtQ(r.costoMod)}
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-violet-600">
                {fmtQ(r.costoMoi)}
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-amber-600">
                {fmtQ(r.costoMateriales)}
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-red-600">
                {fmtQ(r.costoMaquinaria)}
              </td>
              <td className="px-3 py-1.5 text-right font-mono font-semibold text-gray-900">
                {fmtQ(r.costoTotal)}
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-blue-500">
                {fmtPct(r.pctMod)}
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-gray-600">
                {r.duracion.toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ActividadesModSection({ data, unidadesCosto }: Props) {
  const [tab, setTab] = useState<"tabla" | "top10mod" | "top10total" | "chart">(
    "tabla"
  );
  const [ucFilter, setUcFilter] = useState("");

  const filteredActividades = useMemo(() => {
    if (!data) return [];
    return ucFilter
      ? data.actividades.filter((a) => a.unidadCosto === ucFilter)
      : data.actividades;
  }, [data, ucFilter]);

  if (!data) {
    return (
      <SectionWrapper title="Actividades y Análisis de MOD">
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      </SectionWrapper>
    );
  }

  const chartData = [...filteredActividades]
    .sort((a, b) => b.costoMod - a.costoMod)
    .slice(0, 20)
    .map((r) => ({
      name:
        r.actividad.length > 30
          ? r.actividad.slice(0, 29) + "…"
          : r.actividad,
      MOD: r.costoMod,
    }));

  const tabs = [
    { key: "tabla", label: "Tabla Completa" },
    { key: "top10mod", label: "Top 10 MOD" },
    { key: "top10total", label: "Top 10 Total" },
    { key: "chart", label: "Barras MOD" },
  ] as const;

  return (
    <SectionWrapper
      title="Actividades y Análisis de MOD"
      subtitle={`${data.actividades.length} actividades`}
      actions={
        <select
          value={ucFilter}
          onChange={(e) => setUcFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
        >
          <option value="">Todas las UC</option>
          {unidadesCosto.map((uc, i) => (
            <option key={`uc-${i}`} value={uc}>
              {uc}
            </option>
          ))}
        </select>
      }
    >
      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "tabla" && <ActividadesTable rows={filteredActividades} />}

      {tab === "top10mod" && <ActividadesTable rows={data.top10Mod} />}

      {tab === "top10total" && <ActividadesTable rows={data.top10Total} />}

      {tab === "chart" && chartData.length > 0 && (
        <ResponsiveContainer
          width="100%"
          height={Math.max(300, chartData.length * 30)}
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              tickFormatter={(v) => fmtQ(v)}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={220}
              tick={{ fontSize: 10 }}
            />
            <Tooltip content={<CostTooltip />} />
            <Bar
              dataKey="MOD"
              fill={COLORS.mod}
              name="MOD"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </SectionWrapper>
  );
}
