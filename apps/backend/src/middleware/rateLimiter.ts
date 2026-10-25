import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Generous limit for local/demo environment
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production', // Unblock local testing and development
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
  message: {
    success: false,
    error: 'Rate limit exceeded, please slow down',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
