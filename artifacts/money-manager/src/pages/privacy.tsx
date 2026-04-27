import { useLanguage } from "../lib/language-context";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const ORANGE = "#f97316";

type SectionItem = string | { label: string; text: string };

interface Section {
  title: string;
  prose?: string;
  intro?: string;
  items?: SectionItem[];
}

function renderItem(item: SectionItem, idx: number) {
  if (typeof item === "string") {
    return (
      <li key={idx} style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>
        {item}
      </li>
    );
  }
  return (
    <li key={idx} style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>
      <strong style={{ color: "#111" }}>{item.label} :</strong> {item.text}
    </li>
  );
}

export default function Privacy() {
  const { lang } = useLanguage();
  const fr = lang === "fr";

  const sections: Section[] = fr
    ? [
        {
          title: "1. Introduction",
          prose: "Nous nous engageons à protéger votre vie privée et la sécurité de vos données financières. Cette Politique de Confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations.",
        },
        {
          title: "2. Informations que nous collectons",
          items: [
            { label: "Informations de compte", text: "Nom, prénom, adresse email, numéro de téléphone, mot de passe" },
            { label: "Données financières", text: "Transactions (montant, date, catégorie, moyen de paiement : Orange Money, Wave, MTN MoMo, etc.)" },
            { label: "Données d'utilisation", text: "Fréquence d'utilisation, pages visitées, appareils utilisés" },
            { label: "Données de paiement", text: "Gérées par Stripe (nous ne stockons pas les numéros de carte)" },
          ],
        },
        {
          title: "3. Base légale du traitement",
          intro: "Nous traitons vos données sur la base de :",
          items: [
            "L'exécution du contrat (fourniture du service)",
            "Notre intérêt légitime (amélioration du service et sécurité)",
            "Votre consentement (pour les communications marketing)",
          ],
        },
        {
          title: "4. Utilisation de vos données",
          intro: "Nous utilisons vos données pour :",
          items: [
            "Fournir, maintenir et améliorer l'Application",
            "Générer des rapports, graphiques et export PDF",
            "Assurer la sécurité du compte et prévenir la fraude",
            "Vous envoyer des notifications importantes (vérification, mises à jour)",
            "Respecter nos obligations légales",
          ],
        },
        {
          title: "5. Partage des données",
          intro: "Nous ne vendons pas vos données. Nous pouvons les partager avec :",
          items: [
            "Stripe (pour le traitement des paiements)",
            "Clerk (pour l'authentification)",
            "Prestataires d'hébergement (Replit) et outils analytiques",
            "Autorités compétentes si requis par la loi",
          ],
        },
        {
          title: "6. Sécurité des données",
          prose: "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées (chiffrement, accès restreint, audits réguliers). Cependant, aucune transmission sur Internet n'est 100% sécurisée.",
        },
        {
          title: "7. Vos droits (RGPD)",
          intro: "Vous disposez des droits suivants :",
          items: [
            "Droit d'accès, de rectification, d'effacement",
            "Droit d'opposition et de limitation du traitement",
            "Droit à la portabilité des données",
          ],
        },
        {
          title: "8. Conservation des données",
          prose: "Nous conservons vos données aussi longtemps que nécessaire pour fournir le service ou respecter nos obligations légales.",
        },
      ]
    : [
        {
          title: "1. Introduction",
          prose: "We are committed to protecting your privacy and the security of your financial data. This Privacy Policy explains how we collect, use, share and protect your information.",
        },
        {
          title: "2. Information we collect",
          items: [
            { label: "Account information", text: "First name, last name, email address, phone number, password" },
            { label: "Financial data", text: "Transactions (amount, date, category, payment method: Orange Money, Wave, MTN MoMo, etc.)" },
            { label: "Usage data", text: "Frequency of use, pages visited, devices used" },
            { label: "Payment data", text: "Handled by Stripe (we do not store card numbers)" },
          ],
        },
        {
          title: "3. Legal basis for processing",
          intro: "We process your data on the basis of:",
          items: [
            "Contract performance (provision of the service)",
            "Our legitimate interest (service improvement and security)",
            "Your consent (for marketing communications)",
          ],
        },
        {
          title: "4. How we use your data",
          intro: "We use your data to:",
          items: [
            "Provide, maintain and improve the Application",
            "Generate reports, charts and PDF exports",
            "Ensure account security and prevent fraud",
            "Send you important notifications (verification, updates)",
            "Meet our legal obligations",
          ],
        },
        {
          title: "5. Data sharing",
          intro: "We do not sell your data. We may share it with:",
          items: [
            "Stripe (for payment processing)",
            "Clerk (for authentication)",
            "Hosting providers (Replit) and analytics tools",
            "Competent authorities if required by law",
          ],
        },
        {
          title: "6. Data security",
          prose: "We implement appropriate technical and organisational measures (encryption, restricted access, regular audits). However, no Internet transmission is 100% secure.",
        },
        {
          title: "7. Your rights (GDPR)",
          intro: "You have the following rights:",
          items: [
            "Right of access, rectification, erasure",
            "Right to object and restrict processing",
            "Right to data portability",
          ],
        },
        {
          title: "8. Data retention",
          prose: "We retain your data for as long as necessary to provide the service or comply with our legal obligations.",
        },
      ];

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
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: "#111", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
              {fr ? "Politique de Confidentialité" : "Privacy Policy"}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {fr ? "Dernière mise à jour : 27 avril 2026" : "Last updated: April 27, 2026"}
            </p>
          </div>

          {/* Operator banner */}
          <div style={{
            background: "#fff7ed", border: "1.5px solid " + ORANGE + "30",
            borderRadius: 16, padding: "16px 22px", marginBottom: 40,
          }}>
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
              {fr
                ? <><strong>MobileMoney Manager</strong> (ci-après « l'Application » ou « nous ») est exploitée par <strong>Houehou Sosthene Alfio</strong>, Travailleur Indépendant au Luxembourg.</>
                : <><strong>MobileMoney Manager</strong> (hereinafter "the Application" or "we") is operated by <strong>Houehou Sosthene Alfio</strong>, Self-Employed, Luxembourg.</>
              }
            </p>
          </div>

          {/* Dynamic sections */}
          {sections.map(({ title, prose, intro, items }) => (
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
                  {items.map((item, idx) => renderItem(item, idx))}
                </ul>
              )}
            </section>
          ))}

          {/* GDPR rights contact note */}
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 28 }}>
            {fr
              ? <>Pour exercer ces droits, contactez-nous à : <strong>support@mobilemoneymanager.africa</strong></>
              : <>To exercise these rights, contact us at: <strong>support@mobilemoneymanager.africa</strong></>
            }
          </p>

          {/* Contact box */}
          <div style={{
            background: "#fff", border: "1.5px solid #f0ede9", borderRadius: 16,
            padding: "20px 24px",
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
