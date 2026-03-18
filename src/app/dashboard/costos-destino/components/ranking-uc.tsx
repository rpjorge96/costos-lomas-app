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
import type { UnidadCostoRow } from "../types";
import { COLORS, fmtQ } from "../constants";
import { SectionWrapper } from "./shared/section-wrapper";

interface Props {
  unidadesCosto: UnidadCostoRow[];
}

type RankingMetric = "costoTotal" | "costoMod" | "costoMateriales" | "costoMaquinaria";

const METRICS: { key: RankingMetric; label: string; color: string }[] = [
  { key: "costoTotal", label: "Total", color: COLORS.total },
  { key: "costoMod", label: "MOD", color: COLORS.mod },
  { key: "costoMateriales", label: "Materiales", color: COLORS.materiales },
  { key: "costoMaquinaria", label: "Maquinaria", color: COLORS.maquinaria },
];

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

export function RankingUC({ unidadesCosto }: Props) {
  const [metric, setMetric] = useState<RankingMetric>("costoTotal");

  const currentMetric = METRICS.find((m) => m.key === metric)!;

  const chartData = useMemo(() => {
    return [...unidadesCosto]
      .sort((a, b) => (b[metric] as number) - (a[metric] as number))
      .map((u) => ({
        name: u.unidadCosto,
        [currentMetric.label]: u[metric] as number,
      }));
  }, [unidadesCosto, metric]);

  const selector = (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
      {METRICS.map((m) => (
        <button
          key={m.key}
          onClick={() => setMetric(m.key)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            metric === m.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  return (
    <SectionWrapper
      title="Ranking de Unidades de Costo"
      subtitle="Ordenadas de mayor a menor por la métrica seleccionada"
      actions={selector}
    >
      <ResponsiveContainer
        width="100%"
        height={Math.max(300, chartData.length * 34)}
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
            width={180}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CostTooltip />} />
          <Bar
            dataKey={currentMetric.label}
            fill={currentMetric.color}
            name={currentMetric.label}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </SectionWrapper>
  );
}
