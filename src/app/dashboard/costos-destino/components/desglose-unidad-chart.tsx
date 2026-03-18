"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-gray-900">{label}</p>
      {payload.map((p: any) => (
        <p
          key={p.dataKey}
          style={{ color: p.color }}
          className="flex justify-between gap-4"
        >
          <span>{p.name}</span>
          <span className="font-mono font-semibold">{fmt(p.value)}</span>
        </p>
      ))}
      <div className="mt-1.5 border-t border-gray-200 pt-1.5 flex justify-between gap-4 font-semibold text-gray-900">
        <span>Total</span>
        <span className="font-mono">{fmt(total)}</span>
      </div>
    </div>
  );
}

function leadingNumber(s: string): number {
  const m = s.match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : Infinity;
}

export function DesgloseUnidadChart({ unidadesCosto }: Props) {
  const [mode, setMode] = useState<"absolute" | "percent">("absolute");

  // Sort: first by leading number (1, 2, 3…), then by costoTotal desc
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
        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
          mode === "absolute"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Valores
      </button>
      <button
        onClick={() => setMode("percent")}
        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
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
          margin={{ left: 10, right: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            tickFormatter={(v) =>
              mode === "percent" ? fmtPct(v) : fmtQ(v)
            }
            tick={{ fontSize: 11 }}
            domain={mode === "percent" ? [0, 100] : undefined}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CostTooltip mode={mode} />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar
            dataKey="MOD"
            stackId="a"
            fill={COLORS.mod}
            name="MOD"
          />
          <Bar
            dataKey="MOI"
            stackId="a"
            fill={COLORS.moi}
            name="MOI"
          />
          <Bar
            dataKey="Materiales"
            stackId="a"
            fill={COLORS.materiales}
            name="Materiales"
          />
          <Bar
            dataKey="Maquinaria"
            stackId="a"
            fill={COLORS.maquinaria}
            name="Maquinaria"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </SectionWrapper>
  );
}
