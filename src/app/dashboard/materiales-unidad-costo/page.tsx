import { MaterialesUCDashboard } from "./materiales-uc-dashboard";

export const metadata = {
  title: "Materiales por Unidad de Costo | Costos Lomas",
  description:
    "Detalle de materiales consumidos por unidad de costo dentro de cada destino",
};

export default function Page() {
  return (
    <div className="p-6">
      <MaterialesUCDashboard />
    </div>
  );
}
