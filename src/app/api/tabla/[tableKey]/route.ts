import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { TABLE_CONFIGS } from "@/lib/table-config";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableKey: string }> }
) {
  const { tableKey } = await params;
  const config = TABLE_CONFIGS[tableKey];
  if (!config) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const periodId = searchParams.get("period") || null;
  const search = searchParams.get("search") || null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "50")));
  const sortCol = searchParams.get("sort") || null;
  const sortDir = searchParams.get("dir") === "desc" ? "DESC" : "ASC";

  const tableName = config.dbTable;
  const offset = (page - 1) * pageSize;

  // Build WHERE conditions
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (periodId) {
    conditions.push(`period_id = $${paramIdx++}`);
    values.push(periodId);
  }

  if (search) {
    const textCols = config.columns
      .filter((c) => c.type === "text")
      .map((c) => c.key);
    if (textCols.length > 0) {
      const searchConditions = textCols.map(
        (col) => `COALESCE(${col}::text, '') ILIKE $${paramIdx}`
      );
      conditions.push(`(${searchConditions.join(" OR ")})`);
      values.push(`%${search}%`);
      paramIdx++;
    }
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Validate sort column
  const validSortCol =
    sortCol && config.columns.some((c) => c.key === sortCol)
      ? sortCol
      : config.columns[0]?.key || "id";

  try {
    const countRes = await pool.query(
      `SELECT COUNT(*)::text as count FROM ${tableName} ${whereClause}`,
      values
    );

    const selectCols = ["period_id", ...config.columns.map((c) => c.key)].join(", ");
    const dataRes = await pool.query(
      `SELECT ${selectCols}
       FROM ${tableName}
       ${whereClause}
       ORDER BY ${validSortCol} ${sortDir} NULLS LAST
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...values, pageSize, offset]
    );

    const totalCount = parseInt(countRes.rows[0].count);

    return NextResponse.json({
      data: dataRes.rows,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (err) {
    console.error("Query error:", err);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
