import express from "express";
import { auth } from "express-oauth2-jwt-bearer";
import router from "./app/router.js";
import { notFound, errorHandler } from "./app/middleware/errorHandler.js";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";

const app = express();

dotenv.config();

const serverPort = process.env.SERVER_PORT;

const jwtCheck = auth({
  audience: process.env.AUTH_AUDIENCE || "https://www.yanncrea.ch/notesAPI",
  issuerBaseURL:
    process.env.AUTH_ISSUER_BASE_URL ||
    "https://dev-n0lb4ireiqf83cv2.eu.auth0.com/",
  tokenSigningAlg: "RS256",
});

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

app.use(jwtCheck);

app.get("/authorized", function (req, res) {
  res.send("Secured Resource");
});

app.use(router);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

app.listen(serverPort);

console.log("Running on port ", serverPort);
