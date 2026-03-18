"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { UnidadCostoRow } from "../types";
import { COLORS, fmtQ, fmtPct } from "../constants";
import { SectionWrapper } from "./shared/section-wrapper";

interface Props {
  participacionGlobal: {
    mod: number;
    moi: number;
    materiales: number;
    maquinaria: number;
  };
  unidadesCosto: UnidadCostoRow[];
}

const RUBRO_ITEMS = [
  { key: "mod", label: "MOD", color: COLORS.mod },
  { key: "moi", label: "MOI", color: COLORS.moi },
  { key: "materiales", label: "Materiales", color: COLORS.materiales },
  { key: "maquinaria", label: "Maquinaria", color: COLORS.maquinaria },
];

function RubroPie({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex-1 min-w-[280px]">
      <p className="mb-2 text-xs font-semibold text-gray-500 text-center">
        {title}
      </p>
      {total === 0 ? (
        <p className="py-8 text-center text-xs text-gray-400">Sin datos</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [
                  `${fmtQ(Number(value))} (${fmtPct(total > 0 ? (Number(value) / total) * 100 : 0)})`,
                  name,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string, entry: any) => {
                  const pct =
                    total > 0
                      ? ((entry.payload.value / total) * 100).toFixed(1)
                      : "0";
                  return `${value} (${pct}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-xs font-mono text-gray-500">
            Total: {fmtQ(total)}
          </p>
        </>
      )}
    </div>
  );
}

export function ParticipacionRubro({
  participacionGlobal,
  unidadesCosto,
}: Props) {
  const [selectedUC, setSelectedUC] = useState("");

  const globalData = RUBRO_ITEMS.map((r) => ({
    name: r.label,
    value: participacionGlobal[r.key as keyof typeof participacionGlobal],
    color: r.color,
  }));

  const ucData = useMemo(() => {
    if (!selectedUC) return null;
    const uc = unidadesCosto.find((u) => u.unidadCosto === selectedUC);
    if (!uc) return null;
    return [
      { name: "MOD", value: uc.costoMod, color: COLORS.mod },
      { name: "MOI", value: uc.costoMoi, color: COLORS.moi },
      { name: "Materiales", value: uc.costoMateriales, color: COLORS.materiales },
      { name: "Maquinaria", value: uc.costoMaquinaria, color: COLORS.maquinaria },
    ];
  }, [selectedUC, unidadesCosto]);

  return (
    <SectionWrapper
      title="Participación por Rubro"
      subtitle="Composición del costo: destino completo vs unidad de costo"
      actions={
        <select
          value={selectedUC}
          onChange={(e) => setSelectedUC(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
        >
          <option value="">Seleccionar UC para comparar</option>
          {unidadesCosto.map((u, i) => (
            <option key={`uc-${i}`} value={u.unidadCosto}>
              {u.unidadCosto}
            </option>
          ))}
        </select>
      }
    >
      <div className="flex flex-wrap gap-6 justify-center">
        <RubroPie title="Destino Completo" data={globalData} />
        {ucData && <RubroPie title={selectedUC} data={ucData} />}
        {!ucData && (
          <div className="flex-1 min-w-[280px] flex items-center justify-center">
            <p className="text-xs text-gray-400">
              Selecciona una unidad de costo para comparar
            </p>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
