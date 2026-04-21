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
 *   import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
 *   app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
 *
 * ROUTING RULES:
 *   /api/__clerk/npm/...   → https://npm.clerk.dev/npm/...   (JS bundle CDN)
 *   /api/__clerk/v1/...    → https://<fapi-decoded-from-key>/v1/...  (Auth FAPI)
 */

import { createProxyMiddleware } from "http-proxy-middleware";
import type { RequestHandler } from "express";
import type { IncomingMessage } from "http";

export const CLERK_PROXY_PATH = "/api/__clerk";

/**
 * Decode the Clerk Frontend API URL from the publishable key.
 * Key format: pk_[test|live]_[base64url(fapi_host + "$")]
 * For dev keys  → main-XXXX.clerk.accounts.dev
 * For live keys → frontend-api.clerk.dev (or custom FAPI)
 */
function getClerkFAPI(): string {
  const pubKey = process.env.CLERK_PUBLISHABLE_KEY || "";
  if (!pubKey) return "https://frontend-api.clerk.dev";

  try {
    const b64 = pubKey.replace(/^pk_(test|live)_/, "");
    const standard = b64.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(standard, "base64")
      .toString("utf8")
      .replace(/\$$/, "");
    if (decoded && decoded.includes(".")) {
      return `https://${decoded}`;
    }
  } catch {
    // fall through to default
  }

  return "https://frontend-api.clerk.dev";
}

export function clerkProxyMiddleware(): RequestHandler {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return (_req, _res, next) => next();
  }

  const clerkFAPI = getClerkFAPI();

  return createProxyMiddleware({
    // Dynamic router: /npm/* goes to npm CDN, everything else to FAPI
    router: (req: IncomingMessage) => {
      const url = (req as any).url as string;
      // Strip the proxy path prefix to check the sub-path
      const subPath = url.replace(new RegExp(`^${CLERK_PROXY_PATH}`), "");
      if (subPath.startsWith("/npm/")) {
        return "https://npm.clerk.dev";
      }
      return clerkFAPI;
    },
    changeOrigin: true,
    pathRewrite: (path: string) =>
      path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq, req) => {
        const subPath = (req.url || "").replace(
          new RegExp(`^${CLERK_PROXY_PATH}`),
          ""
        );
        // Only inject Clerk auth headers for FAPI requests, not CDN requests
        if (!subPath.startsWith("/npm/")) {
          const protocol = req.headers["x-forwarded-proto"] || "https";
          const host = req.headers.host || "";
          const proxyUrl = `${protocol}://${host}${CLERK_PROXY_PATH}`;

          proxyReq.setHeader("Clerk-Proxy-Url", proxyUrl);
          proxyReq.setHeader("Clerk-Secret-Key", secretKey);

          const xff = req.headers["x-forwarded-for"];
          const clientIp =
            (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim() ||
            req.socket?.remoteAddress ||
            "";
          if (clientIp) {
            proxyReq.setHeader("X-Forwarded-For", clientIp);
          }
        }
      },
    },
  }) as RequestHandler;
}
