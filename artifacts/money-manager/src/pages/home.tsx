import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useLanguage } from "../lib/language-context";
import { SignUpForm } from "@/components/sign-up-form";
import {
  TrendingUp, ShieldCheck, FileText, Smartphone,
  Star, CheckCircle, ArrowRight, Zap, Lock, Globe,
} from "lucide-react";

const ORANGE = "#f97316";

const WALLETS = [
  { label: "Orange Money", bg: "#fff3e0", color: "#e65100", dot: "#f97316" },
  { label: "Wave",         bg: "#e3f2fd", color: "#1565c0", dot: "#1976d2" },
  { label: "MTN MoMo",    bg: "#fffde7", color: "#f57f17", dot: "#fbc02d" },
  { label: "M-Pesa",      bg: "#e8f5e9", color: "#2e7d32", dot: "#43a047" },
  { label: "Airtel",      bg: "#fce4ec", color: "#c62828", dot: "#e53935" },
];

const BENEFITS = [
  {
    icon: TrendingUp,
    emoji: "📊",
    title: "Suivi en temps réel",
    desc: "Tous vos mouvements Orange Money, Wave et MTN MoMo centralisés. Fini les cahiers et les calculs manuels.",
    badge: "Instantané",
    badgeColor: "#16a34a",
  },
  {
    icon: FileText,
    emoji: "📄",
    title: "Rapports PDF en 1 clic",
    desc: "Exportez vos rapports mensuels pour votre comptable ou vos clients. Professionnel et rapide.",
    badge: "Export PDF",
    badgeColor: "#1d4ed8",
  },
  {
    icon: Smartphone,
    emoji: "📱",
    title: "Conçu pour l'Afrique",
    desc: "Compatible Orange Money, Wave, MTN MoMo, M-Pesa, Airtel. Fonctionne sur mobile même avec une faible connexion.",
    badge: "5 wallets",
    badgeColor: ORANGE,
  },
  {
    icon: ShieldCheck,
    emoji: "🔒",
    title: "Contrôle simple & sécurisé",
    desc: "Vos finances restent privées. Chiffrement de bout en bout. Vos données ne sont jamais partagées.",
    badge: "Sécurisé",
    badgeColor: "#7c3aed",
  },
];

const TESTIMONIALS = [
  {
    name: "Fatou Camara",
    role: "Coiffeuse",
    city: "Conakry, Guinée",
    avatar: "💇‍♀️",
    color: "#f97316",
    quote: "Avant j'avais tout dans ma tête et dans un cahier. Maintenant en 2 minutes je sais exactement ce que j'ai gagné dans la semaine sur Orange Money et Wave. Je recommande à toutes mes collègues coiffeuses !",
  },
  {
    name: "Kofi Mensah",
    role: "Vendeur de téléphones",
    city: "Abidjan, Côte d'Ivoire",
    avatar: "📱",
    color: "#22c55e",
    quote: "Je suivais mes finances dans un carnet. Maintenant je vois mes revenus Wave et Orange Money en temps réel. Mes bénéfices ont augmenté de 20 % en 3 mois grâce aux rapports.",
  },
  {
    name: "Aminata Diallo",
    role: "Commerçante textile",
    city: "Dakar, Sénégal",
    avatar: "👗",
    color: "#6366f1",
    quote: "J'ai découvert que je dépensais 30 % de plus que je ne pensais. En deux mois, j'ai réduit mes coûts et augmenté mes bénéfices. Cette appli m'a changé la vie.",
  },
  {
    name: "Ibrahim Touré",
    role: "Artisan électricien",
    city: "Yaoundé, Cameroun",
    avatar: "⚡",
    color: "#eab308",
    quote: "Les rapports PDF sont parfaits pour mes clients et mon comptable. Tout est organisé et professionnel. Je recommande à tous les artisans qui veulent sérieusement gérer leur argent.",
  },
];

const TRUST_BADGES = [
  { icon: "🔒", label: "Annulable à tout moment" },
  { icon: "💳", label: "Sécurisé par Stripe & PayPal" },
  { icon: "🌍", label: "Conçu pour l'Afrique" },
  { icon: "⚡", label: "45 jours d'essai gratuit" },
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
        background: "linear-gradient(90deg,#111827,#1f2937)",
        color: "#fff", textAlign: "center",
        padding: "8px 16px", fontSize: 12, fontWeight: 700, letterSpacing: "0.02em",
      }}>
        🚀 OFFRE DE LANCEMENT — Starter à <span style={{ color: "#fbbf24" }}>3,99 €/mois</span> les 3 premiers mois · Se termine le <span style={{ color: "#fb923c" }}>31 mai 2026</span>
      </div>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #f0ede9",
        padding: "0 20px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <img src="/logo.svg" alt="MobileMoney Manager" style={{ width: 32, height: 32 }} />
          <span style={{ fontWeight: 900, fontSize: 15, color: "#111", letterSpacing: "-0.02em" }}>
            MobileMoney <span style={{ color: ORANGE }}>Manager</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/sign-in">
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer", padding: "6px 12px" }}>
              {fr ? "Connexion" : "Sign in"}
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
              {fr ? "Essai gratuit 45j →" : "Free trial 45d →"}
            </span>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ background: "#fff", padding: "48px 20px 56px", borderBottom: "1px solid #f0ede9" }}>
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
                {["FC","KM","AD","IT"].map((init, i) => (
                  <div key={init} style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: ["#f97316","#22c55e","#6366f1","#eab308"][i],
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
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>+500 entrepreneurs</span>
            </div>

            {/* Trial badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "#f0fdf4", border: "1.5px solid #bbf7d0",
              borderRadius: 999, padding: "5px 14px", width: "fit-content",
            }}>
              <Zap style={{ width: 13, height: 13, color: "#16a34a", fill: "#16a34a" }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#15803d" }}>
                45 jours d'essai gratuit — Aucune carte bancaire requise
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: "clamp(28px,5vw,52px)", fontWeight: 900,
              color: "#111", lineHeight: 1.1, letterSpacing: "-0.03em", margin: 0,
            }}>
              Gérez votre{" "}
              <span style={{ color: ORANGE }}>Orange Money,</span>{" "}
              Wave et MTN MoMo{" "}
              <span style={{ color: ORANGE }}>facilement</span>
            </h1>

            <p style={{ fontSize: 17, color: "#4b5563", lineHeight: 1.65, margin: 0, maxWidth: 520 }}>
              Le tableau de bord financier des <strong>coiffeuses, vendeurs, artisans</strong> et petits commerçants en Afrique. Tout centralisé, tout clair.
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
              <Link href="/sign-up">
                <button
                  className="lp-cta-pulse"
                  style={{
                    background: "linear-gradient(135deg,#f97316,#ea580c)",
                    color: "#fff", border: "none", borderRadius: 14,
                    padding: "16px 32px", fontWeight: 900, fontSize: 17,
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10,
                    letterSpacing: "-0.01em",
                  }}
                >
                  🎁 Commencer gratuitement en 30 secondes
                  <ArrowRight style={{ width: 18, height: 18 }} />
                </button>
              </Link>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 10, marginBottom: 0 }}>
                ✓ Gratuit 45 jours &nbsp;·&nbsp; ✓ Aucune carte bancaire &nbsp;·&nbsp; ✓ Annulable à tout moment
              </p>
            </div>

            {/* Trust line */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
              fontSize: 12, color: "#6b7280", fontWeight: 600,
            }}>
              <Lock style={{ width: 12, height: 12, color: "#9ca3af" }} />
              Déjà utilisé par +500 entrepreneurs en Afrique
              <span style={{ color: "#d1d5db" }}>·</span>
              Paiement sécurisé par Stripe & PayPal
            </div>
          </div>

          {/* RIGHT: signup card */}
          <div className="lp-signup-card-order" style={{
            background: "#fff",
            border: "1.5px solid #f0ede9",
            borderRadius: 22,
            boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
            padding: "28px 26px 24px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Accent bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: "linear-gradient(90deg,#f97316,#fb923c,#22c55e)",
            }} />

            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#fff7ed", border: "1px solid #fed7aa",
                borderRadius: 999, padding: "4px 12px",
                fontSize: 11, fontWeight: 800, color: ORANGE, marginBottom: 12,
              }}>
                🎁 45 jours gratuits · Aucune carte bancaire
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.02em" }}>
                Créer votre compte gratuit
              </h2>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 5 }}>
                Inscription en 30 secondes. Commencez tout de suite.
              </p>
            </div>

            <SignUpForm fullForm />

            {/* Mini trust row */}
            <div style={{
              marginTop: 16, paddingTop: 14,
              borderTop: "1px solid #f3f4f6",
              display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap",
            }}>
              {[
                { icon: "🔒", label: "Sécurisé" },
                { icon: "🚫", label: "Sans CB" },
                { icon: "↩️", label: "Annulable" },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                  <span>{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ background: "#1e293b", padding: "14px 20px" }}>
        <div className="lp-trust-bar" style={{ maxWidth: 900, margin: "0 auto" }}>
          {TRUST_BADGES.map(({ icon, label }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 7,
              fontSize: 12, fontWeight: 700, color: "#94a3b8",
            }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
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
              color: ORANGE, background: "#fff7ed", border: "1px solid #fed7aa",
              borderRadius: 999, padding: "4px 14px", marginBottom: 12, letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              Pourquoi nous choisir ?
            </p>
            <h2 style={{
              fontSize: "clamp(22px,4vw,36px)", fontWeight: 900,
              color: "#111", margin: 0, letterSpacing: "-0.02em",
            }}>
              Tout ce qu'il vous faut pour gérer votre argent
            </h2>
            <p style={{ color: "#6b7280", marginTop: 10, fontSize: 15, maxWidth: 480, margin: "10px auto 0" }}>
              Conçu pour les réalités des micro-entrepreneurs d'Afrique de l'Ouest et Centrale.
            </p>
          </div>

          <div className="lp-benefits-grid">
            {BENEFITS.map(({ icon: Icon, emoji, title, desc, badge, badgeColor }) => (
              <div key={title} style={{
                background: "#fff", border: "1.5px solid #f0ede9",
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
        background: "linear-gradient(135deg,#fff7ed,#fff)",
        border: "1px solid #fed7aa",
        padding: "22px 20px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: 0 }}>
          🤝 Rejoignez <span style={{ color: ORANGE }}>+500 coiffeuses et commerçants</span> qui gèrent mieux leur argent avec MobileMoney Manager
        </p>
      </div>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "60px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{
              display: "inline-block", fontSize: 11, fontWeight: 800,
              color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 999, padding: "4px 14px", marginBottom: 12,
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              Ils nous font confiance
            </p>
            <h2 style={{
              fontSize: "clamp(22px,4vw,34px)", fontWeight: 900,
              color: "#111", margin: 0, letterSpacing: "-0.02em",
            }}>
              Des entrepreneurs africains qui transforment leurs finances
            </h2>
          </div>

          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{
                background: "#fafaf9", border: "1.5px solid #f0ede9",
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
                    Vérifié
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
                    <div style={{ fontSize: 11, color: ORANGE, fontWeight: 700 }}>📍 {t.city}</div>
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
            background: "linear-gradient(135deg,#fff7ed,#ffedd5)",
            border: "2px solid rgba(249,115,22,0.3)",
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
              Commencez dès aujourd'hui — <span style={{ color: "#fb923c" }}>C'est gratuit</span>
            </h2>
            <p style={{ fontSize: 16, color: "#94a3b8", margin: 0, lineHeight: 1.7, maxWidth: 480 }}>
              Rejoignez +500 entrepreneurs qui maîtrisent déjà leurs finances. <strong style={{ color: "#fff" }}>45 jours d'essai gratuit</strong>, aucune carte bancaire requise.
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
              🎁 Commencer gratuitement en 30 secondes
              <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
          </Link>

          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            ✓ 45 jours gratuits &nbsp;·&nbsp; ✓ Aucune carte bancaire &nbsp;·&nbsp; ✓ Annulable à tout moment
          </p>

          {/* Trust badges row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", justifyContent: "center", marginTop: 4 }}>
            {[
              { icon: <Lock style={{ width: 11, height: 11 }} />, label: "Annulable à tout moment" },
              { icon: "💳", label: "Sécurisé par Stripe & PayPal" },
              { icon: <Globe style={{ width: 11, height: 11 }} />, label: "Conçu pour l'Afrique" },
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
          <img src="/logo.svg" alt="MobileMoney Manager" style={{ width: 26, height: 26 }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8" }}>MobileMoney Manager</span>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { href: "/pricing",       label: "Tarifs" },
            { href: "/conditions",    label: "CGU" },
            { href: "/confidentialite", label: "Confidentialité" },
            { href: "/mentions-legales", label: "Mentions légales" },
          ].map(({ href, label }) => (
            <Link key={href} href={href}>
              <span style={{ fontSize: 12, color: "#475569", cursor: "pointer", fontWeight: 500 }}>{label}</span>
            </Link>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#334155", margin: 0 }}>
          © 2026 MobileMoney Manager · Afrique de l'Ouest & Centrale
        </p>
      </footer>
    </div>
  );
}
