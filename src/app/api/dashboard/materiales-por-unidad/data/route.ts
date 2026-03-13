import { NextRequest, NextResponse } from "next/server";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

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
 * GET /api/dashboard/materiales-por-unidad/data
 *
 * Query params:
 *   periodId     → optional period filter
 *   unidadCosto  → "all" | "A||B" — filter by cost unit
 *   destinos     → "all" | "A||B" — filter by destination
 *   materiales   → "all" | "A||B" — filter by material name
 *   limit        → max materials for pareto (default 30)
 *
 * Returns: { totals, pareto, porUnidadCosto, topMaterials, matrix, matrixDestinos, comparativa }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const periodId = searchParams.get("periodId");
  const unidadCostoParam = searchParams.get("unidadCosto") ?? "";
  const destinosParam = searchParams.get("destinos") ?? "";
  const materialesParam = searchParams.get("materiales") ?? "";
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const selectedUnidades =
    unidadCostoParam === "all" || unidadCostoParam === ""
      ? null
      : unidadCostoParam.split("||").map((s) => s.trim()).filter(Boolean);

  const selectedDestinos =
    destinosParam === "all" || destinosParam === ""
      ? null
      : destinosParam.split("||").map((s) => s.trim()).filter(Boolean);

  const selectedMateriales =
    materialesParam === "all" || materialesParam === ""
      ? null
      : materialesParam.split("||").map((s) => s.trim()).filter(Boolean);

  try {
    // ── Build shared WHERE clause ──
    const params: (string | number | string[])[] = [];
    let paramIdx = 1;
    let where = "WHERE 1=1";

    if (periodId) {
      where += ` AND sm.period_id = $${paramIdx}`;
      params.push(periodId);
      paramIdx++;
    }
    if (selectedUnidades && selectedUnidades.length > 0) {
      where += ` AND uc.unidad_costo = ANY($${paramIdx}::text[])`;
      params.push(selectedUnidades);
      paramIdx++;
    }
    if (selectedDestinos && selectedDestinos.length > 0) {
      where += ` AND sm.destino_subdestinos = ANY($${paramIdx}::text[])`;
      params.push(selectedDestinos);
      paramIdx++;
    }
    if (selectedMateriales && selectedMateriales.length > 0) {
      where += ` AND sm.material_nombre = ANY($${paramIdx}::text[])`;
      params.push(selectedMateriales);
      paramIdx++;
    }

    const baseFrom = `
      FROM salida_materiales sm
      LEFT JOIN ${ACT_LOOKUP} uc
        ON TRIM(sm.num_actividad) = uc.actividad_name
        AND sm.destino_subdestinos = uc.destino_subdestinos
        AND sm.period_id = uc.period_id
    `;

    // ── 1. Totals ──
    const totalsResult = await pool.query(
      `SELECT
        COALESCE(SUM(sm.costo_material::numeric), 0) AS costo_total,
        COUNT(*)::int AS total_despachos,
        COUNT(DISTINCT sm.material_nombre) AS materiales_unicos,
        COALESCE(SUM(sm.cantidad_enviada::numeric), 0) AS cantidad_total,
        COUNT(DISTINCT sm.destino_subdestinos) AS destinos_count
      ${baseFrom}
      ${where}`,
      params
    );

    const totals = {
      costoTotal: Number(totalsResult.rows[0]?.costo_total) || 0,
      totalDespachos: Number(totalsResult.rows[0]?.total_despachos) || 0,
      materialesUnicos: Number(totalsResult.rows[0]?.materiales_unicos) || 0,
      cantidadTotal: Number(totalsResult.rows[0]?.cantidad_total) || 0,
      destinosCount: Number(totalsResult.rows[0]?.destinos_count) || 0,
    };

    // ── 2. Pareto — materials ranked by total cost ──
    const paretoParams = [...params, limit];
    const paretoResult = await pool.query(
      `SELECT
        sm.material_nombre,
        COALESCE(SUM(sm.costo_material::numeric), 0) AS costo,
        COALESCE(SUM(sm.cantidad_enviada::numeric), 0) AS cantidad,
        COUNT(*)::int AS despachos,
        sm.unidad_medida
      ${baseFrom}
      ${where}
      GROUP BY sm.material_nombre, sm.unidad_medida
      ORDER BY costo DESC
      LIMIT $${paramIdx}`,
      paretoParams
    );

    let cumSum = 0;
    const grandTotal = totals.costoTotal || 1;
    const pareto = paretoResult.rows.map((r) => {
      const costo = Number(r.costo) || 0;
      cumSum += costo;
      return {
        material: r.material_nombre,
        costo,
        cantidad: Number(r.cantidad) || 0,
        despachos: Number(r.despachos),
        unidadMedida: r.unidad_medida,
        pct: (costo / grandTotal) * 100,
        cumPct: (cumSum / grandTotal) * 100,
      };
    });

    // ── 3. Por Unidad de Costo — cost by cost unit (for stacked bar) ──
    const porUCResult = await pool.query(
      `SELECT
        COALESCE(uc.unidad_costo, 'Sin unidad') AS unidad_costo,
        sm.material_nombre,
        COALESCE(SUM(sm.costo_material::numeric), 0) AS costo
      ${baseFrom}
      ${where}
      GROUP BY uc.unidad_costo, sm.material_nombre
      ORDER BY uc.unidad_costo, costo DESC`,
      params
    );

    // Group by unidad_costo, keep top materials per unit
    const ucMap = new Map<string, { unidadCosto: string; materiales: Record<string, number>; total: number }>();
    for (const r of porUCResult.rows) {
      const ucName = r.unidad_costo || "Sin unidad";
      if (!ucMap.has(ucName)) ucMap.set(ucName, { unidadCosto: ucName, materiales: {}, total: 0 });
      const entry = ucMap.get(ucName)!;
      const costo = Number(r.costo) || 0;
      entry.materiales[r.material_nombre] = costo;
      entry.total += costo;
    }
    const porUnidadCosto = Array.from(ucMap.values())
      .sort((a, b) => b.total - a.total);

    // Collect top materials across all units for consistent stacking
    const materialTotals = new Map<string, number>();
    for (const uc of porUnidadCosto) {
      for (const [mat, costo] of Object.entries(uc.materiales)) {
        materialTotals.set(mat, (materialTotals.get(mat) || 0) + costo);
      }
    }
    const topMaterials = Array.from(materialTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([m]) => m);

    // Restructure for chart: each row = one unidad_costo with top material keys
    const porUnidadCostoChart = porUnidadCosto.map((uc) => {
      const row: Record<string, string | number> = {
        name: uc.unidadCosto,
        total: uc.total,
      };
      let otros = 0;
      for (const [mat, costo] of Object.entries(uc.materiales)) {
        if (topMaterials.includes(mat)) {
          row[mat] = costo;
        } else {
          otros += costo;
        }
      }
      if (otros > 0) row["Otros"] = otros;
      return row;
    });

    // ── 4. Matrix Material x Destino ──
    const matrixResult = await pool.query(
      `SELECT
        sm.material_nombre,
        sm.destino_subdestinos AS destino,
        COALESCE(SUM(sm.costo_material::numeric), 0) AS costo,
        COALESCE(SUM(sm.cantidad_enviada::numeric), 0) AS cantidad
      ${baseFrom}
      ${where}
      GROUP BY sm.material_nombre, sm.destino_subdestinos
      ORDER BY sm.material_nombre, destino`,
      params
    );

    // Build matrix structure
    const matDestinos = new Set<string>();
    const matMaterials = new Map<string, { total: number; byDestino: Record<string, { costo: number; cantidad: number }> }>();

    for (const r of matrixResult.rows) {
      const mat = r.material_nombre;
      const dest = r.destino;
      const costo = Number(r.costo) || 0;
      const cantidad = Number(r.cantidad) || 0;

      matDestinos.add(dest);
      if (!matMaterials.has(mat)) {
        matMaterials.set(mat, { total: 0, byDestino: {} });
      }
      const entry = matMaterials.get(mat)!;
      entry.total += costo;
      entry.byDestino[dest] = { costo, cantidad };
    }

    const sortedMatDestinos = Array.from(matDestinos).sort();
    const matrix = Array.from(matMaterials.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, limit)
      .map(([material, data]) => ({
        material,
        total: data.total,
        destinos: data.byDestino,
      }));

    // ── 5. Comparativa — detailed by destino ──
    const compResult = await pool.query(
      `SELECT
        sm.destino_subdestinos AS destino,
        COALESCE(SUM(sm.costo_material::numeric), 0) AS costo_total,
        COALESCE(SUM(sm.cantidad_enviada::numeric), 0) AS cantidad_total,
        COUNT(*)::int AS despachos,
        COUNT(DISTINCT sm.material_nombre) AS materiales_unicos
      ${baseFrom}
      ${where}
      GROUP BY sm.destino_subdestinos
      ORDER BY costo_total DESC`,
      params
    );

    const comparativa = compResult.rows.map((r) => ({
      destino: r.destino,
      costoTotal: Number(r.costo_total) || 0,
      cantidadTotal: Number(r.cantidad_total) || 0,
      despachos: Number(r.despachos),
      materialesUnicos: Number(r.materiales_unicos),
    }));

    return NextResponse.json({
      totals,
      pareto,
      porUnidadCosto: porUnidadCostoChart,
      topMaterials: [...topMaterials, ...(materialTotals.size > topMaterials.length ? ["Otros"] : [])],
      matrix,
      matrixDestinos: sortedMatDestinos,
      comparativa,
    });
  } catch (error) {
    console.error("Materiales data API error:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de materiales" },
      { status: 500 }
    );
  }
}
