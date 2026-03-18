"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MaterialesData, MatrizCell } from "../types";
import { KEY_MATERIALS, fmtQ, fmtPct, fmtNum } from "../constants";
import { SectionWrapper } from "./shared/section-wrapper";

interface Props {
  data: MaterialesData | null;
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

// ─── Heatmap Matrix ───
function MatrizMateriales({ matriz }: { matriz: MatrizCell[] }) {
  const { materialNames, ucNames, grid, maxVal } = useMemo(() => {
    const mats = [...new Set(matriz.map((m) => m.materialNombre))];
    const ucs = [...new Set(matriz.map((m) => m.unidadCosto))];
    const g: Record<string, Record<string, number>> = {};
    let mx = 0;
    for (const cell of matriz) {
      if (!g[cell.materialNombre]) g[cell.materialNombre] = {};
      g[cell.materialNombre][cell.unidadCosto] = cell.costo;
      if (cell.costo > mx) mx = cell.costo;
    }
    return { materialNames: mats, ucNames: ucs, grid: g, maxVal: mx };
  }, [matriz]);

  if (materialNames.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-gray-400">
        Sin datos de materiales clave para la matriz
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Material
            </th>
            {ucNames.map((uc) => (
              <th
                key={uc}
                className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 max-w-[100px] truncate"
                title={uc}
              >
                {uc}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {materialNames.map((mat) => (
            <tr key={mat} className="border-b border-gray-100">
              <td className="px-2 py-2 font-medium text-gray-900">{mat}</td>
              {ucNames.map((uc) => {
                const val = grid[mat]?.[uc] ?? 0;
                const intensity =
                  maxVal > 0 ? Math.min(val / maxVal, 1) : 0;
                return (
                  <td
                    key={uc}
                    className="px-2 py-2 text-right font-mono"
                    style={{
                      backgroundColor:
                        val > 0
                          ? `rgba(245, 158, 11, ${0.1 + intensity * 0.5})`
                          : undefined,
                    }}
                  >
                    {val > 0 ? fmtQ(val) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MaterialesSection({ data }: Props) {
  if (!data) {
    return (
      <SectionWrapper title="Materiales Principales">
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      </SectionWrapper>
    );
  }

  const barData = data.materialesClave.map((m) => ({
    name: m.materialNombre,
    Costo: m.costoTotal,
  }));

  return (
    <div className="space-y-6">
      {/* A. Table of all materials */}
      <SectionWrapper
        title="Materiales del Destino"
        subtitle={`${data.materiales.length} materiales`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <th className="px-3 py-2 text-left">Material</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-left">Unidad</th>
                <th className="px-3 py-2 text-right">Costo Total</th>
                <th className="px-3 py-2 text-right"># Salidas</th>
                <th className="px-3 py-2 text-left">UC Principal</th>
                <th className="px-3 py-2 text-right">% Mat.</th>
              </tr>
            </thead>
            <tbody>
              {data.materiales.slice(0, 30).map((m, i) => (
                <tr
                  key={`${m.materialNombre}-${i}`}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-1.5 font-medium text-gray-900 max-w-[200px] truncate" title={m.materialNombre}>
                    {m.materialNombre}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-gray-700">
                    {fmtNum(m.cantidadTotal)}
                  </td>
                  <td className="px-3 py-1.5 text-xs text-gray-500">
                    {m.unidadMedida ?? "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono font-semibold text-gray-900">
                    {fmtQ(m.costoTotal)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-gray-600">
                    {m.numSalidas}
                  </td>
                  <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[140px] truncate" title={m.ucPrincipal ?? ""}>
                    {m.ucPrincipal ?? "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-amber-600">
                    {fmtPct(m.pctTotalMateriales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.materiales.length > 30 && (
            <p className="mt-2 text-center text-xs text-gray-400">
              Mostrando 30 de {data.materiales.length} materiales
            </p>
          )}
        </div>
      </SectionWrapper>

      {/* B. Bar chart of key materials */}
      {barData.length > 0 && (
        <SectionWrapper
          title="Materiales Clave — Comparativa"
          subtitle="Cemento, Arena, Piedrín, Hierro, Block"
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} margin={{ bottom: 20 }}>
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
              <Tooltip content={<CostTooltip />} />
              <Bar
                dataKey="Costo"
                fill="#f59e0b"
                name="Costo"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </SectionWrapper>
      )}

      {/* C. Matrix: materials × cost units */}
      <SectionWrapper
        title="Matriz Materiales Clave vs Unidad de Costo"
        subtitle="Costo por material en cada etapa constructiva"
      >
        <MatrizMateriales matriz={data.matriz} />
      </SectionWrapper>
    </div>
  );
}
