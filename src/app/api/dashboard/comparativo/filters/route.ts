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
 * GET /api/dashboard/comparativo/filters
 *
 * Query params (all optional — act as context for cascading filter options):
 *   periodId     → filters unidades, tipos, destinos to this period
 *   unidadCosto  → "all" | "A||B||C" — filters tipos and destinos
 *   tipoDestino  → filters destinos
 *
 * Always returns:
 *   periodos       — all periods (static)
 *   unidadesCosto  — filtered by period
 *   tiposDestino   — filtered by period + unidades
 *   destinos       — filtered by period + unidades + tipo
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const periodId = searchParams.get("periodId");
  const unidadCostoParam = searchParams.get("unidadCosto") ?? "";
  const tipoDestinoParam = searchParams.get("tipoDestino") ?? "";

  const selectedUnidades =
    unidadCostoParam === "all" || unidadCostoParam === ""
      ? null
      : unidadCostoParam.split("||").map((s) => s.trim()).filter(Boolean);

  const selectedTipos =
    tipoDestinoParam === "all" || tipoDestinoParam === ""
      ? null
      : tipoDestinoParam.split("||").map((s) => s.trim()).filter(Boolean);

  try {
    // ── Períodos (always all, static) ──────────────────────────────────────
    const periodos = await pool.query(
      `SELECT id, label, name FROM periods ORDER BY id`
    );

    // ── Unidades de costo — filtered by period ──────────────────────────────
    const unidadesParams: (string)[] = [];
    let unidadesWhere = "WHERE a.unidad_costo IS NOT NULL";
    if (periodId) {
      unidadesWhere += ` AND a.period_id = $${unidadesParams.length + 1}`;
      unidadesParams.push(periodId);
    }
    const unidades = await pool.query(
      `SELECT unidad_costo, COUNT(*) as n
       FROM actividades a
       ${unidadesWhere}
       GROUP BY unidad_costo`,
      unidadesParams
    );

    // ── Tipos de destino — filtered by period + unidades ────────────────────
    const tiposParams: (string | string[])[] = [];
    let tiposWhere = "WHERE d.tipo IS NOT NULL";
    if (periodId) {
      tiposWhere += ` AND a.period_id = $${tiposParams.length + 1}`;
      tiposParams.push(periodId);
    }
    if (selectedUnidades && selectedUnidades.length > 0) {
      tiposWhere += ` AND a.unidad_costo = ANY($${tiposParams.length + 1}::text[])`;
      tiposParams.push(selectedUnidades);
    }
    const tipos = await pool.query(
      `SELECT d.tipo, COUNT(DISTINCT a.destino_subdestinos) as n
       FROM actividades a
       LEFT JOIN destinos d
         ON a.destino_subdestinos = d.id_destino
         AND a.period_id = d.period_id
       ${tiposWhere}
       GROUP BY d.tipo
       ORDER BY n DESC`,
      tiposParams
    );

    // ── Destinos — filtered by period + unidades + tipo ────────────────────
    const destinosParams: (string | string[])[] = [];
    let destinosWhere = "WHERE a.destino_subdestinos IS NOT NULL";
    if (periodId) {
      destinosWhere += ` AND a.period_id = $${destinosParams.length + 1}`;
      destinosParams.push(periodId);
    }
    if (selectedUnidades && selectedUnidades.length > 0) {
      destinosWhere += ` AND a.unidad_costo = ANY($${destinosParams.length + 1}::text[])`;
      destinosParams.push(selectedUnidades);
    }
    if (selectedTipos && selectedTipos.length > 0) {
      destinosWhere += ` AND d.tipo = ANY($${destinosParams.length + 1}::text[])`;
      destinosParams.push(selectedTipos);
    }
    const destinos = await pool.query(
      `SELECT a.destino_subdestinos AS destino, COUNT(*) AS n
       FROM actividades a
       LEFT JOIN destinos d
         ON a.destino_subdestinos = d.id_destino
         AND a.period_id = d.period_id
       ${destinosWhere}
       GROUP BY a.destino_subdestinos
       ORDER BY a.destino_subdestinos`,
      destinosParams
    );

    // ── Sort unidades numerically then alphabetically ───────────────────────
    const sortedUnidades = unidades.rows
      .map((r) => ({ value: r.unidad_costo as string, count: Number(r.n) }))
      .sort((a, b) => {
        const na = leadingNumber(a.value);
        const nb = leadingNumber(b.value);
        if (na !== nb) return na - nb;
        return a.value.localeCompare(b.value, "es");
      });

    return NextResponse.json({
      unidadesCosto: sortedUnidades,
      periodos: periodos.rows,
      tiposDestino: tipos.rows.map((r) => ({
        value: r.tipo,
        count: Number(r.n),
      })),
      destinos: destinos.rows.map((r) => ({
        value: r.destino,
        count: Number(r.n),
      })),
    });
  } catch (error) {
    console.error("Filter API error:", error);
    return NextResponse.json(
      { error: "Error al obtener filtros" },
      { status: 500 }
    );
  }
}
