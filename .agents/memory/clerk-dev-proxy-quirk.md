---
name: Clerk dev proxy quirk
description: Why the Clerk spinner appeared in dev and how the proxy middleware is structured to fix it.
---

## Rule
This project has live Clerk keys (`pk_live_`/`sk_live_`) in the dev environment. The live FAPI host (`clerk.login.mobilemoneymanager.africa`) has SSL issues from the Replit preview browser, so Clerk JS can't load without a proxy. The canonical "no proxy in dev" approach causes a blank spinner.

## How it works now

`clerkProxyMiddleware.ts` is active in **both** dev and production (not production-only):

- **npm CDN paths** (`/npm/*`): always served via server-side `fetch()` with redirect-following, so Clerk JS loads even if the browser can't reach the CDN.
- **FAPI calls** (everything else):
  - In **production**: proxy headers `Clerk-Proxy-Url` + `Clerk-Secret-Key` are added → FAPI returns 200.
  - In **dev**: proxy headers are **intentionally omitted** — the dev secret key doesn't match the production proxy URL (`mobilemoneymanager.africa/api/__clerk`), so sending it causes a 401. Without headers, FAPI returns 501, which Clerk handles gracefully (degrades to "not signed in"). Auth only works on the published app.

`vite.config.ts` sets `VITE_CLERK_PROXY_URL` to the REPLIT_DEV_DOMAIN fallback in dev so the Clerk SDK routes through the proxy server for loading Clerk JS.

`buildProxyUrl()` returns `undefined` in dev (REPLIT_DOMAINS is a sandbox domain and no proxy headers are sent), so `clerkMiddleware` doesn't expect a proxy URL in JWTs.

`HomeRedirect` in `App.tsx` uses `useAuth()` with an `isLoaded` check instead of Clerk's `<Show>` component, so the landing page renders immediately instead of a blank screen while Clerk initializes.

**Why:**
The dev secret key is a test/different key from the live production key registered for `mobilemoneymanager.africa/api/__clerk`. Sending it with the production proxy URL causes 401 (hard error, blank page). Omitting proxy headers gives 501 (Clerk degrades gracefully, landing page shows).
