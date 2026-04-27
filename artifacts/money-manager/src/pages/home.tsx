import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useLanguage } from "../lib/language-context";
import { usePwaInstall } from "../hooks/use-pwa-install";
import { SignUpForm } from "@/components/sign-up-form";
import {
  Wallet, TrendingUp, ShieldCheck, UserPlus, PlusCircle,
  BarChart2, Smartphone, CheckCircle, X, Zap, Star, ArrowRight,
} from "lucide-react";

const ORANGE = "#f97316";
const GREEN = "#22c55e";

export default function Home() {
  const { language } = useLanguage();
  const { canInstall, isInstalled, install } = usePwaInstall();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const fr = language !== "en";

  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMobile = isAndroid || isIOS;

  useEffect(() => {
    const dismissed = sessionStorage.getItem("install-banner-dismissed");
    if (dismissed) setBannerDismissed(true);
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem("install-banner-dismissed", "1");
  };

  const features = [
    {
      icon: Wallet,
      title: fr ? "Tous vos wallets en un seul endroit" : "All your wallets in one place",
      description: fr
        ? "Orange Money, Wave, MTN MoMo, M-Pesa, Airtel, espèces — fini les cahiers et les calculs. Tout est centralisé, clair et à jour."
        : "Orange Money, Wave, MTN MoMo, M-Pesa, Airtel, cash — no more notebooks. Everything centralized, clear and up to date.",
      badge: fr ? "5 wallets supportés" : "5 wallets supported",
    },
    {
      icon: TrendingUp,
      title: fr ? "Sachez exactement combien vous gagnez" : "Know exactly how much you earn",
      description: fr
        ? "Tableaux de bord clairs, rapports mensuels et exports PDF. Montrez vos chiffres à votre comptable en un clic."
        : "Clear dashboards, monthly reports and PDF exports. Show your numbers to your accountant in one click.",
      badge: fr ? "Export PDF inclus" : "PDF export included",
    },
    {
      icon: ShieldCheck,
      title: fr ? "Vos finances protégées et privées" : "Your finances protected and private",
      description: fr
        ? "Chiffrement de bout en bout. Vos données financières ne sont jamais partagées, jamais vendues. Vous restez maître de vos données."
        : "End-to-end encryption. Your financial data is never shared or sold. You stay in control of your data.",
      badge: fr ? "Données chiffrées" : "Encrypted data",
    },
  ];

  const steps = [
    {
      icon: UserPlus,
      title: fr ? "Créez votre compte en 30 secondes" : "Create your account in 30 seconds",
      description: fr
        ? "Inscription gratuite, aucune carte bancaire requise. Commencez tout de suite."
        : "Free sign-up, no credit card required. Start right away.",
    },
    {
      icon: PlusCircle,
      title: fr ? "Enregistrez vos transactions" : "Record your transactions",
      description: fr
        ? "Saisissez manuellement ou importez. Orange Money, Wave, MTN MoMo, espèces — tout est pris en charge."
        : "Enter manually or import. Orange Money, Wave, MTN MoMo, cash — all supported.",
    },
    {
      icon: BarChart2,
      title: fr ? "Analysez et progressez" : "Analyze and grow",
      description: fr
        ? "Tableaux de bord clairs, rapports mensuels et suivi par catégorie. Sachez exactement où va votre argent."
        : "Clear dashboards, monthly reports and tracking by category. Know exactly where your money goes.",
    },
  ];

  const testimonials = [
    {
      name: "Kofi Mensah",
      role: fr ? "Vendeur de téléphones" : "Phone vendor",
      city: "Abidjan, Côte d'Ivoire",
      avatar: "KM",
      color: "#22c55e",
      emoji: "📱",
      quote: fr
        ? "Je suivais mes finances dans un carnet. Maintenant je vois mes revenus Wave et Orange Money en temps réel. Mes bénéfices ont augmenté de 20 % en 3 mois."
        : "I tracked finances in a notebook. Now I see my Wave and Orange Money income in real time. My profit grew 20% in 3 months.",
      stars: 5,
    },
    {
      name: "Aminata Diallo",
      role: fr ? "Commerçante textile" : "Textile merchant",
      city: "Dakar, Sénégal",
      avatar: "AD",
      color: "#f97316",
      emoji: "👗",
      quote: fr
        ? "J'ai découvert que je dépensais 30 % de plus que je ne pensais. En deux mois, j'ai réduit mes coûts et augmenté mes bénéfices. Cette appli m'a changé la vie."
        : "I discovered I was spending 30% more than I thought. In two months I cut costs and grew profit. This app changed my life.",
      stars: 5,
    },
    {
      name: "Ibrahim Touré",
      role: fr ? "Artisan électricien" : "Electrician",
      city: "Yaoundé, Cameroun",
      avatar: "IT",
      color: "#6366f1",
      emoji: "⚡",
      quote: fr
        ? "Les rapports PDF sont parfaits pour mes clients et mon comptable. Tout est organisé, professionnel. Je recommande à tous les artisans."
        : "The PDF reports are perfect for my clients and accountant. Everything organized and professional. I recommend it to all artisans.",
      stars: 5,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf9", display: "flex", flexDirection: "column" }}>

      {/* ─── HEADER ─── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,250,249,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #f0ede9",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.svg" alt="MobileMoney Manager" style={{ width: 34, height: 34 }} />
          <span style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>MobileMoney</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/sign-in">
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" }}>
              {fr ? "Connexion" : "Sign in"}
            </span>
          </Link>
          <Link href="/sign-up">
            <span style={{
              fontSize: 13, fontWeight: 700, color: "#fff",
              background: ORANGE, padding: "7px 16px", borderRadius: 8,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
              {fr ? "Commencer gratuitement" : "Start free"}
            </span>
          </Link>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section style={{ padding: "64px 24px 48px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,420px)",
          gap: 48, alignItems: "center",
        }}
          className="hero-grid"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Social proof pill */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content" }}>
              <div style={{ display: "flex", gap: -4 }}>
                {["KM", "AD", "IT"].map((i, idx) => (
                  <div key={i} style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: ["#22c55e", "#f97316", "#6366f1"][idx],
                    color: "#fff", fontSize: 9, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid #fafaf9", marginLeft: idx > 0 ? -8 : 0,
                  }}>{i}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 12, height: 12, color: "#f97316", fill: "#f97316" }} />)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                {fr ? "500+ entrepreneurs nous font confiance" : "500+ entrepreneurs trust us"}
              </span>
            </div>

            <h1 style={{
              fontSize: "clamp(30px, 5vw, 50px)", fontWeight: 900,
              color: "#111", lineHeight: 1.1, letterSpacing: "-0.03em", margin: 0,
            }}>
              {fr
                ? <>Gérez votre argent mobile<br /><span style={{ color: ORANGE }}>facilement et en toute sécurité.</span></>
                : <>Manage your mobile money<br /><span style={{ color: ORANGE }}>easily and securely.</span></>
              }
            </h1>

            <p style={{ fontSize: 17, color: "#4b5563", lineHeight: 1.7, margin: 0, maxWidth: 500 }}>
              {fr
                ? "Le compagnon financier des coiffeuses, vendeurs, artisans et petits commerçants en Afrique. Suivez Orange Money, Wave, MTN MoMo et plus — depuis un seul tableau de bord."
                : "The financial companion for hairdressers, vendors, artisans and small traders in Africa. Track Orange Money, Wave, MTN MoMo and more — from one dashboard."
              }
            </p>

            {/* Mobile-money logos / payment badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "Orange Money", bg: "#fff3e0", color: "#e65100", dot: "#f97316" },
                { label: "Wave",         bg: "#e3f2fd", color: "#1565c0", dot: "#1976d2" },
                { label: "MTN MoMo",     bg: "#fffde7", color: "#f57f17", dot: "#fbc02d" },
                { label: "M-Pesa",       bg: "#e8f5e9", color: "#2e7d32", dot: "#43a047" },
                { label: "Airtel Money", bg: "#fce4ec", color: "#c62828", dot: "#e53935" },
              ].map(({ label, bg, color, dot }) => (
                <span key={label} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 999,
                  background: bg, color, border: `1.5px solid ${dot}22`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0, display: "inline-block" }} />
                  {label}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
              <Link href="/sign-up">
                <button style={{
                  background: ORANGE, color: "#fff", border: "none",
                  borderRadius: 12, padding: "13px 28px", fontWeight: 800, fontSize: 15,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
                }}>
                  {fr ? "Commencer gratuitement" : "Start for free"}
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </Link>
              <Link href="/pricing">
                <button style={{
                  background: "transparent", color: "#374151",
                  border: "1.5px solid #e5e7eb", borderRadius: 12,
                  padding: "13px 24px", fontWeight: 700, fontSize: 15,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Zap style={{ width: 15, height: 15, color: ORANGE }} />
                  {fr ? "Voir les tarifs" : "See pricing"}
                </button>
              </Link>
            </div>

            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: -4 }}>
              {fr ? "✓ Gratuit pour commencer · ✓ Aucune carte bancaire · ✓ Annulez à tout moment" : "✓ Free to start · ✓ No credit card · ✓ Cancel anytime"}
            </p>
          </div>

          {/* Sign-up card */}
          <div style={{
            background: "#fff", border: "1px solid #f0ede9", borderRadius: 20,
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)", padding: "28px 28px 24px",
          }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: 0 }}>
                {fr ? "Créer un compte gratuit" : "Create a free account"}
              </h2>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                {fr ? "Inscription en 30 secondes. Aucune carte bancaire." : "Sign up in 30 seconds. No credit card."}
              </p>
            </div>
            <SignUpForm fullForm />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section style={{
        background: "#fff", borderTop: "1px solid #f0ede9", borderBottom: "1px solid #f0ede9",
        padding: "64px 24px",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, color: "#111", margin: 0 }}>
              {fr ? "Tout ce dont vous avez besoin" : "Everything you need"}
            </h2>
            <p style={{ color: "#6b7280", marginTop: 10, fontSize: 16 }}>
              {fr ? "Conçu pour les réalités des entrepreneurs d'Afrique de l'Ouest et Centrale." : "Built for the realities of West and Central African entrepreneurs."}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {features.map(({ icon: Icon, title, description, badge }) => (
              <div key={title} style={{
                background: "#fafaf9", border: "1.5px solid #f0ede9", borderRadius: 20,
                padding: 24, display: "flex", flexDirection: "column", gap: 14,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 14,
                    background: "linear-gradient(135deg," + ORANGE + "20," + ORANGE + "08)",
                    border: "1.5px solid " + ORANGE + "25",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon style={{ width: 24, height: 24, color: ORANGE }} />
                  </div>
                  {badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                      background: ORANGE + "14", color: ORANGE, border: "1px solid " + ORANGE + "30",
                    }}>{badge}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 8, lineHeight: 1.3 }}>{title}</div>
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: 0 }}>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section style={{ background: "#111", padding: "20px 24px" }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexWrap: "wrap", gap: "12px 32px",
        }}>
          {[
            { icon: "🔒", text: fr ? "Données chiffrées et sécurisées" : "Encrypted & secure data" },
            { icon: "👥", text: fr ? "+500 entrepreneurs actifs" : "+500 active entrepreneurs" },
            { icon: "💳", text: fr ? "Paiement protégé par Stripe" : "Payment secured by Stripe" },
            { icon: "🌍", text: fr ? "Afrique de l'Ouest & Centrale" : "West & Central Africa" },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: "flex", alignItems: "center", gap: 7,
              fontSize: 13, fontWeight: 600, color: "#d1d5db",
            }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding: "64px 24px", maxWidth: 980, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 800, color: "#111", margin: 0 }}>
            {fr ? "Ils nous font confiance" : "They trust us"}
          </h2>
          <p style={{ color: "#6b7280", marginTop: 10, fontSize: 15 }}>
            {fr ? "Des entrepreneurs africains qui ont transformé leur gestion financière." : "African entrepreneurs who transformed their financial management."}
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {testimonials.map(t => (
            <div key={t.name} style={{
              background: "#fff", border: "1.5px solid #f0ede9", borderRadius: 20,
              padding: 24, display: "flex", flexDirection: "column", gap: 14,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              {/* Stars + verified */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 14, height: 14, color: "#f97316", fill: "#f97316" }} />)}
                </div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 10, fontWeight: 700, color: "#16a34a",
                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: 999, padding: "2px 8px",
                }}>
                  <CheckCircle style={{ width: 9, height: 9 }} />
                  {fr ? "Vérifié" : "Verified"}
                </span>
              </div>

              {/* Quote */}
              <p style={{
                fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0,
                borderLeft: `3px solid ${t.color}`, paddingLeft: 12,
              }}>
                "{t.quote}"
              </p>

              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: t.color, color: "#fff", fontSize: 13, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  boxShadow: `0 2px 8px ${t.color}50`,
                }}>
                  {t.emoji}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#111" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{t.role}</div>
                  <div style={{ fontSize: 11, color: ORANGE, fontWeight: 600 }}>📍 {t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{
        background: "#fff", borderTop: "1px solid #f0ede9",
        padding: "64px 24px",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 800, color: "#111", margin: 0 }}>
              {fr ? "Comment ça marche ?" : "How does it work?"}
            </h2>
            <p style={{ color: "#6b7280", marginTop: 10, fontSize: 15 }}>
              {fr ? "Prêt à utiliser en moins de 2 minutes." : "Up and running in under 2 minutes."}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {steps.map(({ icon: Icon, title, description }, i) => (
              <div key={title} style={{
                display: "flex", gap: 18, alignItems: "flex-start",
                background: "#fafaf9", border: "1px solid #f0ede9",
                borderRadius: 18, padding: "20px 22px",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: ORANGE, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: 18,
                }}>{i + 1}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Icon style={{ width: 16, height: 16, color: ORANGE }} />
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{title}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{
          maxWidth: 720, margin: "0 auto",
          background: "linear-gradient(135deg, #431407 0%, #9a3412 100%)",
          borderRadius: 24, padding: "48px 36px",
          textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        }}>
          <img src="/logo.svg" alt="MobileMoney" style={{ width: 52, height: 52 }} />
          <h2 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 900, color: "#fff", margin: 0 }}>
            {fr ? "Commencez dès aujourd'hui" : "Start today"}
          </h2>
          <p style={{ fontSize: 16, color: "#fed7aa", margin: 0, maxWidth: 440 }}>
            {fr
              ? "Rejoignez des centaines d'entrepreneurs qui maîtrisent déjà leurs finances. Gratuit pour commencer."
              : "Join hundreds of entrepreneurs who already master their finances. Free to start."
            }
          </p>
          <Link href="/sign-up">
            <button style={{
              background: ORANGE, color: "#fff", border: "none",
              borderRadius: 14, padding: "14px 32px", fontWeight: 800, fontSize: 16,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(249,115,22,0.40)",
            }}>
              {fr ? "Créer mon compte gratuit" : "Create my free account"}
              <ArrowRight style={{ width: 17, height: 17 }} />
            </button>
          </Link>
          <p style={{ fontSize: 12, color: "#fdba74" }}>
            {fr ? "✓ Gratuit · ✓ Sans carte bancaire · ✓ Installation en 30 secondes" : "✓ Free · ✓ No credit card · ✓ Set up in 30 seconds"}
          </p>
        </div>
      </section>

      {/* ─── PWA INSTALL (if mobile) ─── */}
      {isMobile && !isInstalled && (
        <section style={{ padding: "0 24px 48px" }}>
          <div style={{
            maxWidth: 720, margin: "0 auto",
            background: "#fff", border: "1px solid #f0ede9", borderRadius: 18,
            padding: 24, display: "flex", alignItems: "center", gap: 16,
            flexWrap: "wrap",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: ORANGE + "18", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Smartphone style={{ width: 22, height: 22, color: ORANGE }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>
                {fr ? "Installez l'app sur votre téléphone" : "Install the app on your phone"}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {fr ? "Sans App Store · Fonctionne hors ligne · Gratuit" : "No App Store · Works offline · Free"}
              </div>
            </div>
            {canInstall && (
              <button onClick={install} style={{
                background: ORANGE, color: "#fff", border: "none", borderRadius: 10,
                padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>
                {fr ? "Installer" : "Install"}
              </button>
            )}
          </div>
        </section>
      )}

      {/* ─── FOOTER ─── */}
      <footer style={{
        borderTop: "1px solid #f0ede9", padding: "32px 24px",
        paddingBottom: isMobile && !isInstalled && !bannerDismissed ? 100 : 32,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/logo.svg" alt="MobileMoney" style={{ width: 22, height: 22 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>MobileMoney Manager</span>
            </div>
            <nav style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { href: "/pricing", label: fr ? "Tarifs" : "Pricing" },
                { href: "/sign-in", label: fr ? "Connexion" : "Sign in" },
                { href: "/sign-up", label: fr ? "Inscription" : "Sign up" },
                { href: "mailto:support@mobilemoneymanager.africa", label: "Contact" },
                { href: "/confidentialite", label: fr ? "Confidentialité" : "Privacy" },
                { href: "/conditions", label: fr ? "Conditions" : "Terms" },
                { href: "/mentions-legales", label: fr ? "Mentions légales" : "Legal notice" },
              ].map(({ href, label }) => (
                <a key={label} href={href} style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>
                  {label}
                </a>
              ))}
            </nav>
          </div>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 20, textAlign: "center" }}>
            © {new Date().getFullYear()} MobileMoney Manager · {fr ? "Tous droits réservés." : "All rights reserved."}
          </p>
        </div>
      </footer>

      {/* ─── Sticky Install Banner (mobile) ─── */}
      {isMobile && !isInstalled && !bannerDismissed && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          background: "rgba(250,250,249,0.97)", backdropFilter: "blur(12px)",
          borderTop: `2px solid ${ORANGE}`,
          padding: "12px 16px",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        }}>
          <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
            <Smartphone style={{ width: 20, height: 20, color: ORANGE, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>
                {fr ? "Installer l'application" : "Install the app"}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                {fr
                  ? (isAndroid
                    ? "Menu ⋮ → Installer l'application"
                    : "Safari → Partager ⬆ → Sur l'écran d'accueil")
                  : (isAndroid ? "Menu ⋮ → Install app" : "Safari → Share ⬆ → Add to Home Screen")
                }
              </div>
            </div>
            {canInstall && (
              <button onClick={install} style={{
                background: ORANGE, color: "#fff", border: "none", borderRadius: 8,
                padding: "7px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>
                {fr ? "Installer" : "Install"}
              </button>
            )}
            <button onClick={dismissBanner} style={{
              background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af",
            }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 680px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
