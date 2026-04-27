import { useLanguage } from "../lib/language-context";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const ORANGE = "#f97316";

export default function Terms() {
  const { lang } = useLanguage();
  const fr = lang === "fr";

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf9", display: "flex", flexDirection: "column" }}>

      {/* ─── NAV ─── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,250,249,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #f0ede9", padding: "0 24px",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#374151", fontWeight: 600, fontSize: 14 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
            {fr ? "Retour à l'accueil" : "Back to home"}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg," + ORANGE + ",#ea580c)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14 }}>💰</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>MobileMoney</span>
          </div>
        </div>
      </header>

      {/* ─── CONTENT ─── */}
      <main style={{ flex: 1, padding: "48px 24px 80px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: "#111", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
              {fr ? "Conditions d'Utilisation" : "Terms of Service"}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {fr ? "Dernière mise à jour : 27 avril 2026" : "Last updated: April 27, 2026"}
            </p>
          </div>

          {/* Sections */}
          {[
            {
              title: fr ? "1. Acceptation des conditions" : "1. Acceptance of terms",
              prose: fr
                ? "En utilisant MobileMoney Manager, vous acceptez ces conditions d'utilisation."
                : "By using MobileMoney Manager, you agree to these terms of service.",
            },
            {
              title: fr ? "2. Description du service" : "2. Service description",
              prose: fr
                ? "MobileMoney Manager est un outil de gestion financière destiné aux micro-entrepreneurs africains. Il permet de suivre les transactions (Orange Money, Wave, MTN MoMo, etc.), générer des rapports et exporter des données."
                : "MobileMoney Manager is a financial management tool for African micro-entrepreneurs. It allows you to track transactions (Orange Money, Wave, MTN MoMo, etc.), generate reports and export data.",
            },
            {
              title: fr ? "3. Abonnements et paiements" : "3. Subscriptions and payments",
              items: fr
                ? [
                    "Les abonnements sont renouvelés automatiquement",
                    "Vous pouvez annuler à tout moment depuis votre espace « Mon abonnement »",
                    "Les remboursements ne sont pas possibles après utilisation du service",
                  ]
                : [
                    "Subscriptions are automatically renewed",
                    "You can cancel at any time from your \"My Subscription\" section",
                    "Refunds are not possible after use of the service",
                  ],
            },
            {
              title: fr ? "4. Obligations de l'utilisateur" : "4. User obligations",
              items: fr
                ? [
                    "Fournir des informations exactes",
                    "Ne pas utiliser l'application pour des activités illégales",
                    "Protéger votre mot de passe",
                  ]
                : [
                    "Provide accurate information",
                    "Not use the application for illegal activities",
                    "Protect your password",
                  ],
            },
            {
              title: fr ? "5. Limitation de responsabilité" : "5. Limitation of liability",
              prose: fr
                ? "MobileMoney Manager est un outil d'aide à la gestion. Nous ne sommes pas responsables des erreurs de saisie, des pertes financières ou des problèmes liés à vos wallets mobiles."
                : "MobileMoney Manager is a management assistance tool. We are not responsible for data entry errors, financial losses, or issues related to your mobile wallets.",
            },
            {
              title: fr ? "6. Résiliation" : "6. Termination",
              prose: fr
                ? "Nous pouvons suspendre ou supprimer votre compte en cas de violation de ces conditions."
                : "We may suspend or delete your account in case of violation of these terms.",
            },
            {
              title: fr ? "7. Droit applicable" : "7. Governing law",
              prose: fr
                ? "Ces conditions sont régies par le droit luxembourgeois."
                : "These terms are governed by Luxembourg law.",
            },
          ].map(({ title, prose, items }) => (
            <section key={title} style={{ marginBottom: 36 }}>
              <h2 style={{
                fontSize: 18, fontWeight: 800, color: "#111",
                margin: "0 0 12px", paddingBottom: 10,
                borderBottom: "2px solid #f0ede9",
              }}>{title}</h2>
              {prose && (
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>{prose}</p>
              )}
              {items && (
                <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map(item => (
                    <li key={item} style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* Contact */}
          <div style={{
            background: "#fff", border: "1.5px solid #f0ede9", borderRadius: 16,
            padding: "20px 24px", marginTop: 8,
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 14, color: "#6b7280" }}>
              {fr ? "Pour toute question :" : "For any questions:"}
            </p>
            <a href="mailto:support@mobilemoneymanager.africa" style={{
              fontSize: 15, fontWeight: 700, color: ORANGE, textDecoration: "none",
            }}>
              support@mobilemoneymanager.africa
            </a>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: "1px solid #f0ede9", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
          © 2026 MobileMoney Manager · Luxembourg
        </p>
      </footer>
    </div>
  );
}
