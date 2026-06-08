/**
 * Clerk Frontend API Proxy Middleware
 *
 * Proxies Clerk Frontend API requests through your domain, enabling Clerk
 * authentication on custom domains and .replit.app deployments without
 * requiring CNAME DNS configuration.
 *
 * AUTH CONFIGURATION: To manage users, enable/disable login providers
 * (Google, GitHub, etc.), change app branding, or configure OAuth credentials,
 * use the Auth pane in the workspace toolbar. There is no external Clerk
 * dashboard — all auth configuration is done through the Auth pane.
 *
 * IMPORTANT:
 * - Must be mounted BEFORE express.json() middleware
 *
 * Usage in app.ts:
 *   import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost, buildProxyUrl } from "./middlewares/clerkProxyMiddleware";
 *   app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
 */

import { createProxyMiddleware } from "http-proxy-middleware";
import type { RequestHandler } from "express";
import type { IncomingHttpHeaders } from "http";

const CLERK_FAPI = "https://frontend-api.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";

/**
 * Returns the first effective public hostname for the given request,
 * preferring x-forwarded-host over the Host header so callers behind a
 * proxy see the original client-facing host.
 *
 * x-forwarded-host can take three shapes:
 *   - undefined (no proxy involved)
 *   - a single string (one proxy hop)
 *   - a comma-delimited string when an upstream appended rather than
 *     replaced the header (Node folds duplicate headers this way), or a
 *     string[] in some Express typings
 * In the multi-value case, the leftmost value is the original client-
 * facing host. Take that one in all forms. Exported so that app.ts
 * (clerkMiddleware callback) and this proxy middleware agree on which
 * hostname is canonical — otherwise multi-domain/custom-domain flows
 * break.
 */
export function getClerkProxyHost(req: {
  headers: IncomingHttpHeaders;
}): string | undefined {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const firstHop = raw?.split(",")[0]?.trim();
  return firstHop || req.headers.host?.trim() || undefined;
}

/**
 * Returns the Clerk proxy URL to use for this environment.
 *
 * Production: derived from the request host (supports custom domains).
 * Dev: derived from APP_DOMAIN env var (the production app domain), so
 *   the registered Clerk proxy URL is sent to FAPI even in dev.
 * Falls back to undefined when neither can be determined.
 */
function getEffectiveProxyUrl(req: {
  headers: IncomingHttpHeaders;
}): string | undefined {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = getClerkProxyHost(req) || "";
    return host ? `${protocol}://${host}${CLERK_PROXY_PATH}` : undefined;
  }

  // Dev: use APP_DOMAIN if set (production app domain registered with Clerk)
  const appDomain = process.env.APP_DOMAIN;
  if (appDomain) return `https://${appDomain}${CLERK_PROXY_PATH}`;

  return undefined;
}

/**
 * Returns the Clerk proxy URL to configure `clerkMiddleware` with for JWT
 * verification. Must match the `Clerk-Proxy-Url` header sent by the proxy
 * middleware — Clerk uses this to verify the JWT `iss` claim.
 *
 * Production: derived from REPLIT_DOMAINS (the registered production domain).
 * Dev: derived from APP_DOMAIN env var (same production domain).
 * Returns undefined when no proxy URL can be determined.
 */
export function buildProxyUrl(): string | undefined {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey || secretKey.startsWith("sk_test_")) return undefined;

  const domains = process.env.REPLIT_DOMAINS;
  const primary = domains?.split(",")[0]?.trim();

  // Replit sandbox/dev domains are not registered with Clerk — use APP_DOMAIN instead.
  const isReplitSandbox =
    !primary ||
    primary.endsWith(".worf.replit.dev") ||
    primary.endsWith(".repl.co");

  if (!isReplitSandbox) return `https://${primary}${CLERK_PROXY_PATH}`;

  // Dev: proxy headers are intentionally omitted (dev secret key ≠ production proxy URL),
  // so FAPI returns 501 without a proxy URL. No proxyUrl needed for JWT verification.
  return undefined;
}

export function clerkProxyMiddleware(): RequestHandler {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return (_req, _res, next) => next();
  }

  const isProduction = process.env.NODE_ENV === "production";

  // In dev with test keys (sk_test_), Clerk connects to its own dev FAPI
  // directly — no proxy needed. Only proxy for live keys.
  if (!isProduction && secretKey.startsWith("sk_test_")) {
    return (_req, _res, next) => next();
  }

  const fapiProxy = createProxyMiddleware({
    target: CLERK_FAPI,
    changeOrigin: true,
    pathRewrite: (path: string) =>
      path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq, req) => {
        // In production: send proxy headers so FAPI can identify the instance.
        // In dev: the dev secret key doesn't match the production proxy URL,
        //   so we deliberately omit proxy headers. FAPI returns 501 which Clerk
        //   handles gracefully (degrades to "not signed in" state). This is
        //   intentional — dev auth works on the published app only.
        if (isProduction) {
          const proxyUrl = getEffectiveProxyUrl(req);
          if (proxyUrl) {
            proxyReq.setHeader("Clerk-Proxy-Url", proxyUrl);
          }
          proxyReq.setHeader("Clerk-Secret-Key", secretKey);
        }

        const xff = req.headers["x-forwarded-for"];
        const clientIp =
          (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim() ||
          req.socket?.remoteAddress ||
          "";
        if (clientIp) {
          proxyReq.setHeader("X-Forwarded-For", clientIp);
        }
      },
    },
  }) as RequestHandler;

  return async (req, res, next) => {
    // npm CDN paths: frontend-api.clerk.dev redirects to the npm CDN.
    // In the Replit dev sandbox the browser can't follow those redirects
    // due to SSL issues on the Clerk FAPI host, so we follow server-side.
    if (!isProduction && req.path.startsWith("/npm/")) {
      const cdnPath = req.path.replace(/^\/npm/, "");
      const fapiUrl = `${CLERK_FAPI}/npm${cdnPath}`;
      try {
        const r = await fetch(fapiUrl, { redirect: "follow" });
        if (r.ok) {
          res.setHeader(
            "Content-Type",
            r.headers.get("content-type") || "application/javascript",
          );
          res.setHeader("Cache-Control", "public, max-age=86400");
          const buf = await r.arrayBuffer();
          return res.send(Buffer.from(buf));
        }
      } catch {
        // Fall through to FAPI proxy on fetch error
      }
    }

    fapiProxy(req, res, next);
  };
}
