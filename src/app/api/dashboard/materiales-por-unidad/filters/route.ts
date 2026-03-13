import { NextRequest, NextResponse } from "next/server";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

function leadingNumber(s: string): number {
  const m = s.match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : Infinity;
}

/**
 * Deduplicated actividades subquery: one row per (actividad_name, destino, period).
 * Maps salida_materiales activity names to their unidad_costo.
 */
const ACT_LOOKUP = `(
  SELECT DISTINCT ON (TRIM(actividad), destino_subdestinos, period_id)
    TRIM(actividad) AS actividad_name,
    destino_subdestinos,
    period_id,
    unidad_costo
  FROM actividades
  WHERE actividad IS NOT NULL AND destino_subdestinos IS NOT NULL
)`;

/**
 * GET /api/dashboard/materiales-por-unidad/filters
 *
 * Cascading filters for the Materiales por Unidad de Costo dashboard.
 * Query params (all optional):
 *   periodId     → filters everything downstream
 *   unidadCosto  → "all" | "A||B" — filters destinos and materiales
 *   destinos     → "all" | "A||B" — filters materiales
 *
 * Returns:
 *   periodos       — all periods (static)
 *   unidadesCosto  — from actividades linked to salida_materiales, filtered by period
 *   destinos       — from salida_materiales joined with actividades, filtered by period + unidad
 *   materiales     — distinct material_nombre, filtered by period + unidad + destino
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const periodId = searchParams.get("periodId");
  const unidadCostoParam = searchParams.get("unidadCosto") ?? "";
  const destinosParam = searchParams.get("destinos") ?? "";

  const selectedUnidades =
    unidadCostoParam === "all" || unidadCostoParam === ""
      ? null
      : unidadCostoParam.split("||").map((s) => s.trim()).filter(Boolean);

  const selectedDestinos =
    destinosParam === "all" || destinosParam === ""
      ? null
      : destinosParam.split("||").map((s) => s.trim()).filter(Boolean);

  try {
    // ── Periodos (always all, static) ──
    const periodos = await pool.query(
      `SELECT id, label, name FROM periods ORDER BY id`
    );

    // ── Unidades de costo — from actividades linked to salida_materiales ──
    const unidadesParams: string[] = [];
    let unidadesWhere = "WHERE uc.unidad_costo IS NOT NULL";
    if (periodId) {
      unidadesWhere += ` AND sm.period_id = $${unidadesParams.length + 1}`;
      unidadesParams.push(periodId);
    }
    const unidades = await pool.query(
      `SELECT uc.unidad_costo, COUNT(DISTINCT sm.id) as n
       FROM salida_materiales sm
       LEFT JOIN ${ACT_LOOKUP} uc
         ON TRIM(sm.num_actividad) = uc.actividad_name
         AND sm.destino_subdestinos = uc.destino_subdestinos
         AND sm.period_id = uc.period_id
       ${unidadesWhere}
       GROUP BY uc.unidad_costo`,
      unidadesParams
    );

    // ── Destinos — filtered by period + unidades ──
    const destinosParams: (string | string[])[] = [];
    let destinosWhere = "WHERE sm.destino_subdestinos IS NOT NULL";
    if (periodId) {
      destinosWhere += ` AND sm.period_id = $${destinosParams.length + 1}`;
      destinosParams.push(periodId);
    }
    if (selectedUnidades && selectedUnidades.length > 0) {
      destinosWhere += ` AND uc.unidad_costo = ANY($${destinosParams.length + 1}::text[])`;
      destinosParams.push(selectedUnidades);
    }
    const destinos = await pool.query(
      `SELECT sm.destino_subdestinos AS destino, COUNT(*) AS n
       FROM salida_materiales sm
       LEFT JOIN ${ACT_LOOKUP} uc
         ON TRIM(sm.num_actividad) = uc.actividad_name
         AND sm.destino_subdestinos = uc.destino_subdestinos
         AND sm.period_id = uc.period_id
       ${destinosWhere}
       GROUP BY sm.destino_subdestinos
       ORDER BY sm.destino_subdestinos`,
      destinosParams
    );

    // ── Materiales — filtered by period + unidades + destinos ──
    const materialesParams: (string | string[])[] = [];
    let materialesWhere = "WHERE sm.material_nombre IS NOT NULL";
    if (periodId) {
      materialesWhere += ` AND sm.period_id = $${materialesParams.length + 1}`;
      materialesParams.push(periodId);
    }
    if (selectedUnidades && selectedUnidades.length > 0) {
      materialesWhere += ` AND uc.unidad_costo = ANY($${materialesParams.length + 1}::text[])`;
      materialesParams.push(selectedUnidades);
    }
    if (selectedDestinos && selectedDestinos.length > 0) {
      materialesWhere += ` AND sm.destino_subdestinos = ANY($${materialesParams.length + 1}::text[])`;
      materialesParams.push(selectedDestinos);
    }
    const materiales = await pool.query(
      `SELECT sm.material_nombre, COUNT(*) AS n
       FROM salida_materiales sm
       LEFT JOIN ${ACT_LOOKUP} uc
         ON TRIM(sm.num_actividad) = uc.actividad_name
         AND sm.destino_subdestinos = uc.destino_subdestinos
         AND sm.period_id = uc.period_id
       ${materialesWhere}
       GROUP BY sm.material_nombre
       ORDER BY n DESC`,
      materialesParams
    );

    // ── Sort unidades numerically ──
    const sortedUnidades = unidades.rows
      .map((r) => ({ value: r.unidad_costo as string, count: Number(r.n) }))
      .sort((a, b) => {
        const na = leadingNumber(a.value);
        const nb = leadingNumber(b.value);
        if (na !== nb) return na - nb;
        return a.value.localeCompare(b.value, "es");
      });

    return NextResponse.json({
      periodos: periodos.rows,
      unidadesCosto: sortedUnidades,
      destinos: destinos.rows.map((r) => ({
        value: r.destino,
        count: Number(r.n),
      })),
      materiales: materiales.rows.map((r) => ({
        value: r.material_nombre,
        count: Number(r.n),
      })),
    });
  } catch (error) {
    console.error("Materiales filter API error:", error);
    return NextResponse.json(
      { error: "Error al obtener filtros" },
      { status: 500 }
    );
  }
}
