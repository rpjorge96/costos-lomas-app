import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "50")));
  const sortCol = searchParams.get("sort") || "id_destino";
  const sortDir = searchParams.get("dir") === "desc" ? "DESC" : "ASC";
  const offset = (page - 1) * pageSize;

  // Get period IDs for dynamic column generation
  const periodsRes = await pool.query("SELECT id, label FROM periods ORDER BY id");
  const periods: { id: string; label: string }[] = periodsRes.rows;

  // Build the pivot columns dynamically
  const costFields = ["costo_total", "costo_materiales", "costo_mod", "costo_moi", "costo_maquinaria"];

  const pivotCols = periods.flatMap((p) =>
    costFields.map(
      (f) => `MAX(CASE WHEN period_id = '${p.id}' THEN ${f}::numeric END) AS "${f}_${p.id}"`
    )
  );

  // Estatus from the most recent period
  const estatusCol = `MAX(CASE WHEN period_id = '${periods[periods.length - 1]?.id ?? ""}' THEN estatus END) AS estatus`;

  // WHERE for search
  const conditions: string[] = ["id_destino IS NOT NULL"];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`(id_destino ILIKE $${paramIdx} OR tipo ILIKE $${paramIdx} OR descripcion ILIKE $${paramIdx})`);
    values.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Validate sort column - allow id_destino, tipo, estatus, or any cost pivot column
  const validBaseCols = ["id_destino", "tipo", "estatus"];
  const validPivotCols = periods.flatMap((p) => costFields.map((f) => `${f}_${p.id}`));
  const allValidCols = [...validBaseCols, ...validPivotCols];
  const safeSortCol = allValidCols.includes(sortCol) ? sortCol : "id_destino";

  // Need to wrap pivot sort cols in quotes since they contain underscores and period ids
  const orderByExpr = validBaseCols.includes(safeSortCol)
    ? safeSortCol
    : `"${safeSortCol}"`;

  try {
    // Count unique destinos
    const countRes = await pool.query(
      `SELECT COUNT(DISTINCT id_destino) as count FROM destinos ${whereClause}`,
      values
    );

    // Main grouped query
    const dataQuery = `
      SELECT
        id_destino,
        MAX(tipo) AS tipo,
        MAX(descripcion) AS descripcion,
        ${estatusCol},
        ${pivotCols.join(",\n        ")}
      FROM destinos
      ${whereClause}
      GROUP BY id_destino
      ORDER BY ${orderByExpr} ${sortDir} NULLS LAST
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const dataRes = await pool.query(dataQuery, [...values, pageSize, offset]);
    const totalCount = parseInt(countRes.rows[0].count);

    return NextResponse.json({
      data: dataRes.rows,
      periods,
      costFields,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (err) {
    console.error("Query error:", err);
    return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  }
}
