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
  const { language } = useLanguage();
  const fr = language !== "en";

  const sections: Section[] = fr
    ? [
        {
          title: "1. Objeto",
          prose: "Los presentes Términos y Condiciones de Uso rigen la utilización de la aplicación Gestor de Finanzas.",
        },
        {
          title: "2. Descripción del Servicio",
          prose: "Gestor de Finanzas es una plataforma SaaS que permite a emprendedores y micronegocios latinoamericanos llevar el control de sus transacciones digitales (Mercado Pago, Nequi, OXXO Pay, Yape, Efectivo, etc.), generar reportes y exportar datos.",
        },
        {
          title: "3. Registro y Cuenta",
          items: [
            "Debes tener al menos 18 años para usar el servicio",
            "Te comprometes a proporcionar información exacta y actualizada",
            "Eres responsable de la confidencialidad de tu contraseña",
          ],
        },
        {
          title: "4. Suscripciones y Pagos",
          items: [
            "Las suscripciones se renuevan automáticamente al final de cada período",
            "Puedes cancelar tu suscripción en cualquier momento desde «Mi suscripción»",
            "Los pagos son procesados por Stripe",
            "No se realizan reembolsos por períodos ya iniciados",
          ],
        },
        {
          title: "5. Obligaciones del Usuario",
          items: [
            "Usar el servicio de forma lícita",
            "No intentar eludir las medidas de seguridad",
            "No usar la aplicación para actividades fraudulentas o ilegales",
          ],
        },
        {
          title: "6. Propiedad Intelectual",
          prose: "La aplicación y su contenido son propiedad exclusiva de Gestor de Finanzas. Cualquier reproducción o uso no autorizado está prohibido.",
        },
        {
          title: "7. Limitación de Responsabilidad",
          intro: "La Aplicación se proporciona «tal cual». No podemos ser responsables de:",
          items: [
            "Errores en la introducción de tus datos",
            "Pérdidas financieras derivadas del uso del servicio",
            "Problemas técnicos relacionados con tus servicios de pago digital",
          ],
        },
        {
          title: "8. Rescisión",
          prose: "Podemos suspender o eliminar tu cuenta en caso de incumplimiento grave de estos Términos.",
        },
        {
          title: "9. Ley aplicable y jurisdicción",
          prose: "Los presentes Términos se rigen por la legislación aplicable. Cualquier disputa se someterá a los tribunales competentes.",
        },
      ]
    : [
        {
          title: "1. Purpose",
          prose: "These General Terms of Use govern the use of the Gestor de Finanzas application.",
        },
        {
          title: "2. Service description",
          prose: "Gestor de Finanzas is a SaaS platform enabling Latin American entrepreneurs to track their digital transactions (Mercado Pago, Nequi, OXXO Pay, etc.), generate reports and export data.",
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
          prose: "The application and its content are the exclusive property of Gestor de Finanzas. Any unauthorised reproduction or use is prohibited.",
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
          prose: "These Terms are governed by applicable law. Any dispute shall be submitted to the competent courts.",
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
            {fr ? "Volver al inicio" : "Back to home"}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg," + ORANGE + ",#ea580c)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14 }}>💰</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Gestor de Finanzas</span>
          </div>
        </div>
      </header>

      {/* ─── CONTENT ─── */}
      <main style={{ flex: 1, padding: "48px 24px 80px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* Page title */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: "#111", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
              {fr ? "Términos y Condiciones de Uso" : "Terms of Service"}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {fr ? "Última actualización: 27 de abril de 2026" : "Last updated: April 27, 2026"}
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
              {fr ? "10. Contacto — Para cualquier consulta:" : "10. Contact — For any questions:"}
            </p>
            <a href="mailto:soporte@gestordefinanzas.app" style={{
              fontSize: 15, fontWeight: 700, color: ORANGE, textDecoration: "none",
            }}>
              soporte@gestordefinanzas.app
            </a>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: "1px solid #f0ede9", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
          © 2026 Gestor de Finanzas — {fr ? "Todos los derechos reservados" : "All rights reserved"}
        </p>
      </footer>
    </div>
  );
}
