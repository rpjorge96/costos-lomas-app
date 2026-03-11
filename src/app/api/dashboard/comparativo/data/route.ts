import { NextRequest, NextResponse } from "next/server";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface ComparativoRow {
  destino: string;
  tipoDestino: string | null;
  costoTotal: number;
  costoMod: number;
  costoMoi: number;
  costoMateriales: number;
  costoMaquinaria: number;
  pctMod: number;
  pctMoi: number;
  pctMateriales: number;
  pctMaquinaria: number;
  cantidadActividades: number;
  duracionTotal: number;
  duracionPromedio: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // Accept comma-separated list OR "all" to query everything
  const unidadCostoParam = searchParams.get("unidadCosto") ?? "";
  const destinosParam = searchParams.get("destinos") ?? "";
  const tipoDestinoParam = searchParams.get("tipoDestino") ?? "";
  const periodId = searchParams.get("periodId");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  // Parse multi-value lists ("all" or "||"-separated)
  const selectedUnidades = unidadCostoParam === "all" || unidadCostoParam === ""
    ? null
    : unidadCostoParam.split("||").map((s) => s.trim()).filter(Boolean);

  const selectedDestinos = destinosParam === "all" || destinosParam === ""
    ? null
    : destinosParam.split("||").map((s) => s.trim()).filter(Boolean);

  const selectedTipos = tipoDestinoParam === "all" || tipoDestinoParam === ""
    ? null
    : tipoDestinoParam.split("||").map((s) => s.trim()).filter(Boolean);

  if (selectedUnidades !== null && selectedUnidades.length === 0) {
    return NextResponse.json(
      { error: "unidadCosto es requerido" },
      { status: 400 }
    );
  }

  try {
    const params: (string | number | string[])[] = [];
    let whereUnidad = "";
    let paramIdx = 1;

    if (selectedUnidades !== null) {
      whereUnidad = `AND a.unidad_costo = ANY($${paramIdx}::text[])`;
      params.push(selectedUnidades);
      paramIdx++;
    }

    let whereExtra = "";

    if (periodId) {
      whereExtra += ` AND a.period_id = $${paramIdx}`;
      params.push(periodId);
      paramIdx++;
    }

    if (selectedTipos !== null && selectedTipos.length > 0) {
      whereExtra += ` AND d.tipo = ANY($${paramIdx}::text[])`;
      params.push(selectedTipos);
      paramIdx++;
    }

    if (selectedDestinos !== null && selectedDestinos.length > 0) {
      whereExtra += ` AND a.destino_subdestinos = ANY($${paramIdx}::text[])`;
      params.push(selectedDestinos);
      paramIdx++;
    }

    params.push(limit);

    const query = `
      SELECT
        a.destino_subdestinos AS destino,
        d.tipo AS tipo_destino,
        COUNT(*)::int AS cantidad_actividades,
        COALESCE(SUM(a.costo_total::numeric), 0) AS costo_total,
        COALESCE(SUM(a.mod::numeric), 0) AS costo_mod,
        COALESCE(SUM(a.moi::numeric), 0) AS costo_moi,
        COALESCE(SUM(a.costo_materiales::numeric), 0) AS costo_materiales,
        COALESCE(SUM(a.maquinaria_costo::numeric), 0) AS costo_maquinaria,
        COALESCE(SUM(a.duracion::numeric), 0) AS duracion_total,
        COALESCE(AVG(a.duracion::numeric), 0) AS duracion_promedio
      FROM actividades a
      LEFT JOIN destinos d
        ON a.destino_subdestinos = d.id_destino
        AND a.period_id = d.period_id
      WHERE a.destino_subdestinos IS NOT NULL
        ${whereUnidad}
        ${whereExtra}
      GROUP BY a.destino_subdestinos, d.tipo
      ORDER BY costo_total DESC
      LIMIT $${paramIdx}
    `;

    const result = await pool.query(query, params);

    const rows: ComparativoRow[] = result.rows.map((r) => {
      const ct = Number(r.costo_total) || 0;
      const mod = Number(r.costo_mod) || 0;
      const moi = Number(r.costo_moi) || 0;
      const mat = Number(r.costo_materiales) || 0;
      const maq = Number(r.costo_maquinaria) || 0;

      return {
        destino: r.destino,
        tipoDestino: r.tipo_destino,
        costoTotal: ct,
        costoMod: mod,
        costoMoi: moi,
        costoMateriales: mat,
        costoMaquinaria: maq,
        pctMod: ct > 0 ? (mod / ct) * 100 : 0,
        pctMoi: ct > 0 ? (moi / ct) * 100 : 0,
        pctMateriales: ct > 0 ? (mat / ct) * 100 : 0,
        pctMaquinaria: ct > 0 ? (maq / ct) * 100 : 0,
        cantidadActividades: Number(r.cantidad_actividades),
        duracionTotal: Number(r.duracion_total) || 0,
        duracionPromedio: Number(r.duracion_promedio) || 0,
      };
    });

    // Summary KPIs
    const totals = rows.reduce(
      (acc, r) => {
        acc.costoTotal += r.costoTotal;
        acc.costoMod += r.costoMod;
        acc.costoMoi += r.costoMoi;
        acc.costoMateriales += r.costoMateriales;
        acc.costoMaquinaria += r.costoMaquinaria;
        acc.cantidadActividades += r.cantidadActividades;
        acc.duracionTotal += r.duracionTotal;
        return acc;
      },
      {
        costoTotal: 0,
        costoMod: 0,
        costoMoi: 0,
        costoMateriales: 0,
        costoMaquinaria: 0,
        cantidadActividades: 0,
        duracionTotal: 0,
      }
    );

    // Boxplot data (distribution of costo_total across destinos)
    const costos = rows.map((r) => r.costoTotal).sort((a, b) => a - b);
    const q1Idx = Math.floor(costos.length * 0.25);
    const q3Idx = Math.floor(costos.length * 0.75);
    const medIdx = Math.floor(costos.length * 0.5);

    const boxplot = {
      min: costos[0] ?? 0,
      q1: costos[q1Idx] ?? 0,
      median: costos[medIdx] ?? 0,
      q3: costos[q3Idx] ?? 0,
      max: costos[costos.length - 1] ?? 0,
      mean: costos.length > 0 ? costos.reduce((a, b) => a + b, 0) / costos.length : 0,
    };

    return NextResponse.json({
      rows,
      totals,
      boxplot,
      count: rows.length,
    });
  } catch (error) {
    console.error("Comparativo API error:", error);
    return NextResponse.json(
      { error: "Error al obtener datos comparativos" },
      { status: 500 }
    );
  }
}
