import { NextResponse } from "next/server";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

/** Extract leading number from strings like "1 Cimientos", "8.1 Herrería" → 1, 8.1, or Infinity */
function leadingNumber(s: string): number {
  const m = s.match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : Infinity;
}

export async function GET() {
  try {
    // Unidades de costo with record counts (sorted numerically then alphabetically)
    const unidades = await pool.query(`
      SELECT unidad_costo, COUNT(*) as n
      FROM actividades
      WHERE unidad_costo IS NOT NULL
      GROUP BY unidad_costo
    `);

    // Períodos
    const periodos = await pool.query(`
      SELECT id, label, name FROM periods ORDER BY id
    `);

    // Tipos de destino
    const tipos = await pool.query(`
      SELECT tipo, COUNT(*) as n
      FROM destinos
      WHERE tipo IS NOT NULL
      GROUP BY tipo
      ORDER BY n DESC
    `);

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
    });
  } catch (error) {
    console.error("Filter API error:", error);
    return NextResponse.json(
      { error: "Error al obtener filtros" },
      { status: 500 }
    );
  }
}
