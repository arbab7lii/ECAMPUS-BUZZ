import rateLimit from "express-rate-limit";

export const mutationRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

