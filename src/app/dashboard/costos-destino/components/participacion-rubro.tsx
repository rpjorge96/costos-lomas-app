"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
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

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-xl">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.payload.color }} />
        <span className="font-semibold text-gray-800">{d.name}</span>
      </div>
      <p className="mt-1 font-mono text-gray-600">{fmtQ(d.value)}</p>
      <p className="font-mono text-gray-400">{fmtPct(d.payload.pct)}</p>
    </div>
  );
}

function RubroPie({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number; color: string; pct: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex-1 min-w-[280px]">
      <p className="mb-1 text-xs font-bold text-gray-600 text-center uppercase tracking-wider">
        {title}
      </p>
      <p className="mb-3 text-center font-mono text-sm font-bold text-gray-900">
        {fmtQ(total)}
      </p>
      {total === 0 ? (
        <p className="py-8 text-center text-xs text-gray-400">Sin datos</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                animationBegin={0}
                animationDuration={600}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Custom legend */}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 px-4">
            {data.map((d) => (
              <div key={d.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[11px] text-gray-600 truncate">{d.name}</span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-gray-700 shrink-0">{fmtPct(d.pct)}</span>
              </div>
            ))}
          </div>
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

  const globalTotal =
    participacionGlobal.mod +
    participacionGlobal.moi +
    participacionGlobal.materiales +
    participacionGlobal.maquinaria;

  const globalData = RUBRO_ITEMS.map((r) => {
    const val = participacionGlobal[r.key as keyof typeof participacionGlobal];
    return {
      name: r.label,
      value: val,
      color: r.color,
      pct: globalTotal > 0 ? (val / globalTotal) * 100 : 0,
    };
  });

  const ucData = useMemo(() => {
    if (!selectedUC) return null;
    const uc = unidadesCosto.find((u) => u.unidadCosto === selectedUC);
    if (!uc) return null;
    const t = uc.costoTotal || 1;
    return [
      { name: "MOD", value: uc.costoMod, color: COLORS.mod, pct: (uc.costoMod / t) * 100 },
      { name: "MOI", value: uc.costoMoi, color: COLORS.moi, pct: (uc.costoMoi / t) * 100 },
      { name: "Materiales", value: uc.costoMateriales, color: COLORS.materiales, pct: (uc.costoMateriales / t) * 100 },
      { name: "Maquinaria", value: uc.costoMaquinaria, color: COLORS.maquinaria, pct: (uc.costoMaquinaria / t) * 100 },
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
          className={`rounded-lg border px-2 py-1 text-xs focus:border-brand-500 focus:outline-none transition-colors
            ${selectedUC ? "border-brand-400 bg-brand-50 text-brand-800 font-medium" : "border-gray-300"}`}
        >
          <option value="">Comparar con UC…</option>
          {unidadesCosto.map((u, i) => (
            <option key={`uc-${i}`} value={u.unidadCosto}>
              {u.unidadCosto}
            </option>
          ))}
        </select>
      }
    >
      <div className="flex flex-wrap gap-8 justify-center">
        <RubroPie title="Destino Completo" data={globalData} />
        {ucData ? (
          <RubroPie title={selectedUC} data={ucData} />
        ) : (
          <div className="flex-1 min-w-[280px] flex flex-col items-center justify-center gap-3 text-center py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 max-w-[180px]">
              Selecciona una unidad de costo para ver la comparación
            </p>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
