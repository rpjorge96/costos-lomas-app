"use client";

import { useMemo } from "react";
import type { UnidadCostoConMateriales } from "../types";
import { fmtQ, fmtNum, fmtPct } from "../constants";
import { SectionWrapper } from "@/app/dashboard/costos-destino/components/shared/section-wrapper";

interface Props {
  unidadesCosto: UnidadCostoConMateriales[];
}

interface MaterialGlobal {
  materialNombre: string;
  unidadMedida: string | null;
  cantidadTotal: number;
  costoTotal: number;
  numSalidas: number;
  numUCs: number;
  pctTotal: number;
}

export function TopMaterialesTable({ unidadesCosto }: Props) {
  const materiales = useMemo(() => {
    const map = new Map<
      string,
      { unidadMedida: string | null; cantidad: number; costo: number; salidas: number; ucs: Set<string> }
    >();

    for (const uc of unidadesCosto) {
      for (const m of uc.materiales) {
        const entry = map.get(m.materialNombre) ?? {
          unidadMedida: m.unidadMedida,
          cantidad: 0,
          costo: 0,
          salidas: 0,
          ucs: new Set<string>(),
        };
        entry.cantidad += m.cantidadTotal;
        entry.costo += m.costoTotal;
        entry.salidas += m.numSalidas;
        entry.ucs.add(uc.unidadCosto);
        map.set(m.materialNombre, entry);
      }
    }

    const costoTotal = Array.from(map.values()).reduce((s, e) => s + e.costo, 0);

    const result: MaterialGlobal[] = Array.from(map.entries())
      .map(([nombre, e]) => ({
        materialNombre: nombre,
        unidadMedida: e.unidadMedida,
        cantidadTotal: e.cantidad,
        costoTotal: e.costo,
        numSalidas: e.salidas,
        numUCs: e.ucs.size,
        pctTotal: costoTotal > 0 ? (e.costo / costoTotal) * 100 : 0,
      }))
      .sort((a, b) => b.costoTotal - a.costoTotal);

    return result;
  }, [unidadesCosto]);

  if (materiales.length === 0) return null;

  const shown = materiales.slice(0, 20);

  return (
    <SectionWrapper
      title="Ranking Global de Materiales"
      subtitle={`${materiales.length} materiales en total`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2 text-center w-8">#</th>
              <th className="px-3 py-2 text-left">Material</th>
              <th className="px-3 py-2 text-left">Unidad</th>
              <th className="px-3 py-2 text-right">Cantidad</th>
              <th className="px-3 py-2 text-right">Costo Total</th>
              <th className="px-3 py-2 text-right"># Salidas</th>
              <th className="px-3 py-2 text-right"># UCs</th>
              <th className="px-3 py-2 text-right">% Total</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m, i) => (
              <tr
                key={m.materialNombre}
                className="border-b border-gray-100 transition-colors hover:bg-gray-50"
              >
                <td className="px-3 py-1.5 text-center text-xs font-bold text-gray-400">
                  {i + 1}
                </td>
                <td className="px-3 py-1.5 font-medium text-gray-900 max-w-[200px] truncate" title={m.materialNombre}>
                  {m.materialNombre}
                </td>
                <td className="px-3 py-1.5 text-xs text-gray-500">
                  {m.unidadMedida ?? "—"}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-gray-700">
                  {fmtNum(m.cantidadTotal)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono font-semibold text-gray-900">
                  {fmtQ(m.costoTotal)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-gray-600">
                  {m.numSalidas}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-purple-600">
                  {m.numUCs}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-amber-600">
                  {fmtPct(m.pctTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {materiales.length > 20 && (
          <p className="mt-2 text-center text-xs text-gray-400">
            Mostrando 20 de {materiales.length} materiales
          </p>
        )}
      </div>
    </SectionWrapper>
  );
}
