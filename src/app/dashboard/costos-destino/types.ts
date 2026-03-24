// ─── Filter types ───

export interface FilterOption {
  value: string;
  count: number;
}

export interface DestinoOption {
  value: string;
  count: number;
  tipo: string | null;
  descripcion: string | null;
}

export interface Period {
  id: string;
  label: string;
  name: string;
}

export interface DestinoFilters {
  periodos: Period[];
  destinos: DestinoOption[];
  tiposDestino: FilterOption[];
  unidadesCosto: FilterOption[];
  subdestinos: FilterOption[];
}

// ─── Filter state ───

export interface FilterState {
  periodId: string;
  destino: string;
  tipoDestino: string;
  unidadCosto: string[] | null;
  subdestino: string;
  fechaDesde: string;
  fechaHasta: string;
  soloConMod: boolean;
  soloMaterialesPrincipales: boolean;
}

export type FilterAction =
  | { type: "SET_PERIOD"; value: string }
  | { type: "SET_DESTINO"; value: string }
  | { type: "SET_TIPO"; value: string }
  | { type: "SET_UC"; value: string[] | null }
  | { type: "SET_SUBDESTINO"; value: string }
  | { type: "SET_FECHA_DESDE"; value: string }
  | { type: "SET_FECHA_HASTA"; value: string }
  | { type: "TOGGLE_MOD" }
  | { type: "TOGGLE_MATERIALES" }
  | { type: "RESET" };

// ─── Dashboard data ───

export interface DestinoKPIs {
  destino: string;
  tipo: string | null;
  descripcion: string | null;
  costoTotal: number;
  costoMateriales: number;
  costoMod: number;
  costoMoi: number;
  costoMaquinaria: number;
  numUnidadesCosto: number;
  numActividades: number;
  pctMateriales: number;
  pctMod: number;
  pctMoi: number;
  pctMaquinaria: number;
  // Key materials
  costoCemento: number;
  costoArena: number;
  costoPiedrin: number;
  costoHierro: number;
  costoBlock: number;
  // Additional
  ucMasCara: { nombre: string; costo: number } | null;
  actividadMasCara: { nombre: string; costo: number } | null;
  materialMasCostoso: { nombre: string; costo: number } | null;
  promedioCostoActividad: number;
  numSalidasMateriales: number;
  numActividadesConMod: number;
  numActividadesConMaquinaria: number;
}

export interface UnidadCostoRow {
  unidadCosto: string;
  costoMod: number;
  costoMoi: number;
  costoMateriales: number;
  costoMaquinaria: number;
  costoTotal: number;
  pctTotal: number;
  numActividades: number;
  duracionTotal: number;
  rubroDominante: string;
}

export interface DashboardData {
  kpis: DestinoKPIs;
  unidadesCosto: UnidadCostoRow[];
  participacionGlobal: {
    mod: number;
    moi: number;
    materiales: number;
    maquinaria: number;
  };
}

// ─── Activities ───

export interface ActividadRow {
  numActividad: number;
  unidadCosto: string;
  actividad: string;
  fechaActividad: string | null;
  costoMod: number;
  costoMoi: number;
  costoMateriales: number;
  costoMaquinaria: number;
  costoTotal: number;
  pctMod: number;
  duracion: number;
}

export interface ActividadesData {
  actividades: ActividadRow[];
  top10Mod: ActividadRow[];
  top10Total: ActividadRow[];
}

// ─── Materials ───

export interface MaterialRow {
  materialNombre: string;
  cantidadTotal: number;
  costoTotal: number;
  unidadMedida: string | null;
  numSalidas: number;
  ucPrincipal: string | null;
  pctTotalMateriales: number;
}

export interface MatrizCell {
  materialNombre: string;
  unidadCosto: string;
  costo: number;
  cantidad: number;
}

export interface MaterialesData {
  materiales: MaterialRow[];
  materialesClave: MaterialRow[];
  matriz: MatrizCell[];
}
