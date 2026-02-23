import express from "express";
import router from "./app/router.js";
import { notFound, errorHandler } from "./app/middleware/errorHandler.js";
import { validate } from "./app/middleware/validate.js";
import { checkSupabaseJwt } from "./app/middleware/checkSupabaseJwt.js";
import userController from "./app/controllers/userController.js";
import { RegisterBodySchema } from "./app/validators/user.schemas.js";
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

// Public route: register user in Supabase Auth (no JWT required)
app.post("/register", validate(RegisterBodySchema, "body"), userController.register);

app.use(checkSupabaseJwt);

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
