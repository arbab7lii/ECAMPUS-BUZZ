import "dotenv/config";

import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";

import { API_PREFIX } from "@/config/constants";
import { errorHandler } from "@/middleware/errorHandler.middleware";
import { mutationRateLimit } from "@/middleware/rateLimit.middleware";
import { requestLogger } from "@/middleware/requestLogger.middleware";
import { logger } from "@/lib/logger";
import { v1Router } from "@/routes/v1";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 8080;

app.set("trust proxy", 1);

app.use(helmet());
app.use(hpp());
app.use(compression());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

// Rate limit mutation-heavy routes (fine-tuned in module phases)
app.use(API_PREFIX, mutationRateLimit, v1Router);

app.use(errorHandler);

app.listen(port, () => {
  logger.info("API server started", { port, env: process.env.NODE_ENV });
});
