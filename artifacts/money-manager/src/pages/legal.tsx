import { useLanguage } from "../lib/language-context";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const ORANGE = "#f97316";

export default function Legal() {
  const { language } = useLanguage();
  const fr = language !== "en";

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
              {fr ? "Aviso Legal" : "Legal Notice"}
            </h1>
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              {fr ? "Última actualización: 27 de abril de 2026" : "Last updated: April 27, 2026"}
            </p>
          </div>

          {/* 1 — Éditeur */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f0ede9" }}>
              {fr ? "1. Editor del sitio" : "1. Publisher"}
            </h2>
            <div style={{
              background: "#fff", border: "1.5px solid #f0ede9", borderRadius: 16,
              padding: "18px 22px", display: "flex", flexDirection: "column", gap: 4,
            }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#111" }}>Gestor de Finanzas</p>
              <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
                Gestor de Finanzas
              </p>
              <a href="mailto:soporte@gestordefinanzas.app" style={{ fontSize: 14, color: ORANGE, fontWeight: 700, textDecoration: "none", marginTop: 4 }}>
                soporte@gestordefinanzas.app
              </a>
            </div>
          </section>

          {/* 2 — Hébergement */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f0ede9" }}>
              {fr ? "2. Alojamiento" : "2. Hosting"}
            </h2>
            <div style={{
              background: "#fff", border: "1.5px solid #f0ede9", borderRadius: 16,
              padding: "18px 22px",
            }}>
              <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
                {fr
                  ? "La aplicación está alojada por un proveedor de servicios profesional en la nube, con altos estándares de seguridad internacionales."
                  : "The application is hosted by a professional cloud service provider with high international security standards."
                }
              </p>
            </div>
          </section>

          {/* 3 — Propriété intellectuelle */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f0ede9" }}>
              {fr ? "3. Propiedad intelectual" : "3. Intellectual property"}
            </h2>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: "0 0 10px" }}>
              {fr
                ? "Todo el contenido de la aplicación Gestor de Finanzas (estructura, diseño, logotipos, textos, gráficos, base de datos, etc.) es propiedad exclusiva del editor."
                : "All content of the Gestor de Finanzas application (structure, design, logos, texts, graphics, database, etc.) is the exclusive property of the publisher."
              }
            </p>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>
              {fr
                ? "Cualquier reproducción, representación, modificación o adaptación total o parcial está estrictamente prohibida sin autorización escrita previa."
                : "Any total or partial reproduction, representation, modification or adaptation is strictly prohibited without prior written authorisation."
              }
            </p>
          </section>

          {/* 4 — Données personnelles */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f0ede9" }}>
              {fr ? "4. Datos personales" : "4. Personal data"}
            </h2>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>
              {fr
                ? <>El tratamiento de los datos personales se rige por nuestra{" "}
                    <Link href="/confidentialite" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none" }}>
                      Política de Privacidad
                    </Link>
                    . Tienes derecho a acceder, rectificar, suprimir y oponerte al tratamiento de tus datos.</>
                : <>The processing of personal data is governed by our{" "}
                    <Link href="/confidentialite" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none" }}>
                      Privacy Policy
                    </Link>
                    . You have the right to access, rectify, erase and object to your data.</>
              }
            </p>
          </section>

          {/* 5 — Limitation de responsabilité */}
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f0ede9" }}>
              {fr ? "5. Limitación de responsabilidad" : "5. Limitation of liability"}
            </h2>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: "0 0 10px" }}>
              {fr
                ? "Gestor de Finanzas es una herramienta de apoyo a la gestión financiera. El editor no puede ser responsable de:"
                : "Gestor de Finanzas is a financial management assistance tool. The publisher cannot be held liable for:"
              }
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {(fr
                ? [
                    "Errores u omisiones en los datos introducidos por el usuario",
                    "Pérdidas financieras derivadas del uso de la aplicación",
                    "Disfunciones relacionadas con servicios de pago digital (Mercado Pago, Nequi, OXXO Pay, etc.)",
                    "Interrupciones del servicio debidas a causas de fuerza mayor",
                  ]
                : [
                    "Errors or omissions in data entered by the user",
                    "Financial losses resulting from use of the application",
                    "Malfunctions related to digital payment services (Mercado Pago, Nequi, OXXO Pay, etc.)",
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
              {fr ? "6. Ley aplicable" : "6. Governing law"}
            </h2>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>
              {fr
                ? "El presente aviso legal se rige por la legislación aplicable. Cualquier disputa se someterá a los tribunales competentes."
                : "These legal notices are governed by applicable law. Any dispute shall be submitted to the competent courts."
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
                ? "Para cualquier consulta sobre este aviso legal o la aplicación:"
                : "For any questions about these legal notices or the application:"
              }
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
