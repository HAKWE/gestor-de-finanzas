import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ClerkProvider } from "@clerk/react";
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.error(
    "❌ Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables",
  );
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider
    publishableKey={publishableKey}
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
    afterSignInUrl="/dashboard"
    afterSignUpUrl="/dashboard"
  >
    <App />
  </ClerkProvider>,
);
