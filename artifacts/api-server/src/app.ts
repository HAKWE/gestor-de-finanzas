import express, { type Express } from "express";
import type { IncomingMessage, ServerResponse } from "http";
import cors from "cors";
import type { Options as PinoHttpOptions, HttpLogger } from "pino-http";
import { pinoHttp as _pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, buildProxyUrl } from "./middlewares/clerkProxyMiddleware";
import { WebhookHandlers } from "./webhookHandlers";
import { handleStripeWebhook } from "./routes/stripe-webhook-handler";
import { handleDueWebhook } from "./routes/due";
import router from "./routes";
import { logger } from "./lib/logger";

// pino-http ships CJS but its type file uses ES export syntax; some TypeScript
// resolvers (e.g. Vercel's default moduleResolution) see the whole module
// namespace instead of the callable export. This cast is safe at runtime.
const pinoHttp = _pinoHttp as unknown as (opts?: PinoHttpOptions) => HttpLogger;

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
      req(req: IncomingMessage & { id?: unknown }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: ServerResponse) {
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

// proxyUrl tells clerkMiddleware which JWT `iss` to expect (the registered proxy URL).
// In production: derived from REPLIT_DOMAINS. In dev: undefined (no proxy headers sent).
const resolvedProxyUrl = buildProxyUrl();
logger.info({ resolvedProxyUrl }, "Clerk middleware config");

app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY,
    proxyUrl: resolvedProxyUrl,
  }),
);

// Temporary auth debug — logs token presence and Clerk auth result for every /api request.
app.use("/api", (req: any, _res: any, next: any) => {
  const auth = getAuth(req);
  req.log?.info({
    hasAuthHeader: !!req.headers.authorization,
    hasCookie: !!(req.cookies as Record<string, unknown>)?.__session,
    userId: auth?.userId ?? null,
    proxyUrl: resolvedProxyUrl ?? null,
  }, "auth-debug");
  next();
});

app.use("/api", router);

export default app;
