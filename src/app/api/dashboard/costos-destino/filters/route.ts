import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

function leadingNumber(s: string): number {
  const m = s.match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : Infinity;
}

export async function GET(request: NextRequest) {
  const periodId = request.nextUrl.searchParams.get("periodId");

  try {
    const periodParam = periodId ? [periodId] : [];
    const periodWhere = periodId ? "AND period_id = $1" : "";

    // 1. Periods
    const periodos = await pool.query(
      `SELECT id, label, name FROM periods ORDER BY id`
    );

    // 2. Destinos with activity counts (deduplicated by id_destino)
    const destinos = await pool.query(
      `SELECT d.id_destino,
              MAX(d.tipo) AS tipo,
              MAX(d.descripcion) AS descripcion,
              COUNT(DISTINCT a.id)::int AS n
       FROM destinos d
       LEFT JOIN actividades a
         ON a.destino_subdestinos = d.id_destino
         AND a.period_id = d.period_id
       WHERE d.id_destino IS NOT NULL
         ${periodId ? "AND d.period_id = $1" : ""}
       GROUP BY d.id_destino
       ORDER BY n DESC`,
      periodParam
    );

    // 3. Tipos de destino
    const tipos = await pool.query(
      `SELECT tipo, COUNT(*)::int AS n FROM destinos
       WHERE tipo IS NOT NULL ${periodWhere}
       GROUP BY tipo ORDER BY n DESC`,
      periodParam
    );

    // 4. Unidades de costo
    const unidades = await pool.query(
      `SELECT unidad_costo, COUNT(*)::int AS n FROM actividades
       WHERE unidad_costo IS NOT NULL ${periodWhere}
       GROUP BY unidad_costo`,
      periodParam
    );

    // 5. Subdestinos
    const subdestinos = await pool.query(
      `SELECT subdestino, COUNT(*)::int AS n FROM actividades
       WHERE subdestino IS NOT NULL ${periodWhere}
       GROUP BY subdestino ORDER BY subdestino`,
      periodParam
    );

    const sortedUnidades = unidades.rows
      .map((r: any) => ({ value: r.unidad_costo, count: Number(r.n) }))
      .sort((a: any, b: any) => {
        const na = leadingNumber(a.value);
        const nb = leadingNumber(b.value);
        return na !== nb ? na - nb : a.value.localeCompare(b.value, "es");
      });

    return NextResponse.json({
      periodos: periodos.rows,
      destinos: destinos.rows.map((r: any) => ({
        value: r.id_destino,
        count: Number(r.n),
        tipo: r.tipo,
        descripcion: r.descripcion,
      })),
      tiposDestino: tipos.rows.map((r: any) => ({
        value: r.tipo,
        count: Number(r.n),
      })),
      unidadesCosto: sortedUnidades,
      subdestinos: subdestinos.rows.map((r: any) => ({
        value: r.subdestino,
        count: Number(r.n),
      })),
    });
  } catch (error) {
    console.error("Costos destino filters error:", error);
    return NextResponse.json(
      { error: "Error al obtener filtros" },
      { status: 500 }
    );
  }
}
