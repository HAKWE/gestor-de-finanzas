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
 *   /api/__clerk/npm/* → stream JS bundle from FAPI (follow redirects, served from our domain)
 *   /api/__clerk/*     → proxy auth API calls to FAPI
 *
 * Usage in app.ts:
 *   import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
 *   app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
 */

import { createProxyMiddleware } from "http-proxy-middleware";
import * as https from "https";
import * as http from "http";
import type { RequestHandler, Request, Response, NextFunction } from "express";

export const CLERK_PROXY_PATH = "/api/__clerk";

// In-memory cache for the Clerk JS bundle (immutable, long-lived CDN asset)
const bundleCache = new Map<string, { body: Buffer; contentType: string }>();

/**
 * Decode the Clerk Frontend API URL from the publishable key.
 * Key format: pk_[test|live]_[base64url(fapi_host + "$")]
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
    // fall through
  }

  return "https://frontend-api.clerk.dev";
}

/**
 * Fetch a URL with manual redirect following (up to maxRedirects hops).
 * Returns the final response body and content-type.
 */
function fetchWithRedirects(
  url: string,
  maxRedirects = 5,
): Promise<{ body: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? https : http;

    lib
      .get(url, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          if (maxRedirects <= 0) {
            return reject(new Error("Too many redirects"));
          }
          // Resolve relative redirects
          const next = new URL(res.headers.location, url).href;
          res.resume();
          return resolve(fetchWithRedirects(next, maxRedirects - 1));
        }

        if (!res.statusCode || res.statusCode >= 400) {
          res.resume();
          return reject(new Error(`Upstream status ${res.statusCode}`));
        }

        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          resolve({
            body: Buffer.concat(chunks),
            contentType:
              res.headers["content-type"] || "application/javascript",
          });
        });
        res.on("error", reject);
      })
      .on("error", reject);
  });
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
    if (req.path.startsWith("/npm/")) {
      // The Clerk JS bundle must be served from our domain (not redirected).
      // If the browser gets a redirect, Clerk detects the origin mismatch and
      // loops. We fetch it server-side (the FAPI IS reachable) and stream it.
      const bundleUrl = `${clerkFAPI}${req.path}`;
      const cached = bundleCache.get(req.path);
      if (cached) {
        res.setHeader("Content-Type", cached.contentType);
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.end(cached.body);
      }

      fetchWithRedirects(bundleUrl)
        .then(({ body, contentType }) => {
          bundleCache.set(req.path, { body, contentType });
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "public, max-age=86400");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(body);
        })
        .catch((err: Error) => {
          console.error("[ClerkProxy] bundle fetch failed:", err.message);
          next(err);
        });
      return;
    }
    return fapiProxy(req, res, next);
  };
}
