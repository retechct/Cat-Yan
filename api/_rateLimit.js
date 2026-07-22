const loginAttempts = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;

function getClientKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || 'unknown';
  return `login:${ip}`;
}

function prune(now) {
  for (const [key, entry] of loginAttempts.entries()) {
    if (entry.resetAt <= now && (!entry.lockUntil || entry.lockUntil <= now)) {
      loginAttempts.delete(key);
    }
  }
}

function getLoginLimit(req) {
  const now = Date.now();
  prune(now);

  const entry = loginAttempts.get(getClientKey(req));
  if (!entry || !entry.lockUntil || entry.lockUntil <= now) {
    return { limited: false, retryAfter: 0 };
  }

  return {
    limited: true,
    retryAfter: Math.ceil((entry.lockUntil - now) / 1000),
  };
}

function recordFailedLogin(req) {
  const now = Date.now();
  const key = getClientKey(req);
  const entry = loginAttempts.get(key);
  const next = entry && entry.resetAt > now
    ? entry
    : { count: 0, resetAt: now + WINDOW_MS, lockUntil: 0 };

  next.count += 1;
  if (next.count >= MAX_ATTEMPTS) {
    next.lockUntil = now + LOCK_MS;
    next.resetAt = next.lockUntil;
  }

  loginAttempts.set(key, next);
}

function clearFailedLogins(req) {
  loginAttempts.delete(getClientKey(req));
}

module.exports = {
  clearFailedLogins,
  getLoginLimit,
  recordFailedLogin,
};
