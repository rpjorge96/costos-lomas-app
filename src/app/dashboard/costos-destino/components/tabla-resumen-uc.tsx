"use client";

import { useState } from "react";
import type { UnidadCostoRow } from "../types";
import { fmtQ, fmtPct } from "../constants";
import { SectionWrapper } from "./shared/section-wrapper";

interface Props {
  unidadesCosto: UnidadCostoRow[];
}

type SortKey =
  | "unidadCosto"
  | "costoTotal"
  | "costoMod"
  | "costoMoi"
  | "costoMateriales"
  | "costoMaquinaria"
  | "pctTotal"
  | "numActividades"
  | "duracionTotal";

export function TablaResumenUC({ unidadesCosto }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("costoTotal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...unidadesCosto].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (typeof va === "string" && typeof vb === "string") {
      return sortDir === "asc"
        ? va.localeCompare(vb, "es")
        : vb.localeCompare(va, "es");
    }
    return sortDir === "asc"
      ? (va as number) - (vb as number)
      : (vb as number) - (va as number);
  });

  const maxCosto = Math.max(...sorted.map((r) => r.costoTotal), 0);

  function SortHeader({
    label,
    field,
    align = "right",
  }: {
    label: string;
    field: SortKey;
    align?: "left" | "right" | "center";
  }) {
    const active = sortKey === field;
    return (
      <th
        className={`px-3 py-2.5 cursor-pointer select-none text-${align} whitespace-nowrap transition-colors
          ${active ? "text-brand-700 bg-brand-50/60" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
        onClick={() => handleSort(field)}
      >
        <span className={`inline-flex items-center gap-0.5 ${active ? "font-bold" : ""}`}>
          {label}
          {active ? (
            <svg className="h-3 w-3 ml-0.5 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {sortDir === "asc"
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              }
            </svg>
          ) : (
            <svg className="h-3 w-3 ml-0.5 shrink-0 opacity-0 group-hover:opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          )}
        </span>
      </th>
    );
  }

  return (
    <SectionWrapper
      title="Tabla Resumen por Unidad de Costo"
      subtitle={`${unidadesCosto.length} unidades de costo`}
    >
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase tracking-wider">
              <th className="px-3 py-2.5 w-8 text-gray-400 font-bold">#</th>
              <SortHeader label="Unidad de Costo" field="unidadCosto" align="left" />
              <SortHeader label="MOD" field="costoMod" />
              <SortHeader label="MOI" field="costoMoi" />
              <SortHeader label="Materiales" field="costoMateriales" />
              <SortHeader label="Maquinaria" field="costoMaquinaria" />
              <SortHeader label="Total" field="costoTotal" />
              <th className="px-3 py-2.5 text-gray-500 text-right">Barra</th>
              <SortHeader label="% Total" field="pctTotal" />
              <SortHeader label="Acts." field="numActividades" align="center" />
              <SortHeader label="Duración" field="duracionTotal" />
              <th className="px-3 py-2.5 text-center text-gray-500">Rubro Dom.</th>
              <th className="px-3 py-2.5 w-36 text-gray-500">Mix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((r, i) => {
              const pMod = r.costoTotal > 0 ? (r.costoMod / r.costoTotal) * 100 : 0;
              const pMoi = r.costoTotal > 0 ? (r.costoMoi / r.costoTotal) * 100 : 0;
              const pMat = r.costoTotal > 0 ? (r.costoMateriales / r.costoTotal) * 100 : 0;
              const pMaq = r.costoTotal > 0 ? (r.costoMaquinaria / r.costoTotal) * 100 : 0;
              const barPct = maxCosto > 0 ? (r.costoTotal / maxCosto) * 100 : 0;

              const rubroColor =
                r.rubroDominante === "MOD"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : r.rubroDominante === "MOI"
                  ? "bg-violet-100 text-violet-700 border border-violet-200"
                  : r.rubroDominante === "Materiales"
                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : r.rubroDominante === "Maquinaria"
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-gray-100 text-gray-500 border border-gray-200";

              return (
                <tr
                  key={`${r.unidadCosto}-${i}`}
                  className={`transition-colors hover:bg-brand-50/40 ${i % 2 === 1 ? "bg-gray-50/50" : "bg-white"}`}
                >
                  <td className="px-3 py-2 font-mono text-xs text-gray-300 tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900 max-w-[180px] truncate" title={r.unidadCosto}>
                    {r.unidadCosto}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-blue-600 tabular-nums text-xs">
                    {fmtQ(r.costoMod)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-violet-600 tabular-nums text-xs">
                    {fmtQ(r.costoMoi)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-amber-600 tabular-nums text-xs">
                    {fmtQ(r.costoMateriales)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-red-600 tabular-nums text-xs">
                    {fmtQ(r.costoMaquinaria)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-gray-900 tabular-nums text-xs">
                    {fmtQ(r.costoTotal)}
                  </td>
                  {/* Mini progress bar */}
                  <td className="px-3 py-2 w-20">
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-500 tabular-nums text-xs">
                    {fmtPct(r.pctTotal)}
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-gray-600 tabular-nums text-xs">
                    {r.numActividades}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-500 tabular-nums text-xs">
                    {r.duracionTotal.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${rubroColor}`}>
                      {r.rubroDominante}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
                      <div style={{ width: `${pMod}%` }} className="bg-blue-400" title={`MOD ${fmtPct(pMod)}`} />
                      <div style={{ width: `${pMoi}%` }} className="bg-violet-400" title={`MOI ${fmtPct(pMoi)}`} />
                      <div style={{ width: `${pMat}%` }} className="bg-amber-400" title={`Mat ${fmtPct(pMat)}`} />
                      <div style={{ width: `${pMaq}%` }} className="bg-red-400" title={`Maq ${fmtPct(pMaq)}`} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}
