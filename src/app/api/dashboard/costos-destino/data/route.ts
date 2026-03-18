import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

function dominantRubro(
  mod: number,
  moi: number,
  mat: number,
  maq: number
): string {
  const max = Math.max(mod, moi, mat, maq);
  if (max === 0) return "—";
  if (max === mat) return "Materiales";
  if (max === mod) return "MOD";
  if (max === moi) return "MOI";
  return "Maquinaria";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const destino = searchParams.get("destino");
  const periodId = searchParams.get("periodId");
  const unidadCosto = searchParams.get("unidadCosto");
  const subdestino = searchParams.get("subdestino");
  const fechaDesde = searchParams.get("fechaDesde");
  const fechaHasta = searchParams.get("fechaHasta");

  if (!destino) {
    return NextResponse.json(
      { error: "destino es requerido" },
      { status: 400 }
    );
  }

  try {
    // ── Build parameterized WHERE clause ──
    const params: (string | string[])[] = [destino];
    let idx = 2;
    const clauses: string[] = ["a.destino_subdestinos = $1"];

    if (periodId) {
      clauses.push(`a.period_id = $${idx}`);
      params.push(periodId);
      idx++;
    }
    if (unidadCosto) {
      clauses.push(`a.unidad_costo = ANY($${idx}::text[])`);
      params.push(unidadCosto.split("||"));
      idx++;
    }
    if (subdestino) {
      clauses.push(`a.subdestino = $${idx}`);
      params.push(subdestino);
      idx++;
    }
    if (fechaDesde) {
      clauses.push(`a.fecha_actividad >= $${idx}`);
      params.push(fechaDesde);
      idx++;
    }
    if (fechaHasta) {
      clauses.push(`a.fecha_actividad <= $${idx}`);
      params.push(fechaHasta);
      idx++;
    }

    const where = clauses.join(" AND ");

    // ── Query 1: Destino header info ──
    const smParams: (string | string[])[] = [destino];
    let smIdx = 2;
    let smPeriodWhere = "";
    if (periodId) {
      smPeriodWhere = `AND sm.period_id = $${smIdx}`;
      smParams.push(periodId);
      smIdx++;
    }

    const destinoInfo = await pool.query(
      `SELECT id_destino, tipo, descripcion
       FROM destinos
       WHERE id_destino = $1
         ${periodId ? "AND period_id = $2" : ""}
       LIMIT 1`,
      periodId ? [destino, periodId] : [destino]
    );

    // ── Query 2: Aggregation by unidad_costo ──
    const ucResult = await pool.query(
      `SELECT
         a.unidad_costo,
         COUNT(*)::int AS num_actividades,
         COALESCE(SUM(a.costo_total::numeric), 0) AS costo_total,
         COALESCE(SUM(a.mod::numeric), 0) AS costo_mod,
         COALESCE(SUM(a.moi::numeric), 0) AS costo_moi,
         COALESCE(SUM(a.costo_materiales::numeric), 0) AS costo_materiales,
         COALESCE(SUM(a.maquinaria_costo::numeric), 0) AS costo_maquinaria,
         COALESCE(SUM(a.duracion::numeric), 0) AS duracion_total
       FROM actividades a
       WHERE ${where}
         AND a.unidad_costo IS NOT NULL
       GROUP BY a.unidad_costo
       ORDER BY costo_total DESC`,
      params
    );

    // ── Query 3: Global totals ──
    const totalsResult = await pool.query(
      `SELECT
         COUNT(*)::int AS num_actividades,
         COUNT(DISTINCT a.unidad_costo)::int AS num_uc,
         COALESCE(SUM(a.costo_total::numeric), 0) AS costo_total,
         COALESCE(SUM(a.mod::numeric), 0) AS costo_mod,
         COALESCE(SUM(a.moi::numeric), 0) AS costo_moi,
         COALESCE(SUM(a.costo_materiales::numeric), 0) AS costo_materiales,
         COALESCE(SUM(a.maquinaria_costo::numeric), 0) AS costo_maquinaria,
         COUNT(*) FILTER (WHERE a.mod::numeric > 0)::int AS num_con_mod,
         COUNT(*) FILTER (WHERE a.maquinaria_costo::numeric > 0)::int AS num_con_maquinaria
       FROM actividades a
       WHERE ${where}`,
      params
    );
    const t = totalsResult.rows[0];

    // ── Query 4: Key materials costs ──
    const keyMatResult = await pool.query(
      `SELECT
         CASE
           WHEN LOWER(sm.material_nombre) LIKE '%cemento%' THEN 'cemento'
           WHEN LOWER(sm.material_nombre) LIKE '%arena%' THEN 'arena'
           WHEN LOWER(sm.material_nombre) LIKE '%piedrin%'
             OR LOWER(sm.material_nombre) LIKE '%piedrín%' THEN 'piedrin'
           WHEN LOWER(sm.material_nombre) LIKE '%hierro%' THEN 'hierro'
           WHEN LOWER(sm.material_nombre) LIKE '%block%' THEN 'block'
         END AS material_key,
         COALESCE(SUM(sm.costo_material::numeric), 0) AS costo
       FROM salida_materiales sm
       WHERE sm.destino_subdestinos = $1
         ${smPeriodWhere}
         AND (LOWER(sm.material_nombre) LIKE '%cemento%'
              OR LOWER(sm.material_nombre) LIKE '%arena%'
              OR LOWER(sm.material_nombre) LIKE '%piedrin%'
              OR LOWER(sm.material_nombre) LIKE '%piedrín%'
              OR LOWER(sm.material_nombre) LIKE '%hierro%'
              OR LOWER(sm.material_nombre) LIKE '%block%')
       GROUP BY material_key`,
      smParams
    );
    const keyMats: Record<string, number> = {};
    keyMatResult.rows.forEach((r: any) => {
      keyMats[r.material_key] = Number(r.costo);
    });

    // ── Query 5: Top activity ──
    const topAct = await pool.query(
      `SELECT actividad, COALESCE(costo_total::numeric, 0) AS ct
       FROM actividades a
       WHERE ${where}
       ORDER BY ct DESC LIMIT 1`,
      params
    );

    // ── Query 6: Top material ──
    const topMat = await pool.query(
      `SELECT material_nombre, COALESCE(SUM(costo_material::numeric), 0) AS ct
       FROM salida_materiales sm
       WHERE sm.destino_subdestinos = $1 ${smPeriodWhere}
       GROUP BY material_nombre ORDER BY ct DESC LIMIT 1`,
      smParams
    );

    // ── Query 7: Num salidas materiales ──
    const numSalidas = await pool.query(
      `SELECT COUNT(*)::int AS n FROM salida_materiales sm
       WHERE sm.destino_subdestinos = $1 ${smPeriodWhere}`,
      smParams
    );

    // ── Assemble response ──
    const costoTotal = Number(t.costo_total) || 0;
    const costoMateriales = Number(t.costo_materiales) || 0;
    const info = destinoInfo.rows[0];
    const topUC = ucResult.rows[0];

    const kpis = {
      destino,
      tipo: info?.tipo ?? null,
      descripcion: info?.descripcion ?? null,
      costoTotal,
      costoMateriales,
      costoMod: Number(t.costo_mod) || 0,
      costoMoi: Number(t.costo_moi) || 0,
      costoMaquinaria: Number(t.costo_maquinaria) || 0,
      numUnidadesCosto: Number(t.num_uc) || 0,
      numActividades: Number(t.num_actividades) || 0,
      pctMateriales:
        costoTotal > 0 ? (costoMateriales / costoTotal) * 100 : 0,
      pctMod:
        costoTotal > 0 ? (Number(t.costo_mod) / costoTotal) * 100 : 0,
      pctMoi:
        costoTotal > 0 ? (Number(t.costo_moi) / costoTotal) * 100 : 0,
      pctMaquinaria:
        costoTotal > 0 ? (Number(t.costo_maquinaria) / costoTotal) * 100 : 0,
      costoCemento: keyMats.cemento ?? 0,
      costoArena: keyMats.arena ?? 0,
      costoPiedrin: keyMats.piedrin ?? 0,
      costoHierro: keyMats.hierro ?? 0,
      costoBlock: keyMats.block ?? 0,
      ucMasCara: topUC
        ? { nombre: topUC.unidad_costo, costo: Number(topUC.costo_total) }
        : null,
      actividadMasCara: topAct.rows[0]
        ? {
            nombre: topAct.rows[0].actividad,
            costo: Number(topAct.rows[0].ct),
          }
        : null,
      materialMasCostoso: topMat.rows[0]
        ? {
            nombre: topMat.rows[0].material_nombre,
            costo: Number(topMat.rows[0].ct),
          }
        : null,
      promedioCostoActividad:
        Number(t.num_actividades) > 0
          ? costoTotal / Number(t.num_actividades)
          : 0,
      numSalidasMateriales: Number(numSalidas.rows[0]?.n) || 0,
      numActividadesConMod: Number(t.num_con_mod) || 0,
      numActividadesConMaquinaria: Number(t.num_con_maquinaria) || 0,
    };

    const unidadesCosto = ucResult.rows.map((r: any) => ({
      unidadCosto: r.unidad_costo,
      costoMod: Number(r.costo_mod),
      costoMoi: Number(r.costo_moi),
      costoMateriales: Number(r.costo_materiales),
      costoMaquinaria: Number(r.costo_maquinaria),
      costoTotal: Number(r.costo_total),
      pctTotal:
        costoTotal > 0 ? (Number(r.costo_total) / costoTotal) * 100 : 0,
      numActividades: Number(r.num_actividades),
      duracionTotal: Number(r.duracion_total),
      rubroDominante: dominantRubro(
        Number(r.costo_mod),
        Number(r.costo_moi),
        Number(r.costo_materiales),
        Number(r.costo_maquinaria)
      ),
    }));

    return NextResponse.json({
      kpis,
      unidadesCosto,
      participacionGlobal: {
        mod: Number(t.costo_mod) || 0,
        moi: Number(t.costo_moi) || 0,
        materiales: costoMateriales,
        maquinaria: Number(t.costo_maquinaria) || 0,
      },
    });
  } catch (error) {
    console.error("Costos destino data error:", error);
    return NextResponse.json(
      { error: "Error al obtener datos" },
      { status: 500 }
    );
  }
}
