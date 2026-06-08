import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost, buildProxyUrl } from "./middlewares/clerkProxyMiddleware";
import { WebhookHandlers } from "./webhookHandlers";
import { handleStripeWebhook } from "./routes/stripe-webhook-handler";
import { handleDueWebhook } from "./routes/due";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Stripe webhooks MUST be registered before express.json() ─────────────────

// stripe-replit-sync auto-sync webhook
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

// Explicit subscription management webhook
app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// ── Due webhook — raw body MUST be parsed before express.json() ───────────────
app.post("/api/due/webhook", express.raw({ type: "application/json" }), handleDueWebhook);

// ─────────────────────────────────────────────────────────────────────────────

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Resolve the publishable key from the incoming request host so the same
// server can serve multiple Clerk custom domains. Falls back to
// CLERK_PUBLISHABLE_KEY (or VITE_CLERK_PUBLISHABLE_KEY if the integration
// sets it under that name) when the host doesn't map to a custom domain.
// proxyUrl tells clerkMiddleware which JWT `iss` to expect (the proxy URL).
// In production: derived from REPLIT_DOMAINS. In dev: derived from APP_DOMAIN.
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY,
    ),
    proxyUrl: buildProxyUrl(),
  })),
);

app.use("/api", router);

export default app;
