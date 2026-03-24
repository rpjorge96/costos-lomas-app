# Costos Lomas APP

Sistema de consolidacion y analisis de costos de construccion para **Paseo Las Lomas de Salama**. Sincroniza datos desde multiples bases de Airtable hacia una base de datos PostgreSQL local y presenta dashboards analiticos interactivos para la toma de decisiones.

## Tech Stack

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.1 |
| UI | React | 19.2 |
| Lenguaje | TypeScript | 5.9 |
| Base de datos | PostgreSQL (WSL2) | 16 |
| ORM | Drizzle ORM + drizzle-kit | latest |
| Visualizacion | Recharts | 3.8 |
| Estilos | Tailwind CSS | v4 |
| Fuente de datos | Airtable API (Personal Access Token) | v0 |

---

## Estructura del Proyecto

```
costos-lomas-app/
├── docker-compose.yml              # PostgreSQL 16 containerizado
├── drizzle.config.ts               # Config de Drizzle Kit (schema + DB URL)
├── next.config.ts                  # Config Next.js
├── start-dev.cmd                   # Script: inicia DB + Next.js en un paso
├── start-postgres.cmd              # Script: solo inicia PostgreSQL via WSL
├── .env.local                      # Variables de entorno (NO commitear)
│
├── src/
│   ├── db/
│   │   ├── index.ts                # Pool pg.Pool + instancia Drizzle
│   │   └── schema.ts              # Schema completo (7 tablas + periods)
│   │
│   ├── sync/
│   │   ├── index.ts               # CLI de sincronizacion (entry point)
│   │   ├── airtable-client.ts     # Cliente Airtable con rate limiting + retry
│   │   ├── config.ts              # Periodos, table IDs, field IDs
│   │   ├── sync-table.ts          # Upsert batch con ON CONFLICT
│   │   └── transformers/          # 1 transformer por tabla Airtable
│   │       ├── actividades.ts
│   │       ├── destinos.ts
│   │       ├── materiales.ts
│   │       ├── salida-materiales.ts
│   │       ├── combustibles.ts
│   │       ├── despachos.ts
│   │       ├── uso-maquinaria.ts
│   │       └── utils.ts
│   │
│   └── app/
│       ├── layout.tsx              # Layout global + Sidebar de navegacion
│       ├── dashboard/
│       │   ├── comparativo-unidad-costo/   # Dashboard 1
│       │   │   ├── page.tsx
│       │   │   └── comparativo-dashboard.tsx
│       │   └── costos-destino/             # Dashboard 2
│       │       ├── page.tsx
│       │       ├── costos-destino-dashboard.tsx  # Orquestador principal
│       │       ├── types.ts                     # Interfaces TypeScript
│       │       ├── constants.ts                 # Colores, formateadores
│       │       └── components/
│       │           ├── filter-panel.tsx          # Filtros avanzados
│       │           ├── kpi-section.tsx           # Tarjetas KPI
│       │           ├── desglose-unidad-chart.tsx # Barras apiladas por UC
│       │           ├── tabla-resumen-uc.tsx      # Tabla ordenable
│       │           ├── actividades-mod-section.tsx # Tabs actividades
│       │           ├── materiales-section.tsx    # Materiales + heatmap
│       │           ├── participacion-rubro.tsx   # Pie charts
│       │           ├── ranking-uc.tsx            # Ranking horizontal
│       │           └── shared/
│       │               ├── kpi-card.tsx
│       │               └── section-wrapper.tsx
│       ├── tabla/
│       │   └── [tableKey]/         # Visor dinamico de tablas
│       │       ├── page.tsx
│       │       ├── table-viewer.tsx
│       │       └── destinos-grouped.tsx
│       └── api/
│           ├── dashboard/
│           │   ├── comparativo-unidad-costo/
│           │   └── costos-destino/
│           │       ├── filters/route.ts      # Periodos, destinos, tipos, UCs
│           │       ├── data/route.ts         # KPIs + UC aggregation (7 queries)
│           │       ├── actividades/route.ts  # Actividades + top10 MOD/total
│           │       └── materiales/route.ts   # Materiales + matriz UC
│           ├── destinos-agrupados/
│           └── tabla/
│
└── drizzle/                        # Migraciones generadas por drizzle-kit
```

---

## Base de Datos

### Conexion

| Parametro | Valor |
|-----------|-------|
| Host | `localhost` |
| Puerto | `5432` |
| Usuario | `postgres` |
| Password | `postgres` |
| Database | `costos_lomas` |
| Connection string | `postgresql://postgres:postgres@localhost:5432/costos_lomas` |

La conexion se configura en `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/costos_lomas
AIRTABLE_PAT=pat...tu_token_aqui
```

### Archivos clave de la BD

| Archivo | Descripcion |
|---------|-------------|
| `src/db/index.ts` | Crea el pool `pg.Pool` desde `DATABASE_URL` y exporta `db` (Drizzle) + `pool` (raw SQL) |
| `src/db/schema.ts` | Schema Drizzle con 8 tablas: `periods`, `destinos`, `actividades`, `materiales`, `salida_materiales`, `combustibles`, `despachos_combustible`, `uso_maquinaria` |
| `drizzle.config.ts` | Config de drizzle-kit apuntando a `src/db/schema.ts` y `DATABASE_URL` |

### Schema de tablas

| Tabla | Registros tipicos | Campos clave |
|-------|-------------------|--------------|
| `periods` | 4 | `id` (PK texto como "26082024"), `base_id`, `label`, `last_synced_at` |
| `destinos` | ~800 | `id_destino`, `tipo`, `costo_total`, `costo_mod`, `costo_moi`, `costo_materiales`, `costo_maquinaria` |
| `actividades` | ~28,500 | `num_actividad`, `unidad_costo`, `actividad`, `costo_total`, `mod`, `moi`, `destino_subdestinos`, `subdestino` |
| `materiales` | ~600 | `id_materiales`, `unidad_medida`, `precio_prom_ponderado`, `total_compras_q` |
| `salida_materiales` | ~35,000 | `material_nombre`, `cantidad_enviada`, `costo_material`, `destino_subdestinos`, `num_actividad` |
| `combustibles` | ~40 | `id_combustible`, `disponible`, `total_comprado`, `total_utilizado` |
| `despachos_combustible` | ~5,500 | `cantidad_despachada`, `costo_despacho`, `combustible_nombre`, `maquinaria_nombre` |
| `uso_maquinaria` | ~4,500 | `cantidad_hr_km`, `costo_uso`, `maquinaria_nombre`, `destino` |

Cada tabla tiene un indice unico compuesto `(period_id, airtable_id)` para upserts.

### Correr PostgreSQL via WSL

PostgreSQL corre directamente en WSL2 (Ubuntu). Los datos persisten en el filesystem de WSL.

**Iniciar PostgreSQL** (cada vez que se reinicia WSL o Windows):
```bash
wsl -u root service postgresql start
```

O usando el script incluido:
```cmd
start-postgres.cmd
```

Para que PostgreSQL inicie automaticamente con Windows, agregar `start-postgres.cmd` al Task Scheduler o a la carpeta de Startup (`shell:startup`).

**Instalacion inicial** (una sola vez, en terminal WSL):
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE costos_lomas OWNER postgres;"
sudo sed -i "s/host    all             all             127.0.0.1\/32            scram-sha-256/host    all             all             127.0.0.1\/32            md5/" /etc/postgresql/16/main/pg_hba.conf
sudo sed -i "s/host    all             all             ::1\/128                 scram-sha-256/host    all             all             ::1\/128                 md5/" /etc/postgresql/16/main/pg_hba.conf
sudo service postgresql restart
```

---

## Sincronizacion Airtable → PostgreSQL

### Como funciona

1. El sistema lee 4 **periodos** configurados en `src/sync/config.ts`, cada uno apuntando a una base de Airtable diferente
2. Para cada periodo, descarga las 7 tablas usando la API de Airtable con paginacion
3. Cada registro pasa por un **transformer** especifico que mapea field IDs de Airtable a columnas PostgreSQL
4. Los registros se insertan en lotes de 50 usando `INSERT ... ON CONFLICT DO UPDATE` (upsert)
5. Post-sync: resuelve linked records (nombres de materiales, combustibles y maquinaria)

### Periodos configurados

| ID | Label | Base ID Airtable |
|----|-------|-----------------|
| `26082024` | 26/08/2024 | `appITXrOzgwjKb33J` |
| `03032025` | 03/03/2025 | `appTwjjuIdiiUfEui` |
| `08092025` | 08/09/2025 | `appevAYigVZDu4XW9` |
| `01032026` | 01/03/2026 | `appNI5yrjKex925u1` |

### Rate limiting

El cliente Airtable (`airtable-client.ts`) implementa:
- **1 request cada 220ms** por base (bajo el limite de 5 req/sec)
- **Retry con backoff exponencial** para errores 429 (rate limit)
- **Auto-skip de campos desconocidos** — si un field ID no existe en una base, se remueve y se reintenta

### Comandos de sincronizacion

```bash
# Sincronizar todo (4 periodos x 7 tablas)
npm run sync

# Solo periodos especificos
npx tsx src/sync/index.ts --periods 26082024,03032025

# Solo tablas especificas
npx tsx src/sync/index.ts --tables actividades,destinos

# Combinar filtros
npx tsx src/sync/index.ts --periods 01032026 --tables actividades,materiales
```

### Agregar un nuevo periodo

1. Crear la nueva base en Airtable (copiar estructura de una existente)
2. Agregar la entrada en `src/sync/config.ts` → array `PERIODS`:
   ```ts
   { id: "DDMMYYYY", baseId: "appXXXXXXXX", label: "DD/MM/YYYY", name: "Las Lomas DDMMYYYY" }
   ```
3. Ejecutar `npm run sync -- --periods DDMMYYYY`

---

## Variables de Entorno

Crear `.env.local` en la raiz del proyecto:

```env
# Conexion a PostgreSQL (obligatorio)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/costos_lomas

# Token de Airtable (obligatorio para sync)
AIRTABLE_PAT=patXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

El `AIRTABLE_PAT` es un Personal Access Token de Airtable con permisos de lectura sobre las 4 bases.

---

## Dashboards

### 1. Comparativo Unidad de Costo
**Ruta:** `/dashboard/comparativo-unidad-costo`

Comparacion de costos entre unidades de costo (etapas constructivas) a traves de multiples destinos y periodos.

### 2. Costos Detallados por Destino
**Ruta:** `/dashboard/costos-destino`

Ficha analitica completa para un destino especifico con 8 secciones:

| Seccion | Componente | Descripcion |
|---------|-----------|-------------|
| KPIs | `kpi-section.tsx` | 3 filas: costos principales (7 cards), materiales clave con % (5), tops adicionales (4) |
| Desglose por UC | `desglose-unidad-chart.tsx` | Barras apiladas horizontales con toggle valores/porcentaje, tooltip con total |
| Tabla Resumen UC | `tabla-resumen-uc.tsx` | Tabla ordenable con mini barras apiladas y badge de rubro dominante |
| Actividades + MOD | `actividades-mod-section.tsx` | 4 sub-tabs: tabla completa, top 10 MOD, top 10 total, barras MOD. Carga lazy |
| Materiales | `materiales-section.tsx` | Top 30 materiales, grafico clave, heatmap matrix materiales x UC. Carga lazy |
| Participacion Rubro | `participacion-rubro.tsx` | 2 pie charts: destino global vs UC seleccionada |
| Ranking UCs | `ranking-uc.tsx` | Barras horizontales con selector de metrica (Total/MOD/Materiales/Maquinaria) |
| Filtros | `filter-panel.tsx` | Destino searchable, periodo, tipo/modelo, subdestino, UC multi-select, rango fechas |

**Patron de carga:** Las secciones de Actividades y Materiales se cargan bajo demanda (lazy-loading) para optimizar el tiempo de carga inicial. El usuario hace click en un boton para cargarlas.

**Estado:** Usa `useReducer` para manejar el estado complejo de filtros con 8 dimensiones.

### Visor de Tablas
**Ruta:** `/tabla/[tableKey]`

Visor generico para explorar datos crudos de las 7 tablas:
- Actividades y Costos
- Destinos (con vista agrupada)
- Materiales
- Salida de Materiales
- Combustibles
- Despachos de Combustible
- Uso de Maquinaria

---

## API Endpoints

### Dashboard Costos por Destino

| Endpoint | Metodo | Params | Retorna |
|----------|--------|--------|---------|
| `/api/dashboard/costos-destino/filters` | GET | `?periodId=` | Periodos, destinos (con tipo/descripcion/count), tipos, UCs (ordenadas numericamente), subdestinos |
| `/api/dashboard/costos-destino/data` | GET | `?destino=&periodId=&unidadCosto=&subdestino=&fechaDesde=&fechaHasta=` | KPIs, unidades de costo aggregadas, participacion global, materiales clave |
| `/api/dashboard/costos-destino/actividades` | GET | mismos params | Lista actividades, top 10 MOD, top 10 total |
| `/api/dashboard/costos-destino/materiales` | GET | mismos params | Top materiales, UC principal por material, materiales clave, matriz material x UC |

Todos los endpoints usan raw SQL via `pool.query()` para queries complejas con JOINs y aggregaciones.

---

## Requisitos del Sistema

- **Node.js** >= 20
- **WSL2** con Ubuntu y PostgreSQL 16 instalado
- **Airtable Personal Access Token** con acceso a las 4 bases de datos
- **Windows 10/11** (los scripts `.cmd` son para Windows; en Linux/Mac usar equivalentes bash)

---

## Instalacion Paso a Paso

```bash
# 1. Clonar repositorio
git clone https://github.com/rpjorge96/CostosLomas.git
cd CostosLomas

# 2. Instalar dependencias
npm install

# 3. Crear archivo de variables de entorno
#    Copiar y editar con tus credenciales:
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/costos_lomas
AIRTABLE_PAT=patXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXX
EOF

# 4. Iniciar PostgreSQL via WSL
wsl -u root service postgresql start

# 5. Crear las tablas en la base de datos
npm run db:push

# 6. Sincronizar datos desde Airtable (~2-5 min)
npm run sync

# 7. Iniciar servidor de desarrollo
npm run dev
```

La aplicacion estara disponible en **http://localhost:3000**

---

## Scripts Disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack (port 3000) |
| `npm run build` | Build de produccion |
| `npm run start` | Servidor de produccion |
| `npm run lint` | Linting con ESLint |
| `npm run sync` | Sincronizar TODAS las tablas desde Airtable |
| `npm run sync:periods` | Solo sincronizar periodos (metadata) |
| `npm run sync:tables` | Solo sincronizar tablas (datos) |
| `npm run db:push` | Aplicar schema Drizzle a PostgreSQL |
| `npm run db:generate` | Generar archivos de migracion |
| `npm run db:migrate` | Ejecutar migraciones pendientes |
| `npm run db:studio` | Abrir Drizzle Studio (port 4983) — GUI para explorar la BD |

### Scripts de Windows (.cmd)

| Script | Descripcion |
|--------|-------------|
| `start-dev.cmd` | Inicia PostgreSQL (WSL) + espera 3s + inicia Next.js dev |
| `start-postgres.cmd` | Solo inicia PostgreSQL via WSL (para agregar al Startup de Windows) |

---

## Troubleshooting

### La base de datos no conecta
1. Verificar que PostgreSQL esta corriendo: `wsl -u root service postgresql status`
2. Verificar `.env.local` existe y tiene `DATABASE_URL` correcto
3. Verificar que el port 5432 no esta en uso por otro proceso

### El sync falla con error de Airtable
1. Verificar que `AIRTABLE_PAT` esta configurado en `.env.local`
2. Verificar que el token tiene permisos de lectura sobre las bases
3. Si falla un campo especifico, el sistema lo skipea automaticamente y continua

### PostgreSQL no inicia en WSL
1. Verificar que WSL2 esta actualizado: `wsl --update`
2. Intentar iniciar manualmente: `wsl -u root service postgresql start`
3. Ver logs: `wsl -u root bash -c "tail -20 /var/log/postgresql/postgresql-16-main.log"`

### Error "relation does not exist"
Ejecutar `npm run db:push` para crear las tablas.

### Datos vacios en los dashboards
Ejecutar `npm run sync` para descargar datos desde Airtable.

---

## Licencia

Proyecto privado - Todos los derechos reservados.
