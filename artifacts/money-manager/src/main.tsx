import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// In the Replit dev sandbox, Clerk JS loads through a local proxy. If the
// proxy is unreachable (e.g. the API server is starting up or the preview is
// accessed from a restricted network), Clerk throws an unhandled promise
// rejection that triggers the HMR error overlay. Swallow that specific error
// so the overlay doesn't appear — the app degrades gracefully to "not signed
// in" and fully works on the published deployment.
window.addEventListener("unhandledrejection", (event) => {
  if (
    typeof event.reason?.message === "string" &&
    event.reason.message.includes("failed_to_load_clerk_js")
  ) {
    event.preventDefault();
  }
});

registerSW({ immediate: true });

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
