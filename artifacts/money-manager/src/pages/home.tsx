import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useLanguage } from "../lib/language-context";
import { SignUpForm } from "@/components/sign-up-form";
import {
  TrendingUp, ShieldCheck, FileText, Smartphone,
  Star, CheckCircle, ArrowRight, Zap, Lock, Globe,
} from "lucide-react";

const PRIMARY = "#10b981";
const ORANGE  = "#f97316";

const WALLETS = [
  { label: "Mercado Pago", bg: "#ecfdf5", color: "#065f46", dot: "#10b981" },
  { label: "Nequi",        bg: "#eff6ff", color: "#1e40af", dot: "#3b82f6" },
  { label: "OXXO Pay",     bg: "#fff7ed", color: "#c2410c", dot: "#f97316" },
  { label: "Yape",         bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  { label: "Efectivo",     bg: "#f8fafc", color: "#475569", dot: "#94a3b8" },
];

const BENEFITS = [
  {
    icon: TrendingUp,
    emoji: "📊",
    title: "Seguimiento en tiempo real",
    desc: "Todos tus movimientos de Mercado Pago, Nequi y efectivo centralizados. Olvídate de los cuadernos y los cálculos manuales.",
    badge: "Instantáneo",
    badgeColor: PRIMARY,
  },
  {
    icon: FileText,
    emoji: "📄",
    title: "Reportes PDF en 1 clic",
    desc: "Exporta tus reportes mensuales para tu contador o clientes. Profesional y rápido.",
    badge: "Export PDF",
    badgeColor: "#2563eb",
  },
  {
    icon: Smartphone,
    emoji: "📱",
    title: "Diseñado para LATAM",
    desc: "Compatible con Mercado Pago, Nequi, OXXO Pay, Yape y efectivo. Funciona en móvil incluso con conexión lenta.",
    badge: "5 billeteras",
    badgeColor: ORANGE,
  },
  {
    icon: ShieldCheck,
    emoji: "🔒",
    title: "Control simple y seguro",
    desc: "Tus finanzas permanecen privadas. Cifrado de extremo a extremo. Tus datos nunca se comparten.",
    badge: "Seguro",
    badgeColor: "#7c3aed",
  },
];

const TESTIMONIALS = [
  {
    name: "María García",
    role: "Peluquera",
    city: "Buenos Aires, Argentina",
    avatar: "💇‍♀️",
    color: PRIMARY,
    quote: "Antes tenía todo en un cuaderno. Ahora en 2 minutos sé exactamente cuánto gané en la semana con Mercado Pago y en efectivo. ¡Se lo recomiendo a todas mis colegas!",
  },
  {
    name: "Carlos Mendoza",
    role: "Vendedor de ropa",
    city: "Bogotá, Colombia",
    avatar: "👕",
    color: "#3b82f6",
    quote: "Manejaba mis finanzas en un cuaderno. Ahora veo mis ingresos de Nequi en tiempo real. Mis ganancias aumentaron un 20% en 3 meses gracias a los reportes.",
  },
  {
    name: "Ana López",
    role: "Comerciante de alimentos",
    city: "Ciudad de México, México",
    avatar: "🛒",
    color: "#6366f1",
    quote: "Descubrí que gastaba 30% más de lo que pensaba. En dos meses reduje mis costos y aumenté mis ganancias. Esta app me cambió la vida.",
  },
  {
    name: "Juan Rodríguez",
    role: "Artesano",
    city: "Lima, Perú",
    avatar: "🎨",
    color: "#f59e0b",
    quote: "Los reportes PDF son perfectos para mis clientes y mi contador. Todo organizado y profesional. Lo recomiendo a todos los emprendedores.",
  },
];

const TRUST_BADGES = [
  { icon: "🔒", label: "Cancelable en cualquier momento" },
  { icon: "💳", label: "Seguro con Stripe" },
  { icon: "🌎", label: "Diseñado para LATAM" },
  { icon: "⚡", label: "45 días de prueba gratis" },
];

export default function Home() {
  const { language } = useLanguage();
  const fr = language !== "en";
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>

      {/* ── TOP URGENCY BAR ── */}
      <div style={{
        background: "#0f172a",
        color: "#fff", textAlign: "center",
        padding: "10px 16px", lineHeight: 1.5,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexWrap: "wrap", gap: "5px 10px",
        fontSize: 13, fontWeight: 600,
      }}>
        <span style={{ color: "#94a3b8" }}>Oferta de lanzamiento</span>
        <span style={{ color: "#475569" }}>—</span>
        <span style={{ color: "#fff" }}>Starter desde</span>
        <span style={{
          background: ORANGE, color: "#fff",
          padding: "2px 10px", borderRadius: 6, fontWeight: 900, fontSize: 13,
        }}>3,99 €/mes</span>
        <span style={{ color: "#94a3b8" }}>durante 3 meses · en vez de 5 €</span>
        <span style={{ color: "#475569" }}>·</span>
        <span style={{ color: "#fbbf24", fontWeight: 700 }}>⏳ Termina el 31 de julio 2026</span>
      </div>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 20px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <img src="/logo.svg" alt="Gestor de Finanzas" style={{ width: 32, height: 32 }} />
          <span style={{ fontWeight: 900, fontSize: 15, color: "#111", letterSpacing: "-0.02em" }}>
            Gestor <span style={{ color: PRIMARY }}>de Finanzas</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/sign-in">
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer", padding: "6px 12px" }}>
              {fr ? "Iniciar sesión" : "Sign in"}
            </span>
          </Link>
          <Link href="/sign-up">
            <span style={{
              fontSize: 13, fontWeight: 800, color: "#fff",
              background: ORANGE, padding: "8px 18px", borderRadius: 10,
              cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(249,115,22,0.30)",
              display: "inline-block",
            }}>
              {fr ? "Prueba gratis 45d →" : "Free trial 45d →"}
            </span>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ background: "#fff", padding: "64px 20px 72px", borderBottom: "1px solid #e5e7eb" }}>
        <div className="lp-hero-grid" style={{ maxWidth: 1080, margin: "0 auto" }}>

          {/* LEFT: headline + CTA */}
          <div
            className="lp-hero-left-order lp-fadein"
            style={{
              display: "flex", flexDirection: "column", gap: 22,
              opacity: heroVisible ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
          >
            {/* Social proof pill */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content" }}>
              <div style={{ display: "flex" }}>
                {["MG","CM","AL","JR"].map((init, i) => (
                  <div key={init} style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: [PRIMARY,"#3b82f6","#6366f1","#f59e0b"][i],
                    color: "#fff", fontSize: 9, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid #fff", marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i,
                    position: "relative",
                  }}>{init}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 11, height: 11, color: ORANGE, fill: ORANGE }} />)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>+500 emprendedores</span>
            </div>

            {/* Trial badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: 999, padding: "6px 16px", width: "fit-content",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: PRIMARY, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                45 días de prueba gratis — Sin tarjeta de crédito
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: "clamp(26px,4.5vw,50px)", fontWeight: 900,
              color: "#111", lineHeight: 1.15, letterSpacing: "-0.03em", margin: 0,
            }}>
              Deja de anotar todo en un cuaderno.{" "}
              Gestiona tu{" "}
              <span style={{ color: PRIMARY }}>Mercado Pago,</span>{" "}
              Nequi y OXXO Pay{" "}
              <span style={{ color: PRIMARY }}>como un pro.</span>
            </h1>

            <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, margin: 0, maxWidth: 530, fontWeight: 500 }}>
              45 días de prueba gratis &nbsp;•&nbsp; Sin tarjeta requerida &nbsp;•&nbsp; Diseñado para emprendedores, comerciantes y micronegocios latinoamericanos
            </p>

            {/* Wallet badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {WALLETS.map(({ label, bg, color, dot }) => (
                <span key={label} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 999,
                  background: bg, color, border: `1.5px solid ${dot}30`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, display: "inline-block" }} />
                  {label}
                </span>
              ))}
            </div>

            {/* Primary CTA */}
            <div>
              {/* Urgency nudge above button */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "#fffbeb", border: "1px solid #fde68a",
                borderRadius: 8, padding: "5px 12px", marginBottom: 14,
              }}>
                <span style={{ fontSize: 13 }}>⏳</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}>
                  Oferta 3,99 €/mes — expira el 31 de julio
                </span>
              </div>

              <div style={{ display: "block" }}>
                <Link href="/sign-up">
                  <button
                    className="lp-cta-pulse"
                    style={{
                      background: "linear-gradient(135deg,#f97316,#c2410c)",
                      color: "#fff", border: "none", borderRadius: 16,
                      padding: "20px 38px", fontWeight: 900, fontSize: 19,
                      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 12,
                      letterSpacing: "-0.02em", width: "100%", justifyContent: "center",
                      maxWidth: 480,
                    }}
                  >
                    Comenzar gratis ahora
                    <ArrowRight style={{ width: 22, height: 22 }} />
                  </button>
                </Link>
              </div>

              {/* Social proof nudge */}
              <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, marginTop: 10, marginBottom: 0 }}>
                👥 Únete a +500 emprendedores que ya gestionan mejor su dinero
              </p>

              <div style={{ display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
                {[
                  { icon: "✅", text: "45 días gratis" },
                  { icon: "🚫", text: "Sin tarjeta de crédito" },
                  { icon: "↩️", text: "Cancelable en cualquier momento" },
                ].map(({ icon, text }) => (
                  <span key={text} style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    {icon} {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Trust line */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
              fontSize: 12, color: "#6b7280", fontWeight: 600,
            }}>
              <Lock style={{ width: 12, height: 12, color: "#9ca3af" }} />
              Ya usado por +500 emprendedores en LATAM
              <span style={{ color: "#d1d5db" }}>·</span>
              Pagos seguros con Stripe
            </div>
          </div>

          {/* RIGHT: signup card */}
          <div className="lp-signup-card-order" style={{
            background: "#fff",
            border: "1.5px solid #e5e7eb",
            borderRadius: 22,
            boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
            padding: "28px 26px 24px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Accent bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg,${PRIMARY},#2563eb)`,
            }} />

            <div style={{ marginBottom: 22 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#f8fafc", border: "1px solid #e2e8f0",
                borderRadius: 999, padding: "5px 14px",
                fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 14,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIMARY, display: "inline-block" }} />
                45 días gratis · Sin tarjeta de crédito
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                Crea tu cuenta gratis
              </h2>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                Email + contraseña · Registro en 30 segundos
              </p>
            </div>

            <SignUpForm simpleForm />

            {/* Mini trust row */}
            <div style={{
              marginTop: 16, paddingTop: 14,
              borderTop: "1px solid #f3f4f6",
              display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap",
            }}>
              {[
                { icon: "🔒", label: "Seguro" },
                { icon: "🚫", label: "Sin tarjeta" },
                { icon: "↩️", label: "Cancelable" },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                  <span>{icon}</span> {label}
                </div>
              ))}
            </div>

            {/* Inline testimonial */}
            <div style={{
              marginTop: 18,
              background: "#fafaf9",
              border: "1.5px solid #e5e7eb",
              borderRadius: 14,
              padding: "14px 16px",
            }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 12, height: 12, color: ORANGE, fill: ORANGE }} />)}
              </div>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, margin: "0 0 10px", fontStyle: "italic" }}>
                "Antes tenía todo en un cuaderno. Ahora en 2 minutos sé exactamente cuánto gané. ¡Se lo recomiendo a todas mis colegas!"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `linear-gradient(135deg,${PRIMARY},#059669)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>💇‍♀️</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#111" }}>María García</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Peluquera · Buenos Aires, Argentina</div>
                </div>
                <span style={{
                  marginLeft: "auto", fontSize: 10, fontWeight: 700,
                  background: "#f0fdf4", color: "#16a34a",
                  border: "1px solid #bbf7d0", borderRadius: 999, padding: "2px 8px",
                }}>✓ Verificado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ background: "#111827", padding: "16px 20px", borderTop: `3px solid ${PRIMARY}` }}>
        <div className="lp-trust-bar" style={{ maxWidth: 900, margin: "0 auto" }}>
          {TRUST_BADGES.map(({ icon, label }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 800, color: "#e2e8f0",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 8, padding: "6px 14px",
            }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── BENEFITS ── */}
      <section style={{ padding: "60px 20px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{
              display: "inline-block", fontSize: 11, fontWeight: 800,
              color: PRIMARY, background: "#ecfdf5", border: "1px solid #a7f3d0",
              borderRadius: 999, padding: "4px 14px", marginBottom: 12, letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              ¿Por qué elegirnos?
            </p>
            <h2 style={{
              fontSize: "clamp(22px,4vw,36px)", fontWeight: 900,
              color: "#111", margin: 0, letterSpacing: "-0.02em",
            }}>
              Todo lo que necesitas para gestionar tu dinero
            </h2>
            <p style={{ color: "#6b7280", marginTop: 10, fontSize: 15, maxWidth: 480, margin: "10px auto 0" }}>
              Diseñado para la realidad de los microemprendedores latinoamericanos.
            </p>
          </div>

          <div className="lp-benefits-grid">
            {BENEFITS.map(({ icon: Icon, emoji, title, desc, badge, badgeColor }) => (
              <div key={title} style={{
                background: "#fff", border: "1.5px solid #e5e7eb",
                borderRadius: 20, padding: "24px 22px",
                display: "flex", flexDirection: "column", gap: 14,
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: `${badgeColor}12`,
                    border: `1.5px solid ${badgeColor}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24,
                  }}>
                    {emoji}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 999,
                    background: `${badgeColor}15`, color: badgeColor,
                    border: `1px solid ${badgeColor}30`, whiteSpace: "nowrap",
                  }}>{badge}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 7, lineHeight: 1.3 }}>{title}</div>
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BANNER ── */}
      <div style={{
        background: "linear-gradient(135deg,#ecfdf5,#fff)",
        border: "1px solid #a7f3d0",
        padding: "22px 20px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: 0 }}>
          🤝 Únete a <span style={{ color: PRIMARY }}>+500 comerciantes y emprendedores</span> que gestionan mejor su dinero con Gestor de Finanzas
        </p>
      </div>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "60px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{
              display: "inline-block", fontSize: 11, fontWeight: 800,
              color: PRIMARY, background: "#ecfdf5", border: "1px solid #a7f3d0",
              borderRadius: 999, padding: "4px 14px", marginBottom: 12,
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              Confían en nosotros
            </p>
            <h2 style={{
              fontSize: "clamp(22px,4vw,34px)", fontWeight: 900,
              color: "#111", margin: 0, letterSpacing: "-0.02em",
            }}>
              Emprendedores latinoamericanos que transformaron sus finanzas
            </h2>
          </div>

          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{
                background: "#fafafa", border: "1.5px solid #e5e7eb",
                borderRadius: 20, padding: "22px 20px",
                display: "flex", flexDirection: "column", gap: 14,
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              }}>
                {/* Stars + verified */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 13, height: 13, color: ORANGE, fill: ORANGE }} />)}
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 10, fontWeight: 700, color: "#16a34a",
                    background: "#f0fdf4", border: "1px solid #bbf7d0",
                    borderRadius: 999, padding: "2px 8px",
                  }}>
                    <CheckCircle style={{ width: 9, height: 9 }} />
                    Verificado
                  </span>
                </div>

                {/* Quote */}
                <p style={{
                  fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0,
                  borderLeft: `3px solid ${t.color}`, paddingLeft: 12, flex: 1,
                }}>
                  "{t.quote}"
                </p>

                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: `${t.color}20`, border: `2px solid ${t.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#111" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{t.role}</div>
                    <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 700 }}>📍 {t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{
        padding: "60px 20px",
        background: "linear-gradient(135deg,#111827 0%,#1f2937 100%)",
      }}>
        <div style={{
          maxWidth: 680, margin: "0 auto",
          textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: `linear-gradient(135deg,#ecfdf5,#d1fae5)`,
            border: `2px solid ${PRIMARY}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30,
          }}>
            🚀
          </div>

          <div>
            <h2 style={{
              fontSize: "clamp(24px,4vw,38px)", fontWeight: 900,
              color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em",
            }}>
              Empieza hoy mismo — <span style={{ color: "#34d399" }}>Es gratis</span>
            </h2>
            <p style={{ fontSize: 16, color: "#94a3b8", margin: 0, lineHeight: 1.7, maxWidth: 480 }}>
              Únete a +500 emprendedores que ya dominan sus finanzas. <strong style={{ color: "#fff" }}>45 días de prueba gratis</strong>, sin tarjeta de crédito.
            </p>
          </div>

          <Link href="/sign-up">
            <button
              className="lp-cta-pulse"
              style={{
                background: "linear-gradient(135deg,#f97316,#ea580c)",
                color: "#fff", border: "none", borderRadius: 14,
                padding: "16px 36px", fontWeight: 900, fontSize: 17,
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10,
                letterSpacing: "-0.01em",
              }}
            >
              🎁 Comenzar gratis en 30 segundos
              <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
          </Link>

          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            ✓ 45 días gratis &nbsp;·&nbsp; ✓ Sin tarjeta de crédito &nbsp;·&nbsp; ✓ Cancelable en cualquier momento
          </p>

          {/* Trust badges row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", justifyContent: "center", marginTop: 4 }}>
            {[
              { icon: <Lock style={{ width: 11, height: 11 }} />, label: "Cancelable en cualquier momento" },
              { icon: "💳", label: "Seguro con Stripe" },
              { icon: <Globe style={{ width: 11, height: 11 }} />, label: "Diseñado para LATAM" },
            ].map(({ icon, label }, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 600, color: "#64748b",
              }}>
                <span style={{ color: "#94a3b8" }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: "#0f172a", padding: "24px 20px",
        display: "flex", flexWrap: "wrap", alignItems: "center",
        justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.svg" alt="Gestor de Finanzas" style={{ width: 26, height: 26 }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8" }}>Gestor de Finanzas</span>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { href: "/pricing",          label: "Precios" },
            { href: "/conditions",       label: "Términos" },
            { href: "/confidentialite",  label: "Privacidad" },
            { href: "/mentions-legales", label: "Aviso legal" },
          ].map(({ href, label }) => (
            <Link key={href} href={href}>
              <span style={{ fontSize: 12, color: "#475569", cursor: "pointer", fontWeight: 500 }}>{label}</span>
            </Link>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#334155", margin: 0 }}>
          © 2026 Gestor de Finanzas · América Latina
        </p>
      </footer>
    </div>
  );
}
