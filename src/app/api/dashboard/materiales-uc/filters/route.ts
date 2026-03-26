import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export async function GET(request: NextRequest) {
  const periodId = request.nextUrl.searchParams.get("periodId");

  try {
    const periodParam = periodId ? [periodId] : [];

    // 1. Periods
    const periodos = await pool.query(
      `SELECT id, label, name FROM periods ORDER BY id`
    );

    // 2. Destinos with material exit counts
    const destinos = await pool.query(
      `SELECT d.id_destino,
              MAX(d.tipo) AS tipo,
              MAX(d.descripcion) AS descripcion,
              COUNT(DISTINCT sm.id)::int AS n
       FROM destinos d
       LEFT JOIN salida_materiales sm
         ON sm.destino_subdestinos = d.id_destino
         AND sm.period_id = d.period_id
       WHERE d.id_destino IS NOT NULL
         ${periodId ? "AND d.period_id = $1" : ""}
       GROUP BY d.id_destino
       ORDER BY n DESC`,
      periodParam
    );

    return NextResponse.json({
      periodos: periodos.rows,
      destinos: destinos.rows.map((r: any) => ({
        value: r.id_destino,
        count: Number(r.n),
        tipo: r.tipo,
        descripcion: r.descripcion,
      })),
    });
  } catch (error) {
    console.error("Materiales UC filters error:", error);
    return NextResponse.json(
      { error: "Error al obtener filtros" },
      { status: 500 }
    );
  }
}
