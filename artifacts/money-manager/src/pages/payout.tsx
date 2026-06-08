import { Layout } from "../components/layout";
import PayoutForm from "../components/PayoutForm";
import { CreditCard } from "lucide-react";

export default function PayoutPage() {
  return (
    <Layout>
      <div style={{ maxWidth: 520, margin: "0 auto", width: "100%", paddingBottom: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: "#fff7ed", border: "1.5px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CreditCard style={{ width: 18, height: 18, color: "#f97316" }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0 }}>
              Payer mon Abonnement avec Mobile Money
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
            Renouvelez votre abonnement MobileMoney Manager via Orange Money, Wave, MTN MoMo et plus encore.
          </p>
        </div>

        <PayoutForm />
      </div>
    </Layout>
  );
}
