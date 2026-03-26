"use client";

import { useMemo } from "react";
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
import type { UnidadCostoConMateriales } from "../types";
import { fmtQ, MATERIAL_COLORS } from "../constants";
import { SectionWrapper } from "@/app/dashboard/costos-destino/components/shared/section-wrapper";

interface Props {
  unidadesCosto: UnidadCostoConMateriales[];
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-gray-900">{label}</p>
      {payload
        .filter((p: any) => p.value > 0)
        .map((p: any) => (
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

export function DistribucionChart({ unidadesCosto }: Props) {
  const { chartData, topMaterials } = useMemo(() => {
    // Find top 5 materials by total cost across all UCs
    const globalCosts = new Map<string, number>();
    for (const uc of unidadesCosto) {
      for (const m of uc.materiales) {
        globalCosts.set(
          m.materialNombre,
          (globalCosts.get(m.materialNombre) ?? 0) + m.costoTotal
        );
      }
    }

    const sorted = Array.from(globalCosts.entries())
      .sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5).map(([name]) => name);

    // Build chart data
    const data = unidadesCosto.map((uc) => {
      const row: Record<string, any> = { name: uc.unidadCosto };
      let otrosCosto = 0;

      for (const m of uc.materiales) {
        if (top.includes(m.materialNombre)) {
          row[m.materialNombre] = (row[m.materialNombre] ?? 0) + m.costoTotal;
        } else {
          otrosCosto += m.costoTotal;
        }
      }

      if (otrosCosto > 0) {
        row["Otros"] = otrosCosto;
      }

      return row;
    });

    const materials = [...top];
    if (data.some((d) => d["Otros"])) {
      materials.push("Otros");
    }

    return { chartData: data, topMaterials: materials };
  }, [unidadesCosto]);

  if (unidadesCosto.length === 0) return null;

  return (
    <SectionWrapper
      title="Distribución de Materiales por UC"
      subtitle="Top 5 materiales por costo, el resto agrupado como Otros"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            angle={-20}
            textAnchor="end"
          />
          <YAxis
            tickFormatter={(v) => fmtQ(v)}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          {topMaterials.map((mat, i) => (
            <Bar
              key={mat}
              dataKey={mat}
              stackId="a"
              name={mat}
              fill={
                mat === "Otros"
                  ? "#9ca3af"
                  : MATERIAL_COLORS[i % MATERIAL_COLORS.length]
              }
              radius={
                i === topMaterials.length - 1 ? [4, 4, 0, 0] : undefined
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </SectionWrapper>
  );
}
