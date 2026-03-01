import express from "express";
import router from "./app/router.js";
import { notFound, errorHandler } from "./app/middleware/errorHandler.js";
import { checkSupabaseJwt } from "./app/middleware/checkSupabaseJwt.js";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";

const app = express();

dotenv.config();

const serverPort = process.env.SERVER_PORT;

// Security headers
app.use(helmet());

// CORS: restreindre en prod via ALLOWED_ORIGINS="https://app.com,https://studio.supabase.co"
const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const corsOptions =
  allowed.length === 0
    ? { origin: "*" }
    : {
        origin: (origin, callback) => {
          if (!origin || allowed.includes(origin)) return callback(null, true);
          return callback(new Error("Not allowed by CORS"));
        },
        optionsSuccessStatus: 200,
      };
app.use(cors(corsOptions));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Public: photo proxy (used as <Image src=...>, no auth header possible)
import placeController from "./app/controllers/placeController.js";
import { validate } from "./app/middleware/validate.js";
import { PlacePhotoQuerySchema } from "./app/validators/places.schemas.js";
app.get("/placephoto", validate(PlacePhotoQuerySchema, "query"), placeController.getPlacePhoto);

app.use(checkSupabaseJwt);

app.use(router);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

app.listen(serverPort);

console.log("Running on port ", serverPort);
