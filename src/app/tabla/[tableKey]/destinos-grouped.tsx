"use client";

import { useState, useEffect, useCallback } from "react";

interface Period {
  id: string;
  label: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const PERIOD_COLORS: Record<string, string> = {
  "26082024": "bg-blue-50 text-blue-700",
  "03032025": "bg-emerald-50 text-emerald-700",
  "08092025": "bg-amber-50 text-amber-700",
  "01032026": "bg-purple-50 text-purple-700",
};

const PERIOD_HEADER_COLORS: Record<string, string> = {
  "26082024": "border-blue-300 bg-blue-50/50",
  "03032025": "border-emerald-300 bg-emerald-50/50",
  "08092025": "border-amber-300 bg-amber-50/50",
  "01032026": "border-purple-300 bg-purple-50/50",
};

function formatQ(val: unknown): string {
  if (val === null || val === undefined) return "—";
  const num = typeof val === "string" ? parseFloat(val) : Number(val);
  if (isNaN(num)) return "—";
  return `Q ${num.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DestinosGrouped() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState("id_destino");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [costField, setCostField] = useState("costo_total");

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchDebounced) params.set("search", searchDebounced);
    params.set("page", String(page));
    params.set("pageSize", "50");
    params.set("sort", sortCol);
    params.set("dir", sortDir);

    try {
      const res = await fetch(`/api/destinos-agrupados?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setPeriods(json.periods ?? []);
      setPagination(json.pagination ?? null);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, page, sortCol, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPage(1);
  }

  const costFieldLabels: Record<string, string> = {
    costo_total: "Costo Total",
    costo_materiales: "Materiales",
    costo_mod: "MOD",
    costo_moi: "MOI",
    costo_maquinaria: "Maquinaria",
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Buscar destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select
          value={costField}
          onChange={(e) => setCostField(e.target.value)}
          className="h-9 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        >
          {Object.entries(costFieldLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {pagination && (
          <p className="text-sm text-gray-500 ml-auto">
            {pagination.totalCount.toLocaleString()} destinos únicos
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th
                  onClick={() => handleSort("id_destino")}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 whitespace-nowrap sticky left-0 bg-gray-50/80 z-10"
                >
                  <span className="inline-flex items-center gap-1">
                    ID Destino
                    {sortCol === "id_destino" && <span className="text-brand-600">{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </span>
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Tipo
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Estatus
                </th>
                {periods.map((p) => (
                  <th
                    key={p.id}
                    onClick={() => handleSort(`${costField}_${p.id}`)}
                    className={`px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-gray-800 whitespace-nowrap border-l ${PERIOD_HEADER_COLORS[p.id] ?? "border-gray-200"}`}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">
                      {p.label}
                      {sortCol === `${costField}_${p.id}` && <span className="text-brand-600">{sortDir === "asc" ? "↑" : "↓"}</span>}
                    </span>
                    <p className="font-normal text-[10px] opacity-60 normal-case">{costFieldLabels[costField]}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={3 + periods.length} className="px-3 py-16 text-center text-gray-400">
                    <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                    <p className="mt-2">Cargando...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={3 + periods.length} className="px-3 py-16 text-center text-gray-400">
                    No se encontraron destinos
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-900 sticky left-0 bg-white z-10">
                      {String(row.id_destino ?? "—")}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{String(row.tipo ?? "—")}</td>
                    <td className="px-3 py-2.5 text-center">
                      {row.estatus ? (
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                          row.estatus === "Activo" ? "bg-green-100 text-green-700" :
                          row.estatus === "Inactivo" ? "bg-gray-100 text-gray-500" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {String(row.estatus)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {periods.map((p) => {
                      const val = row[`${costField}_${p.id}`];
                      const hasVal = val !== null && val !== undefined;
                      return (
                        <td
                          key={p.id}
                          className={`px-3 py-2.5 text-right font-mono text-xs border-l ${
                            hasVal ? "text-gray-700" : "text-gray-300"
                          } ${PERIOD_HEADER_COLORS[p.id]?.replace("bg-", "bg-") ?? ""}`}
                          style={{ borderLeftColor: "rgba(0,0,0,0.06)" }}
                        >
                          {hasVal ? formatQ(val) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/40">
            <p className="text-xs text-gray-500">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex gap-1">
              <PagBtn disabled={page <= 1} onClick={() => setPage(1)}>««</PagBtn>
              <PagBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>«</PagBtn>
              <PagBtn disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>»</PagBtn>
              <PagBtn disabled={page >= pagination.totalPages} onClick={() => setPage(pagination.totalPages)}>»»</PagBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PagBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-8 min-w-[2rem] px-2 text-sm rounded-md border transition-colors ${
        disabled
          ? "border-gray-200 text-gray-300 cursor-not-allowed"
          : "border-gray-300 text-gray-700 hover:bg-white hover:border-brand-400 hover:text-brand-700"
      }`}
    >
      {children}
    </button>
  );
}
