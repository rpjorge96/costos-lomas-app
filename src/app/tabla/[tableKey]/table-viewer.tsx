"use client";

import { useState, useEffect, useCallback } from "react";
import { ColumnDef, formatValue } from "@/lib/table-config";

interface PeriodOption {
  id: string;
  label: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface Props {
  tableKey: string;
  columns: ColumnDef[];
  periods: PeriodOption[];
}

const PERIOD_COLORS: Record<string, string> = {
  "26082024": "bg-blue-100 text-blue-700",
  "03032025": "bg-emerald-100 text-emerald-700",
  "08092025": "bg-amber-100 text-amber-700",
  "01032026": "bg-purple-100 text-purple-700",
};

export function TableViewer({ tableKey, columns, periods }: Props) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Debounce search
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
    if (periodFilter) params.set("period", periodFilter);
    if (searchDebounced) params.set("search", searchDebounced);
    params.set("page", String(page));
    params.set("pageSize", "50");
    if (sortCol) {
      params.set("sort", sortCol);
      params.set("dir", sortDir);
    }

    try {
      const res = await fetch(`/api/tabla/${tableKey}?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setPagination(json.pagination ?? null);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [tableKey, periodFilter, searchDebounced, page, sortCol, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSort(colKey: string) {
    if (sortCol === colKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colKey);
      setSortDir("asc");
    }
    setPage(1);
  }

  function getPeriodLabel(periodId: string) {
    return periods.find((p) => p.id === periodId)?.label ?? periodId;
  }

  return (
    <div>
      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={periodFilter}
          onChange={(e) => {
            setPeriodFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        >
          <option value="">Todos los períodos</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {pagination && (
          <p className="text-sm text-gray-500 ml-auto">
            {pagination.totalCount.toLocaleString()} registros
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-800 transition-colors select-none whitespace-nowrap ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortCol === col.key && (
                        <span className="text-brand-600">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-3 py-16 text-center text-gray-400"
                  >
                    <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                    <p className="mt-2">Cargando...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-3 py-16 text-center text-gray-400"
                  >
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                          PERIOD_COLORS[row.period_id as string] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {getPeriodLabel(row.period_id as string)}
                      </span>
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3 py-2 ${
                          col.align === "right"
                            ? "text-right tabular-nums"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left"
                        } ${
                          col.type === "currency"
                            ? "font-mono text-xs"
                            : ""
                        }`}
                      >
                        <span
                          className={`${
                            row[col.key] === null ||
                            row[col.key] === undefined ||
                            row[col.key] === ""
                              ? "text-gray-300"
                              : "text-gray-700"
                          }`}
                        >
                          {formatValue(row[col.key], col.type)}
                        </span>
                      </td>
                    ))}
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
              <PaginationBtn
                disabled={page <= 1}
                onClick={() => setPage(1)}
              >
                ««
              </PaginationBtn>
              <PaginationBtn
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                «
              </PaginationBtn>
              <PaginationBtn
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                »
              </PaginationBtn>
              <PaginationBtn
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(pagination.totalPages)}
              >
                »»
              </PaginationBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PaginationBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
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
