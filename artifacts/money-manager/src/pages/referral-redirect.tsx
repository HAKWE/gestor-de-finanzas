import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Loader2 } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ReferralRedirectPage() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (code) {
      localStorage.setItem("referralCode", code.toLowerCase().trim());
    }
    setLocation(`${basePath}/sign-up`);
  }, [code, setLocation]);

  return (
    <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", background: "#fafaf9" }}>
      <div style={{ textAlign: "center" }}>
        <Loader2 style={{ width: 32, height: 32, color: "#f97316", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, color: "#6b7280" }}>Redirection…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
