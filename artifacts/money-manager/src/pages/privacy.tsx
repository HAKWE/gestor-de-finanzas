import { useLanguage } from "../lib/language-context";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const ORANGE = "#f97316";

export default function Privacy() {
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
              {fr ? "Politique de Confidentialité" : "Privacy Policy"}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {fr ? "Dernière mise à jour : 27 avril 2026" : "Last updated: April 27, 2026"}
            </p>
          </div>

          {/* Intro */}
          <div style={{
            background: "#fff7ed", border: "1.5px solid " + ORANGE + "30",
            borderRadius: 16, padding: "18px 22px", marginBottom: 36,
          }}>
            <p style={{ margin: 0, fontSize: 15, color: "#374151", lineHeight: 1.7 }}>
              {fr
                ? <>Chez <strong>MobileMoney Manager</strong>, nous respectons votre vie privée et protégeons vos données financières.</>
                : <>At <strong>MobileMoney Manager</strong>, we respect your privacy and protect your financial data.</>
              }
            </p>
          </div>

          {/* Sections */}
          {[
            {
              title: fr ? "1. Informations que nous collectons" : "1. Information we collect",
              items: fr
                ? [
                    "Informations de compte (nom, email, téléphone)",
                    "Données de transactions (revenus, dépenses, moyens de paiement : Orange Money, Wave, MTN MoMo, etc.)",
                    "Données d'utilisation de l'application",
                  ]
                : [
                    "Account information (name, email, phone)",
                    "Transaction data (income, expenses, payment methods: Orange Money, Wave, MTN MoMo, etc.)",
                    "App usage data",
                  ],
            },
            {
              title: fr ? "2. Comment nous utilisons vos données" : "2. How we use your data",
              items: fr
                ? [
                    "Pour fournir et améliorer notre service",
                    "Pour générer vos rapports et statistiques",
                    "Pour communiquer avec vous (notifications importantes)",
                    "Pour assurer la sécurité de votre compte",
                  ]
                : [
                    "To provide and improve our service",
                    "To generate your reports and statistics",
                    "To communicate with you (important notifications)",
                    "To ensure the security of your account",
                  ],
            },
            {
              title: fr ? "3. Partage de vos données" : "3. Sharing your data",
              intro: fr
                ? "Nous ne vendons jamais vos données. Nous pouvons les partager uniquement avec :"
                : "We never sell your data. We may share it only with:",
              items: fr
                ? [
                    "Stripe (pour les paiements)",
                    "Nos prestataires techniques (hébergement sécurisé)",
                    "Les autorités légales, si la loi l'exige",
                  ]
                : [
                    "Stripe (for payments)",
                    "Our technical providers (secure hosting)",
                    "Legal authorities, if required by law",
                  ],
            },
            {
              title: fr ? "4. Sécurité" : "4. Security",
              prose: fr
                ? "Nous utilisons des mesures de sécurité avancées (chiffrement, protection des serveurs) pour protéger vos informations."
                : "We use advanced security measures (encryption, server protection) to protect your information.",
            },
            {
              title: fr ? "5. Vos droits" : "5. Your rights",
              intro: fr ? "Vous pouvez à tout moment :" : "You can at any time:",
              items: fr
                ? [
                    "Accéder à vos données",
                    "Demander leur suppression",
                    "Modifier vos informations",
                  ]
                : [
                    "Access your data",
                    "Request its deletion",
                    "Modify your information",
                  ],
            },
          ].map(({ title, intro, items, prose }) => (
            <section key={title} style={{ marginBottom: 36 }}>
              <h2 style={{
                fontSize: 18, fontWeight: 800, color: "#111",
                margin: "0 0 12px", paddingBottom: 10,
                borderBottom: "2px solid #f0ede9",
              }}>{title}</h2>

              {intro && (
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: "0 0 10px" }}>{intro}</p>
              )}
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
              {fr ? "Contact :" : "Contact:"}
            </p>
            <a href="mailto:support@mobilemoneymanager.africa" style={{
              fontSize: 15, fontWeight: 700, color: ORANGE, textDecoration: "none",
            }}>
              support@mobilemoneymanager.africa
            </a>
          </div>

          {/* Footer note */}
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 28, lineHeight: 1.65 }}>
            {fr
              ? "Nous nous réservons le droit de modifier cette politique. Nous vous informerons des changements importants."
              : "We reserve the right to modify this policy. We will notify you of important changes."
            }
          </p>
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
