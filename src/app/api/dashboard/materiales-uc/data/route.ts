import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

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

    // ── Query A: Materials grouped by UC ──
    // Note: sm.num_actividad contains activity NAMES (text), not IDs.
    // actividades can have duplicate (actividad, period, destino) with different UCs,
    // so we use DISTINCT ON to pick one UC per activity (highest cost) to avoid inflating totals.
    const matByUC = await pool.query(
      `SELECT
         ua.unidad_costo,
         sm.material_nombre,
         sm.unidad_medida,
         SUM(sm.cantidad_enviada::numeric) AS cantidad_total,
         SUM(sm.costo_material::numeric) AS costo_total,
         COUNT(*)::int AS num_salidas
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
       GROUP BY ua.unidad_costo, sm.material_nombre, sm.unidad_medida
       ORDER BY ua.unidad_costo, costo_total DESC`,
      params
    );

    // ── Query B: Destino info ──
    const destinoParams: string[] = [destino];
    let destinoPeriodWhere = "";
    if (periodId) {
      destinoPeriodWhere = "AND period_id = $2";
      destinoParams.push(periodId);
    }

    const destinoInfo = await pool.query(
      `SELECT id_destino, tipo, descripcion
       FROM destinos
       WHERE id_destino = $1 ${destinoPeriodWhere}
       LIMIT 1`,
      destinoParams
    );

    // ── Assemble data server-side ──
    const ucMap = new Map<
      string,
      { costoTotal: number; numSalidas: number; materiales: any[] }
    >();
    const globalMaterialCosts = new Map<string, number>();
    let costoTotalDestino = 0;

    for (const row of matByUC.rows) {
      const uc = row.unidad_costo;
      const costo = Number(row.costo_total);
      costoTotalDestino += costo;

      // Track global material costs for KPIs
      const prevGlobal = globalMaterialCosts.get(row.material_nombre) ?? 0;
      globalMaterialCosts.set(row.material_nombre, prevGlobal + costo);

      if (!ucMap.has(uc)) {
        ucMap.set(uc, { costoTotal: 0, numSalidas: 0, materiales: [] });
      }
      const entry = ucMap.get(uc)!;
      entry.costoTotal += costo;
      entry.numSalidas += Number(row.num_salidas);
      entry.materiales.push({
        materialNombre: row.material_nombre,
        cantidadTotal: Number(row.cantidad_total),
        costoTotal: costo,
        unidadMedida: row.unidad_medida,
        numSalidas: Number(row.num_salidas),
        pctCostoUC: 0, // computed below
      });
    }

    // Compute percentages and build final array
    const allMaterialNames = new Set<string>();
    const unidadesCosto = Array.from(ucMap.entries())
      .map(([uc, data]) => {
        const materiales = data.materiales.map((m: any) => {
          allMaterialNames.add(m.materialNombre);
          return {
            ...m,
            pctCostoUC:
              data.costoTotal > 0
                ? (m.costoTotal / data.costoTotal) * 100
                : 0,
          };
        });

        return {
          unidadCosto: uc,
          costoMaterialesTotal: data.costoTotal,
          numMateriales: materiales.length,
          numSalidas: data.numSalidas,
          pctDelDestino:
            costoTotalDestino > 0
              ? (data.costoTotal / costoTotalDestino) * 100
              : 0,
          materiales,
        };
      })
      .sort((a, b) => b.costoMaterialesTotal - a.costoMaterialesTotal);

    // KPIs
    let materialMasCostoso: { nombre: string; costo: number } | null = null;
    for (const [nombre, costo] of globalMaterialCosts.entries()) {
      if (!materialMasCostoso || costo > materialMasCostoso.costo) {
        materialMasCostoso = { nombre, costo };
      }
    }

    const ucConMasMateriales =
      unidadesCosto.length > 0
        ? {
            nombre: unidadesCosto[0].unidadCosto,
            costo: unidadesCosto[0].costoMaterialesTotal,
          }
        : null;

    const numSalidasTotal = matByUC.rows.reduce(
      (sum: number, r: any) => sum + Number(r.num_salidas),
      0
    );

    const info = destinoInfo.rows[0];

    const kpis = {
      destino,
      tipo: info?.tipo ?? null,
      descripcion: info?.descripcion ?? null,
      costoMaterialesTotal: costoTotalDestino,
      numUnidadesCosto: ucMap.size,
      numMaterialesDistintos: allMaterialNames.size,
      numSalidasTotal,
      materialMasCostoso,
      ucConMasMateriales,
    };

    return NextResponse.json({ kpis, unidadesCosto });
  } catch (error) {
    console.error("Materiales UC data error:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de materiales" },
      { status: 500 }
    );
  }
}
