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
 * Routing strategy:
 *   /api/__clerk/npm/* → 302 redirect to FAPI CDN (browser downloads JS directly)
 *   /api/__clerk/*     → proxy to FAPI (auth API calls)
 *
 * Usage in app.ts:
 *   import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
 *   app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
 */

import { createProxyMiddleware } from "http-proxy-middleware";
import type { RequestHandler, Request, Response, NextFunction } from "express";

export const CLERK_PROXY_PATH = "/api/__clerk";

/**
 * Decode the Clerk Frontend API URL from the publishable key.
 * Key format: pk_[test|live]_[base64url(fapi_host + "$")]
 * For dev keys  → main-XXXX.clerk.accounts.dev
 * For live keys → frontend-api.clerk.dev (or custom FAPI)
 */
export function getClerkFAPI(): string {
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

  const fapiProxy = createProxyMiddleware({
    target: clerkFAPI,
    changeOrigin: true,
    pathRewrite: (path: string) =>
      path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq, req) => {
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
      },
    },
  }) as RequestHandler;

  return (req: Request, res: Response, next: NextFunction) => {
    // The request path here is relative to the mount point (Express strips CLERK_PROXY_PATH).
    // npm bundle requests: redirect the browser directly to the FAPI CDN so the
    // browser (not the server) downloads the file. The server cannot reach npm.clerk.dev.
    if (req.path.startsWith("/npm/")) {
      return res.redirect(302, `${clerkFAPI}${req.path}`);
    }
    return fapiProxy(req, res, next);
  };
}
