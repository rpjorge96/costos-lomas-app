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
        className={`px-3 py-2 cursor-pointer select-none text-${align} hover:text-gray-700`}
        onClick={() => handleSort(field)}
      >
        <span className={active ? "text-gray-800 font-bold" : ""}>
          {label}
        </span>
        {active && (
          <span className="ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>
        )}
      </th>
    );
  }

  return (
    <SectionWrapper
      title="Tabla Resumen por Unidad de Costo"
      subtitle={`${unidadesCosto.length} unidades de costo`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2 w-6">#</th>
              <SortHeader label="Unidad de Costo" field="unidadCosto" align="left" />
              <SortHeader label="MOD" field="costoMod" />
              <SortHeader label="MOI" field="costoMoi" />
              <SortHeader label="Materiales" field="costoMateriales" />
              <SortHeader label="Maquinaria" field="costoMaquinaria" />
              <SortHeader label="Total" field="costoTotal" />
              <SortHeader label="% Total" field="pctTotal" />
              <SortHeader label="Acts." field="numActividades" align="center" />
              <SortHeader label="Duración" field="duracionTotal" />
              <th className="px-3 py-2 text-center">Rubro Dom.</th>
              <th className="px-3 py-2 w-36">Distribución</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const pMod = r.costoTotal > 0 ? (r.costoMod / r.costoTotal) * 100 : 0;
              const pMoi = r.costoTotal > 0 ? (r.costoMoi / r.costoTotal) * 100 : 0;
              const pMat = r.costoTotal > 0 ? (r.costoMateriales / r.costoTotal) * 100 : 0;
              const pMaq = r.costoTotal > 0 ? (r.costoMaquinaria / r.costoTotal) * 100 : 0;

              const rubroColor =
                r.rubroDominante === "MOD"
                  ? "bg-blue-100 text-blue-700"
                  : r.rubroDominante === "MOI"
                  ? "bg-violet-100 text-violet-700"
                  : r.rubroDominante === "Materiales"
                  ? "bg-amber-100 text-amber-700"
                  : r.rubroDominante === "Maquinaria"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-500";

              return (
                <tr
                  key={`${r.unidadCosto}-${i}`}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                >
                  <td className="px-3 py-2 font-mono text-xs text-gray-400">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900 max-w-[200px] truncate" title={r.unidadCosto}>
                    {r.unidadCosto}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-blue-600">
                    {fmtQ(r.costoMod)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-violet-600">
                    {fmtQ(r.costoMoi)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-amber-600">
                    {fmtQ(r.costoMateriales)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-red-600">
                    {fmtQ(r.costoMaquinaria)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-gray-900">
                    {fmtQ(r.costoTotal)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-600">
                    {fmtPct(r.pctTotal)}
                  </td>
                  <td className="px-3 py-2 text-center font-mono">
                    {r.numActividades}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-600">
                    {r.duracionTotal.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${rubroColor}`}
                    >
                      {r.rubroDominante}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        style={{ width: `${pMod}%` }}
                        className="bg-blue-500"
                        title={`MOD ${fmtPct(pMod)}`}
                      />
                      <div
                        style={{ width: `${pMoi}%` }}
                        className="bg-purple-500"
                        title={`MOI ${fmtPct(pMoi)}`}
                      />
                      <div
                        style={{ width: `${pMat}%` }}
                        className="bg-amber-400"
                        title={`Mat ${fmtPct(pMat)}`}
                      />
                      <div
                        style={{ width: `${pMaq}%` }}
                        className="bg-red-500"
                        title={`Maq ${fmtPct(pMaq)}`}
                      />
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
