import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { LayoutDashboard, Crown, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#f97316","#4ade80","#60a5fa","#facc15","#c084fc","#f472b6","#34d399","#fb923c","#a78bfa"];
    type P = { x:number; y:number; r:number; vx:number; vy:number; color:string; rotation:number; rotV:number };
    const particles: P[] = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: -30 - Math.random() * canvas.height * 0.8,
      r: Math.random() * 8 + 3,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.18,
    }));

    let rafId: number;
    const start = Date.now();

    function draw() {
      const elapsed = Date.now() - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alpha = Math.max(0, 1 - Math.max(0, elapsed - 4000) / 2000);

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.rotation += p.rotV;
        if (p.y > canvas.height + 20) { p.y = -10; p.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9, 2);
        ctx.fill();
        ctx.restore();
      }

      if (elapsed < 6000) rafId = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: 9999,
    }} />
  );
}

export default function Success() {
  const [sub, setSub] = useState<{ plan: string; planLabel: string } | null>(null);

  useEffect(() => {
    fetch(`${basePath}/api/stripe/subscription-status`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.plan !== "free") setSub(d); })
      .catch(() => {});
  }, []);

  const isPro = sub?.plan === "pro";

  return (
    <div style={{
      minHeight: "100vh", background: "hsl(var(--background))",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <ConfettiCanvas />

      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>

        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{
            width: 96, height: 96, borderRadius: 28,
            background: "linear-gradient(135deg, #052e16, #15803d)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(21,128,61,0.35)",
          }}>
            <CheckCircle2 style={{ width: 48, height: 48, color: "#4ade80" }} />
          </div>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 10px" }}>
          Félicitations&nbsp;! 🎉
        </h1>
        <p style={{ fontSize: 16, color: "hsl(var(--muted-foreground))", margin: "0 0 28px", lineHeight: 1.6 }}>
          Votre abonnement est maintenant actif. Vous pouvez profiter de toutes vos fonctionnalités.
        </p>

        {/* Plan badge */}
        {sub && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            borderRadius: 20,
            background: isPro
              ? "linear-gradient(135deg,#431407,#9a3412)"
              : "linear-gradient(135deg,#431407,#c2410c)",
            padding: "14px 24px", marginBottom: 28,
            boxShadow: "0 4px 20px rgba(249,115,22,0.25)",
          }}>
            {isPro
              ? <Crown style={{ width: 20, height: 20, color: "#fed7aa" }} />
              : <Star style={{ width: 20, height: 20, color: "#fed7aa" }} />
            }
            <span style={{ color: "#fff7ed", fontWeight: 700, fontSize: 15 }}>
              Plan <span style={{ color: "#fdba74" }}>{sub.planLabel}</span> actif
            </span>
          </div>
        )}

        {/* What's included */}
        <div style={{
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--border))",
          borderRadius: 16, padding: "20px 22px",
          marginBottom: 24, textAlign: "left",
        }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 12px", color: "hsl(var(--foreground))" }}>
            Ce qui vous attend :
          </p>
          {[
            "Accès complet à toutes les fonctionnalités",
            "Transactions et rapports illimités",
            "Import SMS et relevés bancaires",
            "Support prioritaire",
          ].map((item) => (
            <div key={item} style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 999, flexShrink: 0,
                background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: "#16a34a", fontSize: 11, fontWeight: 800 }}>✓</span>
              </div>
              <span style={{ fontSize: 14, color: "hsl(var(--foreground))" }}>{item}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/dashboard">
          <Button style={{
            width: "100%", height: 50, borderRadius: 14,
            fontSize: 15, fontWeight: 700,
          }}>
            <LayoutDashboard style={{ width: 17, height: 17, marginRight: 8 }} />
            Accéder au tableau de bord
          </Button>
        </Link>

        <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 16 }}>
          Un reçu a été envoyé à votre adresse e-mail.
        </p>
      </div>
    </div>
  );
}
