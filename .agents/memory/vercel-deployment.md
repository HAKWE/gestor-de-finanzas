---
name: Vercel frontend deployment
description: How the money-manager frontend is deployed to Vercel with the API staying on Replit.
---

## Setup

- Vercel project: `gestor-de-finanzas-api-server` (team: MMM-LATAM)
- Custom domain: `gestordefinanzas.app` → 308 → `www.gestordefinanzas.app` (Production)
- Root Directory in Vercel: `artifacts/money-manager`
- Config file: `artifacts/money-manager/vercel.json`

## vercel.json pattern

```json
{
  "framework": null,
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "BASE_PATH=/ pnpm run build",
  "outputDirectory": "dist/public",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

**Why `framework: null`:** Without it Vercel looks for a server entrypoint (`app.js`, `index.js`) and fails with "No entrypoint found".
**Why `cd ../..` in installCommand:** Vercel sets cwd to Root Directory; must go to monorepo root for pnpm workspace install.
**Why `routes` not `rewrites`:** More reliable for SPA fallback with `framework: null`.

## Required Vercel environment variables

| Variable | Notes |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Must be scoped to Production+Preview+Development. Easy to miss — was root cause of blank page ("Missing VITE_CLERK_PUBLISHABLE_KEY" error). |
| `VITE_API_BASE_URL` | `https://mobile-money-manager-latam.replit.app` — points frontend API calls at the Replit-hosted backend. |
| `VITE_CLERK_PROXY_URL` | `https://mobile-money-manager-latam.replit.app/api/__clerk` |

## Clerk proxy fix

`clerkProxyMiddleware.ts` must follow `/npm/` redirects server-side in ALL environments (not just dev). Without this, the browser gets a 307 from the npm CDN which may lack CORS headers for the Vercel origin → blank page.

**Why:** FAPI redirects `/npm/` paths to the npm CDN. The CDN doesn't always have CORS headers for arbitrary domains (e.g. Vercel).
**How to apply:** The `if (req.path.startsWith("/npm/"))` block in the production handler must NOT have a `!isProduction` guard.
