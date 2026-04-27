import { useState } from "react";
import { useUser } from "@clerk/react";
import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "../hooks/use-pwa-install";
import { Smartphone, CheckCircle2, Gift, Copy, Check, ExternalLink } from "lucide-react";

const ORANGE = "#f97316";

function ReferralCard({ language }: { language: string }) {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const fr = language !== "en";

  const referralCode = user?.id?.slice(-8).toUpperCase() ?? "--------";
  const referralLink = `https://mobilemoneymanager.africa?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = referralLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "MobileMoney Manager",
        text: fr
          ? "Gérez facilement vos finances mobile en Afrique avec MobileMoney Manager. Rejoignez-moi !"
          : "Easily manage your mobile finances in Africa with MobileMoney Manager. Join me!",
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{
      borderRadius: 18, overflow: "hidden",
      border: "1px solid #fed7aa",
      background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
    }}>
      <div style={{ padding: "20px 22px", borderBottom: "1px solid #fed7aa" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Gift style={{ width: 20, height: 20, color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>
              {fr ? "Parrainer un ami" : "Refer a friend"}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
              {fr
                ? "1 mois Pro gratuit — pour vous ET votre ami parrainé."
                : "1 free Pro month — for you AND your referred friend."}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            {
              step: "1",
              icon: "🔗",
              title: fr ? "Partagez votre lien" : "Share your link",
              desc: fr ? "Envoyez-le à vos amis entrepreneurs." : "Send it to your entrepreneur friends.",
            },
            {
              step: "2",
              icon: "🎁",
              title: fr ? "Ils s'abonnent" : "They subscribe",
              desc: fr ? "Ils bénéficient aussi d'1 mois Pro offert." : "They also get 1 free Pro month.",
            },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} style={{
              background: "#fff", borderRadius: 12, padding: "14px 16px",
              border: "1px solid #f0ede9",
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#111", marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: "#fff", border: "1px solid #fed7aa", borderRadius: 12, padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
              {fr ? "Votre lien de parrainage" : "Your referral link"}
            </div>
            <div style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {referralLink}
            </div>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "#22c55e" : ORANGE,
              color: "#fff", border: "none", borderRadius: 8,
              padding: "7px 14px", fontWeight: 700, fontSize: 12,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              flexShrink: 0, transition: "background 0.15s",
            }}
          >
            {copied
              ? <><Check style={{ width: 13, height: 13 }} /> {fr ? "Copié !" : "Copied!"}</>
              : <><Copy style={{ width: 13, height: 13 }} /> {fr ? "Copier" : "Copy"}</>
            }
          </button>
        </div>

        <button
          onClick={handleShare}
          style={{
            background: ORANGE, color: "#fff", border: "none", borderRadius: 12,
            padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 2px 10px rgba(249,115,22,0.28)",
          }}
        >
          <ExternalLink style={{ width: 15, height: 15 }} />
          {fr ? "Partager avec un ami" : "Share with a friend"}
        </button>

        <div style={{
          background: "#fff", borderRadius: 10, padding: "10px 14px",
          border: "1px solid #f0ede9",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚡</span>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
            {fr
              ? "Dès qu'un ami s'abonne via votre lien, vous recevez tous les deux 1 mois de Pro offert automatiquement."
              : "Once a friend subscribes via your link, you both automatically receive 1 free Pro month."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { canInstall, isInstalled, install } = usePwaInstall();
  const fr = language !== "en";

  return (
    <Layout>
      <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#111" }}>{t("nav.settings")}</h1>
          <p style={{ color: "#6b7280", marginTop: 4, fontSize: 14 }}>
            {fr ? "Personnalisez votre expérience." : "Customize your experience."}
          </p>
        </div>

        {/* Preferences */}
        <div style={{
          background: "#fff", borderRadius: 18, border: "1px solid #f0ede9",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden",
        }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #f5f3f0" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
              {fr ? "Préférences" : "Preferences"}
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>
              {fr ? "Gérez la langue et l'affichage." : "Manage language and display."}
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <Label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              {fr ? "Langue de l'application" : "App language"}
            </Label>
            <div style={{ marginTop: 8 }}>
              <Select value={language} onValueChange={(val: "fr"|"en") => setLanguage(val)}>
                <SelectTrigger>
                  <SelectValue placeholder={fr ? "Choisir la langue" : "Choose language"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Referral */}
        <ReferralCard language={language} />

        {/* PWA install */}
        <div style={{
          background: "#fff", borderRadius: 18, border: "1px solid #f0ede9",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden",
        }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #f5f3f0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: ORANGE + "18", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Smartphone style={{ width: 18, height: 18, color: ORANGE }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
                {fr ? "Application mobile" : "Mobile app"}
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 1 }}>
                {fr
                  ? "Installez l'app pour y accéder sans navigateur."
                  : "Install the app to access it without a browser."}
              </div>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            {isInstalled ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#16a34a" }}>
                <CheckCircle2 style={{ width: 20, height: 20, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {fr ? "Application déjà installée sur cet appareil." : "App already installed on this device."}
                </span>
              </div>
            ) : canInstall ? (
              <button onClick={install} style={{
                width: "100%", background: ORANGE, color: "#fff", border: "none",
                borderRadius: 12, padding: "12px 20px", fontWeight: 700, fontSize: 14,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <Smartphone style={{ width: 18, height: 18 }} />
                {fr ? "Installer l'application" : "Install app"}
              </button>
            ) : (
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
                <p style={{ fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  {fr ? "Comment installer :" : "How to install:"}
                </p>
                <p><strong>iOS (Safari) :</strong> {fr ? "Bouton Partager" : "Share button"} ⬆ → {fr ? "Sur l'écran d'accueil" : "Add to Home Screen"}</p>
                <p><strong>Android (Chrome) :</strong> Menu ⋮ → {fr ? "Ajouter à l'écran d'accueil" : "Add to Home screen"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Legal links */}
        <div style={{
          borderRadius: 14, border: "1px solid #f0ede9", background: "#fafaf9",
          padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: 16,
        }}>
          {[
            { href: "mailto:support@mobilemoneymanager.africa", label: fr ? "Contact & Support" : "Contact & Support" },
            { href: "#privacy", label: fr ? "Politique de confidentialité" : "Privacy Policy" },
            { href: "#terms", label: fr ? "Conditions d'utilisation" : "Terms of Service" },
          ].map(({ href, label }) => (
            <a key={label} href={href} style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none" }}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
}
