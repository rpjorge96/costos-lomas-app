"use client";

import { useState } from "react";
import type { UnidadCostoConMateriales } from "../types";
import { fmtQ, fmtNum, fmtPct } from "../constants";
import { SectionWrapper } from "@/app/dashboard/costos-destino/components/shared/section-wrapper";

interface Props {
  unidadesCosto: UnidadCostoConMateriales[];
}

function UCRow({ uc, isExpanded, onToggle }: {
  uc: UnidadCostoConMateriales;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const maxCosto = uc.materiales.length > 0
    ? Math.max(...uc.materiales.map((m) => m.costoTotal))
    : 0;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
      >
        {/* Chevron */}
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
            isExpanded ? "rotate-90" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>

        {/* UC Name */}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
          {uc.unidadCosto}
        </span>

        {/* Cost */}
        <span className="shrink-0 text-sm font-bold font-mono text-amber-700">
          {fmtQ(uc.costoMaterialesTotal)}
        </span>

        {/* Badge */}
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
          {uc.numMateriales} mat.
        </span>

        {/* Progress bar */}
        <div className="hidden sm:flex shrink-0 items-center gap-2 w-32">
          <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-300"
              style={{ width: `${Math.min(uc.pctDelDestino, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-gray-400 w-10 text-right">
            {fmtPct(uc.pctDelDestino)}
          </span>
        </div>
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 pb-4 pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2 text-left">Material</th>
                  <th className="px-3 py-2 text-right">Cantidad</th>
                  <th className="px-3 py-2 text-left">Unidad</th>
                  <th className="px-3 py-2 text-right">Costo Total</th>
                  <th className="px-3 py-2 text-right"># Salidas</th>
                  <th className="px-3 py-2 text-right">% de UC</th>
                </tr>
              </thead>
              <tbody>
                {uc.materiales.map((m, i) => (
                  <tr
                    key={`${m.materialNombre}-${i}`}
                    className="border-b border-gray-100 transition-colors hover:bg-white"
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
                    <td className="px-3 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {maxCosto > 0 && (
                          <div className="hidden sm:block h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{ width: `${(m.costoTotal / maxCosto) * 100}%` }}
                            />
                          </div>
                        )}
                        <span className="font-mono font-semibold text-gray-900">
                          {fmtQ(m.costoTotal)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-gray-600">
                      {m.numSalidas}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-amber-600">
                      {fmtPct(m.pctCostoUC)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function UCMaterialesList({ unidadesCosto }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // First UC expanded by default
    if (unidadesCosto.length > 0) {
      return new Set([unidadesCosto[0].unidadCosto]);
    }
    return new Set();
  });

  const toggle = (uc: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(uc)) {
        next.delete(uc);
      } else {
        next.add(uc);
      }
      return next;
    });
  };

  if (unidadesCosto.length === 0) {
    return (
      <SectionWrapper title="Detalle por Unidad de Costo">
        <p className="py-8 text-center text-sm text-gray-400">
          No hay materiales registrados para este destino
        </p>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper
      title="Detalle por Unidad de Costo"
      subtitle={`${unidadesCosto.length} unidades de costo`}
    >
      <div className="-mx-5 -mb-5">
        {unidadesCosto.map((uc) => (
          <UCRow
            key={uc.unidadCosto}
            uc={uc}
            isExpanded={expanded.has(uc.unidadCosto)}
            onToggle={() => toggle(uc.unidadCosto)}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
