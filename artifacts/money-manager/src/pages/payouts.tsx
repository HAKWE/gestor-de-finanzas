import { Layout } from "../components/layout";
import PayoutHistory from "../components/PayoutHistory";
import { History } from "lucide-react";

export default function PayoutsPage() {
  return (
    <Layout>
      <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", paddingBottom: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: "#f0fdf4", border: "1.5px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <History style={{ width: 18, height: 18, color: "#16a34a" }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0 }}>
              Mis Pagos de Billetera Digital
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
            Historial de tus pagos de suscripción vía Mercado Pago, Nequi, Yape y otros.
          </p>
        </div>

        <PayoutHistory />
      </div>
    </Layout>
  );
}
