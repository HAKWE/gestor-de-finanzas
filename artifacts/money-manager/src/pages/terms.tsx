import { useLanguage } from "../lib/language-context";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const ORANGE = "#f97316";

interface Section {
  title: string;
  prose?: string;
  intro?: string;
  items?: string[];
}

export default function Terms() {
  const { lang } = useLanguage();
  const fr = lang === "fr";

  const sections: Section[] = fr
    ? [
        {
          title: "1. Objet",
          prose: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application MobileMoney Manager.",
        },
        {
          title: "2. Description du Service",
          prose: "MobileMoney Manager est une plateforme SaaS permettant aux micro-entrepreneurs de suivre leurs transactions mobiles (Orange Money, Wave, MTN MoMo, etc.), générer des rapports et exporter des données.",
        },
        {
          title: "3. Inscription et Compte",
          items: [
            "Vous devez avoir au moins 18 ans pour utiliser le service",
            "Vous vous engagez à fournir des informations exactes et à jour",
            "Vous êtes responsable de la confidentialité de votre mot de passe",
          ],
        },
        {
          title: "4. Abonnements et Paiements",
          items: [
            "Les abonnements sont renouvelés automatiquement à la fin de chaque période",
            "Vous pouvez annuler votre abonnement à tout moment depuis « Mon abonnement »",
            "Les paiements sont traités par Stripe",
            "Aucun remboursement n'est effectué pour les périodes déjà commencées",
          ],
        },
        {
          title: "5. Obligations de l'Utilisateur",
          items: [
            "Utiliser le service de manière licite",
            "Ne pas tenter de contourner les mesures de sécurité",
            "Ne pas utiliser l'application pour des activités frauduleuses ou illégales",
          ],
        },
        {
          title: "6. Propriété Intellectuelle",
          prose: "L'application et son contenu sont la propriété exclusive de MobileMoney Manager. Toute reproduction ou utilisation non autorisée est interdite.",
        },
        {
          title: "7. Limitation de Responsabilité",
          intro: "L'Application est fournie « en l'état ». Nous ne pouvons être tenus responsables des :",
          items: [
            "Erreurs de saisie de vos données",
            "Pertes financières résultant de l'utilisation du service",
            "Problèmes techniques liés à vos opérateurs mobiles",
          ],
        },
        {
          title: "8. Résiliation",
          prose: "Nous pouvons suspendre ou supprimer votre compte en cas de violation grave des CGU.",
        },
        {
          title: "9. Droit applicable et juridiction",
          prose: "Les présentes CGU sont régies par le droit luxembourgeois. Tout litige sera soumis aux tribunaux compétents de Luxembourg.",
        },
      ]
    : [
        {
          title: "1. Purpose",
          prose: "These General Terms of Use govern the use of the MobileMoney Manager application.",
        },
        {
          title: "2. Service description",
          prose: "MobileMoney Manager is a SaaS platform enabling micro-entrepreneurs to track their mobile transactions (Orange Money, Wave, MTN MoMo, etc.), generate reports and export data.",
        },
        {
          title: "3. Registration and account",
          items: [
            "You must be at least 18 years old to use the service",
            "You agree to provide accurate and up-to-date information",
            "You are responsible for the confidentiality of your password",
          ],
        },
        {
          title: "4. Subscriptions and payments",
          items: [
            "Subscriptions are automatically renewed at the end of each period",
            "You can cancel your subscription at any time from \"My Subscription\"",
            "Payments are processed by Stripe",
            "No refund is made for periods already started",
          ],
        },
        {
          title: "5. User obligations",
          items: [
            "Use the service lawfully",
            "Not attempt to circumvent security measures",
            "Not use the application for fraudulent or illegal activities",
          ],
        },
        {
          title: "6. Intellectual property",
          prose: "The application and its content are the exclusive property of MobileMoney Manager. Any unauthorised reproduction or use is prohibited.",
        },
        {
          title: "7. Limitation of liability",
          intro: "The Application is provided \"as is\". We cannot be held liable for:",
          items: [
            "Data entry errors",
            "Financial losses resulting from use of the service",
            "Technical issues related to your mobile operators",
          ],
        },
        {
          title: "8. Termination",
          prose: "We may suspend or delete your account in the event of serious breach of these Terms.",
        },
        {
          title: "9. Governing law and jurisdiction",
          prose: "These Terms are governed by Luxembourg law. Any dispute shall be submitted to the competent courts of Luxembourg.",
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
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: "#111", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
              {fr ? "Conditions Générales d'Utilisation" : "Terms of Service"}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {fr ? "Dernière mise à jour : 27 avril 2026" : "Last updated: April 27, 2026"}
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
                  {items.map(item => (
                    <li key={item} style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* Contact box */}
          <div style={{
            background: "#fff", border: "1.5px solid #f0ede9", borderRadius: 16,
            padding: "20px 24px", marginTop: 8,
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 14, color: "#6b7280" }}>
              {fr ? "10. Contact — Pour toute question :" : "10. Contact — For any questions:"}
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
