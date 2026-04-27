import { useLanguage } from "../lib/language-context";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const ORANGE = "#f97316";

export default function Legal() {
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

          {/* Page title */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: "#111", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
              {fr ? "Mentions Légales" : "Legal Notice"}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {fr ? "Dernière mise à jour : 27 avril 2026" : "Last updated: April 27, 2026"}
            </p>
          </div>

          {/* 1 — Éditeur */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f0ede9" }}>
              {fr ? "1. Éditeur du site" : "1. Publisher"}
            </h2>
            <div style={{
              background: "#fff", border: "1.5px solid #f0ede9", borderRadius: 16,
              padding: "18px 22px", display: "flex", flexDirection: "column", gap: 4,
            }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#111" }}>MobileMoney Manager</p>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
                {fr ? "Exploitée par :" : "Operated by:"}
              </p>
              <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
                <strong>Houehou Sosthene Alfio</strong><br />
                {fr ? "Travailleur Indépendant" : "Self-Employed"}<br />
                Luxembourg
              </p>
              <a href="mailto:support@mobilemoneymanager.africa" style={{ fontSize: 14, color: ORANGE, fontWeight: 700, textDecoration: "none", marginTop: 4 }}>
                support@mobilemoneymanager.africa
              </a>
            </div>
          </section>

          {/* 2 — Hébergement */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f0ede9" }}>
              {fr ? "2. Hébergement" : "2. Hosting"}
            </h2>
            <div style={{
              background: "#fff", border: "1.5px solid #f0ede9", borderRadius: 16,
              padding: "18px 22px",
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 14, color: "#6b7280" }}>
                {fr ? "L'application est hébergée par :" : "The application is hosted by:"}
              </p>
              <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
                <strong>Replit, Inc.</strong><br />
                160 Spear Street, Suite 350<br />
                San Francisco, CA 94105, {fr ? "États-Unis" : "United States"}
              </p>
            </div>
          </section>

          {/* 3 — Propriété intellectuelle */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f0ede9" }}>
              {fr ? "3. Propriété intellectuelle" : "3. Intellectual property"}
            </h2>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: "0 0 10px" }}>
              {fr
                ? "L'ensemble du contenu de l'application MobileMoney Manager (structure, design, logos, textes, graphiques, base de données, etc.) est la propriété exclusive de Houehou Sosthene Alfio."
                : "All content of the MobileMoney Manager application (structure, design, logos, texts, graphics, database, etc.) is the exclusive property of Houehou Sosthene Alfio."
              }
            </p>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>
              {fr
                ? "Toute reproduction, représentation, modification ou adaptation totale ou partielle est strictement interdite sans autorisation écrite préalable."
                : "Any total or partial reproduction, representation, modification or adaptation is strictly prohibited without prior written authorisation."
              }
            </p>
          </section>

          {/* 4 — Données personnelles */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f0ede9" }}>
              {fr ? "4. Données personnelles" : "4. Personal data"}
            </h2>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>
              {fr
                ? <>Le traitement des données personnelles est régi par notre{" "}
                    <Link href="/privacy" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none" }}>
                      Politique de Confidentialité
                    </Link>
                    . Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition à vos données.</>
                : <>The processing of personal data is governed by our{" "}
                    <Link href="/privacy" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none" }}>
                      Privacy Policy
                    </Link>
                    . In accordance with the GDPR, you have the right to access, rectify, erase and object to your data.</>
              }
            </p>
          </section>

          {/* 5 — Limitation de responsabilité */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f0ede9" }}>
              {fr ? "5. Limitation de responsabilité" : "5. Limitation of liability"}
            </h2>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: "0 0 10px" }}>
              {fr
                ? "MobileMoney Manager est un outil d'aide à la gestion financière. L'éditeur ne saurait être tenu responsable :"
                : "MobileMoney Manager is a financial management assistance tool. The publisher cannot be held liable for:"
              }
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {(fr
                ? [
                    "Des erreurs ou omissions dans les données saisies par l'utilisateur",
                    "Des pertes financières résultant de l'utilisation de l'application",
                    "Des dysfonctionnements liés aux services des opérateurs mobiles (Orange Money, Wave, MTN MoMo, etc.)",
                    "Des interruptions de service dues à des cas de force majeure",
                  ]
                : [
                    "Errors or omissions in data entered by the user",
                    "Financial losses resulting from use of the application",
                    "Malfunctions related to mobile operator services (Orange Money, Wave, MTN MoMo, etc.)",
                    "Service interruptions due to force majeure",
                  ]
              ).map(item => (
                <li key={item} style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>{item}</li>
              ))}
            </ul>
          </section>

          {/* 6 — Droit applicable */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f0ede9" }}>
              {fr ? "6. Droit applicable" : "6. Governing law"}
            </h2>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>
              {fr
                ? "Les présentes mentions légales sont régies par le droit luxembourgeois. Tout litige sera soumis aux tribunaux compétents de la ville de Luxembourg."
                : "These legal notices are governed by Luxembourg law. Any dispute shall be submitted to the competent courts of the city of Luxembourg."
              }
            </p>
          </section>

          {/* 7 — Contact */}
          <div style={{
            background: "#fff", border: "1.5px solid #f0ede9", borderRadius: 16,
            padding: "20px 24px",
          }}>
            <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 15, color: "#111" }}>
              {fr ? "7. Contact" : "7. Contact"}
            </p>
            <p style={{ margin: "0 0 8px", fontSize: 14, color: "#6b7280" }}>
              {fr
                ? "Pour toute question relative à ces mentions légales ou à l'application :"
                : "For any questions about these legal notices or the application:"
              }
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
          © 2026 MobileMoney Manager — {fr ? "Tous droits réservés" : "All rights reserved"} · Luxembourg
        </p>
      </footer>
    </div>
  );
}
