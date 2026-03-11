export interface AirtablePeriod {
  id: string;
  baseId: string;
  label: string;
  name: string;
}

export const PERIODS: AirtablePeriod[] = [
  {
    id: "26082024",
    baseId: "appITXrOzgwjKb33J",
    label: "26/08/2024",
    name: "Las Lomas 26082024",
  },
  {
    id: "03032025",
    baseId: "appTwjjuIdiiUfEui",
    label: "03/03/2025",
    name: "Las Lomas 03032025",
  },
  {
    id: "08092025",
    baseId: "appevAYigVZDu4XW9",
    label: "08/09/2025",
    name: "Las Lomas 08092025",
  },
  {
    id: "01032026",
    baseId: "appNI5yrjKex925u1",
    label: "01/03/2026",
    name: "Las Lomas 01032026",
  },
];

// Table IDs (same across all bases)
export const TABLES = {
  actividades: {
    id: "tbl92ILDLwQW2FPs9",
    name: "Actividades y costos",
  },
  destinos: {
    id: "tblVUtbB8KwvkwfhB",
    name: "Destinos",
  },
  materiales: {
    id: "tblO7kPnCCi2AhO6w",
    name: "Materiales",
  },
  salidaMateriales: {
    id: "tblPmU2nESsmkrZrf",
    name: "Salida de Materiales",
  },
  combustibles: {
    id: "tblZ4S1LGeEUDvIN1",
    name: "Combustibles",
  },
  despachosCombustible: {
    id: "tblk99irfErOaH6Dn",
    name: "Despachos de combustibles",
  },
  usoMaquinaria: {
    id: "tbl2AUzM3llDkvkl6",
    name: "Uso de maquinaria",
  },
} as const;

export type TableKey = keyof typeof TABLES;

// Field IDs to fetch per table (only the fields we need)
export const FIELD_IDS: Record<TableKey, string[]> = {
  actividades: [
    "fldgF4UKI4ECmIMwp", // # Actividad
    "fldhgcxLXNAvKuGM2", // Fecha actividad
    "fld8wkJbEactlmPsF", // Unidad de Costo
    "fldcI8jhajvx3ee8q", // Duracion
    "fldGak9UH16Rb5eaZ", // Actividad
    "fldrkYMlDiz8UnuaQ", // Costo total
    "flde91EtNmxy6bo5j", // MOD
    "fldDSbDRC2FbrJ4rP", // MOI
    "fldcAZHvNlPo3zsUW", // Costo materiales actividad
    "fldyUMs7FEOXtiHSo", // Maquinaria_costo
    "fldCgH5RXH43aIHnD", // Destino y subdestinos
    "fldTwPgdaaMTBy2fs", // Subdestino
  ],
  destinos: [
    "fld3UGDEy1qNjlres", // ID_DESTINO
    "fldjTloVmEmGIRWbi", // Tipo
    "fldRm9fOcs5yl2Gc8", // Costo total
    "fldJsqPRK9gl7UwEK", // Costo Materiales
    "fldFVgjPexDrlJgQk", // Costo MOD
    "fldz7BcdgODPD2c2Q", // Costo MOI
    "fldbw28FSmqc7VTHC", // Costo Maquinaria
    "fldYrVw9cs4QTomWP", // Estatus
    "fld896yC1zuB0KfFM", // Descripcion
  ],
  materiales: [
    "fldN6tvSBYB2cX9ao", // ID_MATERIALES
    "fld2HlZprHJSLGJVW", // Unidad de medida material
    "fldGcji3923FNP11a", // Precio promedio ponderado
    "fld4Veo3NaYfzPYQM", // Disponible material CENTRAL
    "fld0ysJFZZ7f1D78m", // Total compras Q
    "fldWnttBlUAKMs3KM", // Total ingresos
    "fldRutMFRyLNARmOl", // Total Salidas
  ],
  salidaMateriales: [
    "fldrwZUJ33RDUzDAf", // # USO
    "fldrr9GGrMQ309tNA", // MATERIAL ACTIVIDAD (link)
    "fld9BqGI1xhHaqYSc", // Cantidad enviada
    "fldVGGF4rB2e9Dqo0", // Costo material enviado
    "fldrqy3jQa8GQRHhb", // Fecha salida material
    "fldOfByZZrAhUgS0W", // Destino y subdestinos
    "fldsfTBWiKAAH5B8z", // U medida
    "fldymYwQg5iHAaeKb", // ACT (actividad lookup)
  ],
  combustibles: [
    "fldXUvhIKBDPJ1kC7", // ID_COMBUSTIBLE
    "fldCaCnk8naNEPz6U", // Disponible
    "fldvgWfVu9IgVAvNx", // Unidad de medida
    "fldhi8V5CJk9topnW", // Precio promedio ponderado
    "fldx4wGUrTyQGq6kl", // Total comprado
    "fld7yJNKlijeWVehD", // Total utilizado
    "fldyiLlyeaRhQuvnb", // Total compras Q
  ],
  despachosCombustible: [
    "fldl0YhgTeAiA4uko", // ID_DESPACHO
    "fldUd3qj4K3TgCfIT", // Fecha despacho
    "fldclrgDkJx3bxElm", // Cantidad despachada
    "fldxrYVQzeb0hJAfO", // Costo despacho
    "fldix43WsFQDIEG1E", // Observaciones
    "fldlQuQBkWi8qVYkQ", // Hr / Km
    "fldSOIjoxoXqqdytI", // ID_COMBUSTIBLE (linked record → resolve post-sync)
    "fld8o0itkDKgwXbwR", // ID_MAQUINARIA (linked record → resolve from resumen)
    "fldkSnK5zNoXTuMeH", // Resumen despacho (formula con nombres)
  ],
  usoMaquinaria: [
    "flddw8zg0LGzw7Qxj", // # Uso maquinaria
    "fldAdUsfrVP3LnuuG", // Cantidad hr / km
    "fldUx0OuuEBtviONl", // Fecha uso maquinaria
    "fldsEHSmhUSVKmeqy", // Costo uso maquinaria
    "fld1ekyQxzqtJRTpr", // ID_MAQUINARIA (linked record → resolve from formula)
    "fldYVJlRPChP0yw19", // Costo hr / km MAQUINARIA (lookup)
    "fld2Byq1r5TzNhSbF", // ID_USO_MAQUINARIA (formula con nombre maquinaria)
    "fldTJsdHROMcMFNvY", // ID_DESTINO (from ID_ACTIVIDAD) (lookup)
  ],
};
