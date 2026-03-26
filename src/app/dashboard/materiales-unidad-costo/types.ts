// ─── Filter types ───

export interface Period {
  id: string;
  label: string;
  name: string;
}

export interface DestinoOption {
  value: string;
  count: number;
  tipo: string | null;
  descripcion: string | null;
}

export interface MaterialesUCFilters {
  periodos: Period[];
  destinos: DestinoOption[];
}

// ─── Filter state ───

export interface FilterState {
  periodId: string;
  destino: string;
}

export type FilterAction =
  | { type: "SET_PERIOD"; value: string }
  | { type: "SET_DESTINO"; value: string }
  | { type: "RESET" };

// ─── Dashboard data ───

export interface MaterialPorUC {
  materialNombre: string;
  cantidadTotal: number;
  costoTotal: number;
  unidadMedida: string | null;
  numSalidas: number;
  pctCostoUC: number;
}

export interface UnidadCostoConMateriales {
  unidadCosto: string;
  costoMaterialesTotal: number;
  numMateriales: number;
  numSalidas: number;
  pctDelDestino: number;
  materiales: MaterialPorUC[];
}

export interface DashboardKPIs {
  destino: string;
  tipo: string | null;
  descripcion: string | null;
  costoMaterialesTotal: number;
  numUnidadesCosto: number;
  numMaterialesDistintos: number;
  numSalidasTotal: number;
  materialMasCostoso: { nombre: string; costo: number } | null;
  ucConMasMateriales: { nombre: string; costo: number } | null;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  unidadesCosto: UnidadCostoConMateriales[];
}
