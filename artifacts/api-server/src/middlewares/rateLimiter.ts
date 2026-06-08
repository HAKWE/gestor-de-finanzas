import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter for the payout endpoint.
 * 5 requests per minute per IP — generous for a human admin,
 * tight enough to block scripted abuse.
 */
export const payoutRateLimiter = rateLimit({
  windowMs: 60 * 1_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many payout requests. Please wait a minute and try again.",
    code: "rate_limited",
  },
});

/**
 * Light rate limiter for read-only Due endpoints (account info, transfer status).
 * 30 requests per minute per IP.
 */
export const dueReadRateLimiter = rateLimit({
  windowMs: 60 * 1_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down.",
    code: "rate_limited",
  },
});
