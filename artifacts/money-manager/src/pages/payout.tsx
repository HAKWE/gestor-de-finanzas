import { Layout } from "../components/layout";
import PayoutForm from "../components/PayoutForm";
import { Send } from "lucide-react";

export default function PayoutPage() {
  return (
    <Layout>
      <div style={{ maxWidth: 520, margin: "0 auto", width: "100%", paddingBottom: 32 }}>
        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: "#fff7ed", border: "1.5px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send style={{ width: 18, height: 18, color: "#f97316" }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0 }}>Virement Mobile Money</h1>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
            Envoyez des USDC vers un compte mobile money en Afrique via le réseau Due.
          </p>
        </div>

        <PayoutForm />
      </div>
    </Layout>
  );
}
