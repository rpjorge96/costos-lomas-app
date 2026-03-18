import { CostosDestinoDashboard } from "./costos-destino-dashboard";

export const metadata = {
  title: "Costos por Destino | Costos Lomas",
  description: "Análisis detallado de costos por destino",
};

export default function Page() {
  return (
    <div className="p-6">
      <CostosDestinoDashboard />
    </div>
  );
}
