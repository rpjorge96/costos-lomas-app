"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { UnidadCostoRow } from "../types";
import { COLORS, fmtQ, fmtPct } from "../constants";
import { SectionWrapper } from "./shared/section-wrapper";

interface Props {
  unidadesCosto: UnidadCostoRow[];
}

function CostTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null;
  const fmt = mode === "percent" ? fmtPct : fmtQ;
  const total = payload.reduce((s: number, p: any) => s + (Number(p.value) || 0), 0);
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 text-xs shadow-xl min-w-[180px]">
      <p className="mb-2 font-bold text-gray-800 text-[11px] border-b border-gray-100 pb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-600">{p.name}</span>
          </span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>{fmt(p.value)}</span>
        </div>
      ))}
      <div className="mt-1.5 border-t border-gray-100 pt-1.5 flex justify-between gap-4 font-bold text-gray-900">
        <span>Total</span>
        <span className="font-mono">{fmt(total)}</span>
      </div>
    </div>
  );
}

// Custom legend
function ChartLegend() {
  const items = [
    { key: "MOD", color: COLORS.mod, label: "MOD" },
    { key: "MOI", color: COLORS.moi, label: "MOI" },
    { key: "Materiales", color: COLORS.materiales, label: "Materiales" },
    { key: "Maquinaria", color: COLORS.maquinaria, label: "Maquinaria" },
  ];
  return (
    <div className="flex flex-wrap gap-4 justify-center pt-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function leadingNumber(s: string): number {
  const m = s.match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : Infinity;
}

export function DesgloseUnidadChart({ unidadesCosto }: Props) {
  const [mode, setMode] = useState<"absolute" | "percent">("absolute");

  const sorted = [...unidadesCosto].sort((a, b) => {
    const na = leadingNumber(a.unidadCosto);
    const nb = leadingNumber(b.unidadCosto);
    if (na !== nb) return na - nb;
    return b.costoTotal - a.costoTotal;
  });

  const chartData = sorted.map((u) => {
    if (mode === "percent") {
      const total = u.costoTotal || 1;
      return {
        name: u.unidadCosto,
        MOD: (u.costoMod / total) * 100,
        MOI: (u.costoMoi / total) * 100,
        Materiales: (u.costoMateriales / total) * 100,
        Maquinaria: (u.costoMaquinaria / total) * 100,
      };
    }
    return {
      name: u.unidadCosto,
      MOD: u.costoMod,
      MOI: u.costoMoi,
      Materiales: u.costoMateriales,
      Maquinaria: u.costoMaquinaria,
    };
  });

  const toggle = (
    <div className="flex rounded-lg bg-gray-100 p-0.5">
      <button
        onClick={() => setMode("absolute")}
        className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
          mode === "absolute"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Valores
      </button>
      <button
        onClick={() => setMode("percent")}
        className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
          mode === "percent"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Porcentaje
      </button>
    </div>
  );

  return (
    <SectionWrapper
      title="Desglose por Unidad de Costo"
      subtitle="Composición de costos por etapa constructiva"
      actions={toggle}
    >
      <ResponsiveContainer
        width="100%"
        height={Math.max(350, unidadesCosto.length * 36)}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 10, right: 30, top: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="#f3f4f6"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={(v) => mode === "percent" ? fmtPct(v) : fmtQ(v)}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            domain={mode === "percent" ? [0, 100] : undefined}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={185}
            tick={{ fontSize: 11, fill: "#374151" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CostTooltip mode={mode} />}
            cursor={{ fill: "#f9fafb" }}
          />
          <Bar
            dataKey="MOD"
            stackId="a"
            fill={COLORS.mod}
            name="MOD"
            animationBegin={0}
            animationDuration={500}
          />
          <Bar
            dataKey="MOI"
            stackId="a"
            fill={COLORS.moi}
            name="MOI"
            animationBegin={0}
            animationDuration={550}
          />
          <Bar
            dataKey="Materiales"
            stackId="a"
            fill={COLORS.materiales}
            name="Materiales"
            animationBegin={0}
            animationDuration={600}
          />
          <Bar
            dataKey="Maquinaria"
            stackId="a"
            fill={COLORS.maquinaria}
            name="Maquinaria"
            radius={[0, 4, 4, 0]}
            animationBegin={0}
            animationDuration={650}
          />
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend />
    </SectionWrapper>
  );
}
