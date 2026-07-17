import express from "express";
import router from "./app/router.js";
import { notFound, errorHandler } from "./app/middleware/errorHandler.js";
import { checkSupabaseJwt } from "./app/middleware/checkSupabaseJwt.js";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { globalLimiter, photoLimiter } from "./app/middleware/rateLimiters.js";

const app = express();

dotenv.config();

const serverPort = process.env.SERVER_PORT;
const isProd = process.env.NODE_ENV === "production";

// Trust the platform proxy (Vercel/…) so rate limiting sees the real client IP.
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// CORS: restreindre en prod via ALLOWED_ORIGINS="https://app.com,https://studio.supabase.co"
const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Fail-safe: never fall back to a wildcard origin in production.
if (allowed.length === 0 && isProd) {
  throw new Error(
    "ALLOWED_ORIGINS must be set in production (refusing to serve with CORS '*')",
  );
}

const corsOptions =
  allowed.length === 0
    ? { origin: "*" }
    : {
        origin: (origin, callback) => {
          if (!origin || allowed.includes(origin)) return callback(null, true);
          // Un refus CORS est une décision de politique, pas une panne : sans
          // statusCode l'errorHandler retomberait sur 500, indiscernable d'un
          // vrai bug dans le monitoring.
          const err = new Error("Not allowed by CORS");
          err.statusCode = 403;
          err.code = "cors_forbidden";
          return callback(err);
        },
        optionsSuccessStatus: 200,
      };
app.use(cors(corsOptions));
app.use(express.json());

// Global rate limiting baseline.
app.use(globalLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Public: photo proxy (used as <Image src=...>, no auth header possible)
import placeController from "./app/controllers/placeController.js";
import { validate } from "./app/middleware/validate.js";
import { PlacePhotoQuerySchema } from "./app/validators/places.schemas.js";
app.get(
  "/placephoto",
  photoLimiter,
  validate(PlacePhotoQuerySchema, "query"),
  placeController.getPlacePhoto,
);

app.use(checkSupabaseJwt);

app.use(router);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

app.listen(serverPort);

console.log("Running on port ", serverPort);
