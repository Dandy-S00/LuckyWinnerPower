// Lightweight in-memory fixed-window rate limiter.
//
// NOTE ON SCOPE: Vercel runs many serverless instances, and this counter lives
// in a single instance's memory, so it is a best-effort throttle (it reliably
// stops runaway loops / bursts that hit one warm instance, not a distributed
// guarantee). For strict cross-instance limiting, back this with a shared store
// such as Upstash Redis (free tier) and swap out `hit()` — the call sites do
// not need to change. Note also that signup/login go straight to Supabase from
// the browser (not through our API), so those are rate limited by Supabase Auth
// itself; this limiter protects our own endpoints (e.g. checkout creation).

const WINDOW_MS = 60 * 1000;
const buckets = new Map();
let lastSweep = Date.now();

function sweep(now) {
  // Periodically drop expired buckets so the map can't grow unbounded.
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, entry] of buckets) {
    if (now >= entry.reset) buckets.delete(key);
  }
}

// Returns { allowed, remaining, retryAfter } for the given key.
// `limit` = max requests allowed per WINDOW_MS window.
function hit(key, limit) {
  const now = Date.now();
  sweep(now);

  let entry = buckets.get(key);
  if (!entry || now >= entry.reset) {
    entry = { count: 0, reset: now + WINDOW_MS };
    buckets.set(key, entry);
  }

  entry.count += 1;
  const allowed = entry.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    retryAfter: Math.ceil((entry.reset - now) / 1000),
  };
}

// Best-effort client IP extraction from common proxy headers.
function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    return xff.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

// Convenience: enforce a limit and write a 429 if exceeded.
// Returns true if the request should proceed, false if it was rejected.
function enforce(req, res, key, limit) {
  const result = hit(key, limit);
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfter));
    res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    return false;
  }
  return true;
}

module.exports = { hit, clientIp, enforce };
