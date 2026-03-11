// Central config for UI table display

export interface ColumnDef {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "currency";
  align?: "left" | "right" | "center";
}

export interface TableConfig {
  key: string;
  dbTable: string;
  name: string;
  icon: string;
  columns: ColumnDef[];
}

export const TABLE_CONFIGS: Record<string, TableConfig> = {
  actividades: {
    key: "actividades",
    dbTable: "actividades",
    name: "Actividades y Costos",
    icon: "📋",
    columns: [
      { key: "num_actividad", label: "# Actividad", type: "number", align: "center" },
      { key: "fecha_actividad", label: "Fecha", type: "date" },
      { key: "actividad", label: "Actividad", type: "text" },
      { key: "unidad_costo", label: "Unidad de Costo", type: "text" },
      { key: "costo_total", label: "Costo Total", type: "currency", align: "right" },
      { key: "mod", label: "MOD", type: "currency", align: "right" },
      { key: "moi", label: "MOI", type: "currency", align: "right" },
      { key: "costo_materiales", label: "Materiales", type: "currency", align: "right" },
      { key: "maquinaria_costo", label: "Maquinaria", type: "currency", align: "right" },
      { key: "destino_subdestinos", label: "Destino", type: "text" },
      { key: "subdestino", label: "Subdestino", type: "text" },
    ],
  },
  destinos: {
    key: "destinos",
    dbTable: "destinos",
    name: "Destinos",
    icon: "📍",
    columns: [
      { key: "id_destino", label: "ID Destino", type: "text" },
      { key: "tipo", label: "Tipo", type: "text" },
      { key: "descripcion", label: "Descripción", type: "text" },
      { key: "estatus", label: "Estatus", type: "text", align: "center" },
      { key: "costo_total", label: "Costo Total", type: "currency", align: "right" },
      { key: "costo_materiales", label: "Materiales", type: "currency", align: "right" },
      { key: "costo_mod", label: "MOD", type: "currency", align: "right" },
      { key: "costo_moi", label: "MOI", type: "currency", align: "right" },
      { key: "costo_maquinaria", label: "Maquinaria", type: "currency", align: "right" },
    ],
  },
  materiales: {
    key: "materiales",
    dbTable: "materiales",
    name: "Materiales",
    icon: "🧱",
    columns: [
      { key: "id_materiales", label: "Material", type: "text" },
      { key: "unidad_medida", label: "Unidad", type: "text", align: "center" },
      { key: "precio_prom_ponderado", label: "Precio Prom.", type: "currency", align: "right" },
      { key: "disponible_central", label: "Disponible", type: "number", align: "right" },
      { key: "total_compras_q", label: "Total Compras Q", type: "currency", align: "right" },
      { key: "total_ingresos", label: "Total Ingresos", type: "number", align: "right" },
      { key: "total_salidas", label: "Total Salidas", type: "number", align: "right" },
    ],
  },
  salidaMateriales: {
    key: "salidaMateriales",
    dbTable: "salida_materiales",
    name: "Salida de Materiales",
    icon: "📦",
    columns: [
      { key: "num_uso", label: "# Uso", type: "number", align: "center" },
      { key: "material_nombre", label: "Material", type: "text" },
      { key: "cantidad_enviada", label: "Cantidad", type: "number", align: "right" },
      { key: "unidad_medida", label: "Unidad", type: "text", align: "center" },
      { key: "costo_material", label: "Costo", type: "currency", align: "right" },
      { key: "fecha_salida", label: "Fecha Salida", type: "date" },
      { key: "destino_subdestinos", label: "Destino", type: "text" },
      { key: "num_actividad", label: "# Actividad", type: "text", align: "center" },
    ],
  },
  combustibles: {
    key: "combustibles",
    dbTable: "combustibles",
    name: "Combustibles",
    icon: "⛽",
    columns: [
      { key: "id_combustible", label: "ID Combustible", type: "text" },
      { key: "unidad_medida", label: "Unidad", type: "text", align: "center" },
      { key: "precio_prom_ponderado", label: "Precio Prom.", type: "currency", align: "right" },
      { key: "disponible", label: "Disponible", type: "number", align: "right" },
      { key: "total_comprado", label: "Total Comprado", type: "number", align: "right" },
      { key: "total_utilizado", label: "Total Utilizado", type: "number", align: "right" },
      { key: "total_compras_q", label: "Total Compras Q", type: "currency", align: "right" },
    ],
  },
  despachosCombustible: {
    key: "despachosCombustible",
    dbTable: "despachos_combustible",
    name: "Despachos de Combustible",
    icon: "🚛",
    columns: [
      { key: "num_despacho", label: "# Despacho", type: "number", align: "center" },
      { key: "fecha_despacho", label: "Fecha", type: "date" },
      { key: "combustible_nombre", label: "Combustible", type: "text" },
      { key: "cantidad_despachada", label: "Cantidad", type: "number", align: "right" },
      { key: "costo_despacho", label: "Costo", type: "currency", align: "right" },
      { key: "hr_km", label: "Hr / Km", type: "number", align: "right" },
      { key: "maquinaria_nombre", label: "Maquinaria", type: "text" },
      { key: "observaciones", label: "Observaciones", type: "text" },
    ],
  },
  usoMaquinaria: {
    key: "usoMaquinaria",
    dbTable: "uso_maquinaria",
    name: "Uso de Maquinaria",
    icon: "🏗️",
    columns: [
      { key: "num_uso", label: "# Uso", type: "number", align: "center" },
      { key: "fecha_uso", label: "Fecha", type: "date" },
      { key: "maquinaria_nombre", label: "Maquinaria", type: "text" },
      { key: "cantidad_hr_km", label: "Cant. Hr/Km", type: "number", align: "right" },
      { key: "costo_uso", label: "Costo", type: "currency", align: "right" },
      { key: "generador_costo", label: "Generador Costo", type: "text" },
      { key: "destino", label: "Destino", type: "text" },
    ],
  },
};

export const TABLE_KEYS = Object.keys(TABLE_CONFIGS);

export function formatValue(value: unknown, type: ColumnDef["type"]): string {
  if (value === null || value === undefined || value === "") return "—";
  const str = String(value);

  switch (type) {
    case "currency": {
      const num = parseFloat(str);
      if (isNaN(num)) return str;
      return `Q ${num.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    case "number": {
      const num = parseFloat(str);
      if (isNaN(num)) return str;
      return num.toLocaleString("es-GT");
    }
    case "date": {
      if (!str) return "—";
      try {
        const d = new Date(str);
        return d.toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" });
      } catch {
        return str;
      }
    }
    default:
      return str;
  }
}
