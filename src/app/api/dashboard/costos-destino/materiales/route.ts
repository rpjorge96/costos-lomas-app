import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

const KEY_MAT_FILTER = `
  (LOWER(sm.material_nombre) LIKE '%cemento%'
   OR LOWER(sm.material_nombre) LIKE '%arena%'
   OR LOWER(sm.material_nombre) LIKE '%piedrin%'
   OR LOWER(sm.material_nombre) LIKE '%piedrín%'
   OR LOWER(sm.material_nombre) LIKE '%hierro%'
   OR LOWER(sm.material_nombre) LIKE '%block%')
`;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const destino = searchParams.get("destino");
  const periodId = searchParams.get("periodId");

  if (!destino) {
    return NextResponse.json(
      { error: "destino es requerido" },
      { status: 400 }
    );
  }

  try {
    const params: string[] = [destino];
    let idx = 2;
    let periodWhere = "";

    if (periodId) {
      periodWhere = `AND sm.period_id = $${idx}`;
      params.push(periodId);
      idx++;
    }

    // ── Query A: All materials aggregated ──
    const matResult = await pool.query(
      `SELECT
         sm.material_nombre,
         SUM(sm.cantidad_enviada::numeric) AS cantidad_total,
         SUM(sm.costo_material::numeric) AS costo_total,
         sm.unidad_medida,
         COUNT(*)::int AS num_salidas
       FROM salida_materiales sm
       WHERE sm.destino_subdestinos = $1
         ${periodWhere}
       GROUP BY sm.material_nombre, sm.unidad_medida
       ORDER BY costo_total DESC`,
      params
    );

    const totalMaterialCost = matResult.rows.reduce(
      (sum: number, r: any) => sum + Number(r.costo_total),
      0
    );

    // ── Query B: UC principal for each material ──
    // sm.num_actividad contains activity names (text), matched to a.actividad
    const ucPrincipalResult = await pool.query(
      `SELECT DISTINCT ON (sm.material_nombre)
         sm.material_nombre,
         ua.unidad_costo,
         SUM(sm.costo_material::numeric) AS costo
       FROM salida_materiales sm
       JOIN (
         SELECT DISTINCT ON (TRIM(actividad), period_id, destino_subdestinos)
           TRIM(actividad) AS actividad, period_id, destino_subdestinos, unidad_costo
         FROM actividades
         WHERE destino_subdestinos = $1
           AND unidad_costo IS NOT NULL
         ORDER BY TRIM(actividad), period_id, destino_subdestinos, costo_total DESC NULLS LAST
       ) ua
         ON TRIM(sm.num_actividad) = ua.actividad
         AND sm.period_id = ua.period_id
         AND sm.destino_subdestinos = ua.destino_subdestinos
       WHERE sm.destino_subdestinos = $1
         ${periodWhere}
       GROUP BY sm.material_nombre, ua.unidad_costo
       ORDER BY sm.material_nombre, costo DESC`,
      params
    );

    const ucMap: Record<string, string> = {};
    ucPrincipalResult.rows.forEach((r: any) => {
      ucMap[r.material_nombre] = r.unidad_costo;
    });

    const materiales = matResult.rows.map((r: any) => ({
      materialNombre: r.material_nombre,
      cantidadTotal: Number(r.cantidad_total),
      costoTotal: Number(r.costo_total),
      unidadMedida: r.unidad_medida,
      numSalidas: Number(r.num_salidas),
      ucPrincipal: ucMap[r.material_nombre] ?? null,
      pctTotalMateriales:
        totalMaterialCost > 0
          ? (Number(r.costo_total) / totalMaterialCost) * 100
          : 0,
    }));

    // Key materials only
    const keyPattern = /cemento|arena|piedr[ií]n|hierro|block/i;
    const materialesClave = materiales.filter((m: any) =>
      keyPattern.test(m.materialNombre)
    );

    // ── Query C: Matrix material × UC ──
    const matrizResult = await pool.query(
      `SELECT
         sm.material_nombre,
         ua.unidad_costo,
         COALESCE(SUM(sm.costo_material::numeric), 0) AS costo,
         COALESCE(SUM(sm.cantidad_enviada::numeric), 0) AS cantidad
       FROM salida_materiales sm
       JOIN (
         SELECT DISTINCT ON (TRIM(actividad), period_id, destino_subdestinos)
           TRIM(actividad) AS actividad, period_id, destino_subdestinos, unidad_costo
         FROM actividades
         WHERE destino_subdestinos = $1
           AND unidad_costo IS NOT NULL
         ORDER BY TRIM(actividad), period_id, destino_subdestinos, costo_total DESC NULLS LAST
       ) ua
         ON TRIM(sm.num_actividad) = ua.actividad
         AND sm.period_id = ua.period_id
         AND sm.destino_subdestinos = ua.destino_subdestinos
       WHERE sm.destino_subdestinos = $1
         ${periodWhere}
         AND ${KEY_MAT_FILTER}
       GROUP BY sm.material_nombre, ua.unidad_costo
       ORDER BY sm.material_nombre, ua.unidad_costo`,
      params
    );

    const matriz = matrizResult.rows.map((r: any) => ({
      materialNombre: r.material_nombre,
      unidadCosto: r.unidad_costo,
      costo: Number(r.costo),
      cantidad: Number(r.cantidad),
    }));

    return NextResponse.json({
      materiales,
      materialesClave,
      matriz,
    });
  } catch (error) {
    console.error("Costos destino materiales error:", error);
    return NextResponse.json(
      { error: "Error al obtener materiales" },
      { status: 500 }
    );
  }
}
