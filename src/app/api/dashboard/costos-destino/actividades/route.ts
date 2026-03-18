import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";

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

    const result = await pool.query(
      `SELECT
         a.num_actividad,
         a.unidad_costo,
         a.actividad,
         a.fecha_actividad,
         COALESCE(a.costo_total::numeric, 0) AS costo_total,
         COALESCE(a.mod::numeric, 0) AS costo_mod,
         COALESCE(a.moi::numeric, 0) AS costo_moi,
         COALESCE(a.costo_materiales::numeric, 0) AS costo_materiales,
         COALESCE(a.maquinaria_costo::numeric, 0) AS costo_maquinaria,
         COALESCE(a.duracion::numeric, 0) AS duracion
       FROM actividades a
       WHERE ${where}
       ORDER BY a.costo_total::numeric DESC NULLS LAST`,
      params
    );

    const rows = result.rows.map((r: any) => {
      const ct = Number(r.costo_total);
      const mod = Number(r.costo_mod);
      return {
        numActividad: r.num_actividad,
        unidadCosto: r.unidad_costo,
        actividad: r.actividad,
        fechaActividad: r.fecha_actividad,
        costoTotal: ct,
        costoMod: mod,
        costoMoi: Number(r.costo_moi),
        costoMateriales: Number(r.costo_materiales),
        costoMaquinaria: Number(r.costo_maquinaria),
        pctMod: ct > 0 ? (mod / ct) * 100 : 0,
        duracion: Number(r.duracion),
      };
    });

    // Top 10 by MOD
    const top10Mod = [...rows]
      .sort((a, b) => b.costoMod - a.costoMod)
      .slice(0, 10);

    // Top 10 by total cost
    const top10Total = rows.slice(0, 10);

    return NextResponse.json({
      actividades: rows,
      top10Mod,
      top10Total,
    });
  } catch (error) {
    console.error("Costos destino actividades error:", error);
    return NextResponse.json(
      { error: "Error al obtener actividades" },
      { status: 500 }
    );
  }
}
