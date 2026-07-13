import rateLimit from "express-rate-limit";

const json429 = (req, res) =>
  res.status(429).json({
    error: { code: "rate_limited", message: "Too many requests, slow down" },
  });

// Global baseline: protects every endpoint from bulk abuse.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

// Public, unauthenticated Google Places photo proxy — prime target for
// quota/cost draining. Keyed by IP since there is no auth context.
export const photoLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

// Sends transactional emails via Resend — throttle hard to prevent
// email bombing / spam through /addfriend.
export const addFriendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 h
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.payload?.sub || req.ip,
  handler: json429,
});

// Outbound Google API proxies (autocomplete/details) — cost amplification.
export const googleProxyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.payload?.sub || req.ip,
  handler: json429,
});
