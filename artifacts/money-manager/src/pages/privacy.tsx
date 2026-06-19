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
  const { language } = useLanguage();
  const fr = language !== "en";

  const sections: Section[] = fr
    ? [
        {
          title: "1. Introducción",
          prose: "Nos comprometemos a proteger tu privacidad y la seguridad de tus datos financieros. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos tu información.",
        },
        {
          title: "2. Información que recopilamos",
          items: [
            { label: "Información de cuenta", text: "Nombre, apellido, correo electrónico, número de teléfono, contraseña" },
            { label: "Datos financieros", text: "Transacciones (monto, fecha, categoría, método de pago: Mercado Pago, Nequi, OXXO Pay, etc.)" },
            { label: "Datos de uso", text: "Frecuencia de uso, páginas visitadas, dispositivos utilizados" },
            { label: "Datos de pago", text: "Gestionados por Stripe (no almacenamos números de tarjeta)" },
          ],
        },
        {
          title: "3. Base legal del tratamiento",
          intro: "Tratamos tus datos sobre la base de:",
          items: [
            "Ejecución del contrato (prestación del servicio)",
            "Nuestro interés legítimo (mejora del servicio y seguridad)",
            "Tu consentimiento (para comunicaciones de marketing)",
          ],
        },
        {
          title: "4. Uso de tus datos",
          intro: "Usamos tus datos para:",
          items: [
            "Proveer, mantener y mejorar la Aplicación",
            "Generar reportes, gráficos y exportaciones PDF",
            "Garantizar la seguridad de la cuenta y prevenir fraudes",
            "Enviarte notificaciones importantes (verificación, actualizaciones)",
            "Cumplir con nuestras obligaciones legales",
          ],
        },
        {
          title: "5. Compartición de datos",
          intro: "No vendemos tus datos. Podemos compartirlos con:",
          items: [
            "Stripe (para el procesamiento de pagos)",
            "Clerk (para la autenticación)",
            "Proveedores de alojamiento y herramientas analíticas",
            "Autoridades competentes si lo exige la ley",
          ],
        },
        {
          title: "6. Seguridad de los datos",
          prose: "Implementamos medidas técnicas y organizativas adecuadas (cifrado, acceso restringido, auditorías regulares). Sin embargo, ninguna transmisión por Internet es 100% segura.",
        },
        {
          title: "7. Tus derechos",
          intro: "Tienes los siguientes derechos:",
          items: [
            "Derecho de acceso, rectificación y supresión",
            "Derecho de oposición y limitación del tratamiento",
            "Derecho a la portabilidad de los datos",
          ],
        },
        {
          title: "8. Conservación de datos",
          prose: "Conservamos tus datos durante el tiempo necesario para prestar el servicio o cumplir con nuestras obligaciones legales.",
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
            "Hosting providers and analytics tools",
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
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: "#111", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
              {fr ? "Política de Privacidad" : "Privacy Policy"}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {fr ? "Última actualización: 27 de abril de 2026" : "Last updated: April 27, 2026"}
            </p>
          </div>

          {/* Operator banner */}
          <div style={{
            background: "#fff7ed", border: "1.5px solid " + ORANGE + "30",
            borderRadius: 16, padding: "16px 22px", marginBottom: 40,
          }}>
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
              {fr
                ? <><strong>Gestor de Finanzas</strong> (en adelante «la Aplicación» o «nosotros») es una herramienta diseñada para emprendedores y micronegocios latinoamericanos.</>
                : <><strong>Gestor de Finanzas</strong> (hereinafter "the Application" or "we") is a tool designed for Latin American entrepreneurs and micro-businesses.</>
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
              ? <>Para ejercer estos derechos, contáctenos en: <strong>soporte@gestordefinanzas.app</strong></>
              : <>To exercise these rights, contact us at: <strong>soporte@gestordefinanzas.app</strong></>
            }
          </p>

          {/* Contact box */}
          <div style={{
            background: "#fff", border: "1.5px solid #f0ede9", borderRadius: 16,
            padding: "20px 24px",
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 14, color: "#6b7280" }}>
              {fr ? "Para cualquier consulta:" : "For any questions:"}
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
