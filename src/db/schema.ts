import {
  pgTable,
  text,
  serial,
  numeric,
  date,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Periods (metadata for each Airtable base/period) ──

export const periods = pgTable("periods", {
  id: text("id").primaryKey(), // "26082024"
  baseId: text("base_id").notNull(),
  label: text("label").notNull(), // "26/08/2024"
  name: text("name").notNull(), // "Las Lomas 26082024"
  startDate: date("start_date"),
  lastSyncedAt: timestamp("last_synced_at"),
  recordCounts: jsonb("record_counts"),
});

// ── Destinos ──

export const destinos = pgTable(
  "destinos",
  {
    id: serial("id").primaryKey(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    airtableId: text("airtable_id").notNull(),
    idDestino: text("id_destino"),
    tipo: text("tipo"),
    costoTotal: numeric("costo_total"),
    costoMateriales: numeric("costo_materiales"),
    costoMod: numeric("costo_mod"),
    costoMoi: numeric("costo_moi"),
    costoMaquinaria: numeric("costo_maquinaria"),
    estatus: text("estatus"),
    descripcion: text("descripcion"),
  },
  (table) => [
    uniqueIndex("destinos_period_airtable_idx").on(
      table.periodId,
      table.airtableId
    ),
  ]
);

// ── Actividades y costos ──

export const actividades = pgTable(
  "actividades",
  {
    id: serial("id").primaryKey(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    airtableId: text("airtable_id").notNull(),
    numActividad: integer("num_actividad"),
    fechaActividad: date("fecha_actividad"),
    unidadCosto: text("unidad_costo"),
    duracion: numeric("duracion"),
    actividad: text("actividad"),
    costoTotal: numeric("costo_total"),
    mod: numeric("mod"),
    moi: numeric("moi"),
    costoMateriales: numeric("costo_materiales"),
    maquinariaCosto: numeric("maquinaria_costo"),
    destinoSubdestinos: text("destino_subdestinos"),
    subdestino: text("subdestino"),
  },
  (table) => [
    uniqueIndex("actividades_period_airtable_idx").on(
      table.periodId,
      table.airtableId
    ),
  ]
);

// ── Materiales ──

export const materiales = pgTable(
  "materiales",
  {
    id: serial("id").primaryKey(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    airtableId: text("airtable_id").notNull(),
    idMateriales: text("id_materiales"),
    unidadMedida: text("unidad_medida"),
    precioPromPonderado: numeric("precio_prom_ponderado"),
    disponibleCentral: numeric("disponible_central"),
    totalComprasQ: numeric("total_compras_q"),
    totalIngresos: numeric("total_ingresos"),
    totalSalidas: numeric("total_salidas"),
  },
  (table) => [
    uniqueIndex("materiales_period_airtable_idx").on(
      table.periodId,
      table.airtableId
    ),
  ]
);

// ── Salida de Materiales ──

export const salidaMateriales = pgTable(
  "salida_materiales",
  {
    id: serial("id").primaryKey(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    airtableId: text("airtable_id").notNull(),
    numUso: integer("num_uso"),
    materialNombre: text("material_nombre"),
    cantidadEnviada: numeric("cantidad_enviada"),
    costoMaterial: numeric("costo_material"),
    fechaSalida: timestamp("fecha_salida"),
    destinoSubdestinos: text("destino_subdestinos"),
    unidadMedida: text("unidad_medida"),
    numActividad: text("num_actividad"),
  },
  (table) => [
    uniqueIndex("salida_materiales_period_airtable_idx").on(
      table.periodId,
      table.airtableId
    ),
  ]
);

// ── Combustibles ──

export const combustibles = pgTable(
  "combustibles",
  {
    id: serial("id").primaryKey(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    airtableId: text("airtable_id").notNull(),
    idCombustible: text("id_combustible"),
    disponible: numeric("disponible"),
    unidadMedida: text("unidad_medida"),
    precioPromPonderado: numeric("precio_prom_ponderado"),
    totalComprado: numeric("total_comprado"),
    totalUtilizado: numeric("total_utilizado"),
    totalComprasQ: numeric("total_compras_q"),
  },
  (table) => [
    uniqueIndex("combustibles_period_airtable_idx").on(
      table.periodId,
      table.airtableId
    ),
  ]
);

// ── Despachos de combustible ──

export const despachosCombustible = pgTable(
  "despachos_combustible",
  {
    id: serial("id").primaryKey(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    airtableId: text("airtable_id").notNull(),
    numDespacho: integer("num_despacho"),
    fechaDespacho: date("fecha_despacho"),
    cantidadDespachada: numeric("cantidad_despachada"),
    costoDespacho: numeric("costo_despacho"),
    observaciones: text("observaciones"),
    hrKm: numeric("hr_km"),
    combustibleNombre: text("combustible_nombre"),
    maquinariaNombre: text("maquinaria_nombre"),
  },
  (table) => [
    uniqueIndex("despachos_period_airtable_idx").on(
      table.periodId,
      table.airtableId
    ),
  ]
);

// ── Uso de maquinaria ──

export const usoMaquinaria = pgTable(
  "uso_maquinaria",
  {
    id: serial("id").primaryKey(),
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id),
    airtableId: text("airtable_id").notNull(),
    numUso: integer("num_uso"),
    cantidadHrKm: numeric("cantidad_hr_km"),
    fechaUso: date("fecha_uso"),
    costoUso: numeric("costo_uso"),
    maquinariaNombre: text("maquinaria_nombre"),
    generadorCosto: text("generador_costo"),
    destino: text("destino"),
  },
  (table) => [
    uniqueIndex("uso_maquinaria_period_airtable_idx").on(
      table.periodId,
      table.airtableId
    ),
  ]
);
