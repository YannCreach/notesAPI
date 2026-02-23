import dotenv from "dotenv";

dotenv.config();

const serverPort = process.env.SERVER_PORT;
const clientOriginUrl = process.env.CLIENT_ORIGIN_URL;
const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error(".env is missing the definition of a SUPABASE_URL variable");
}

if (!serverPort) {
  throw new Error(
    ".env is missing the definition of a API_PORT environmental variable",
  );
}

if (!clientOriginUrl) {
  throw new Error(
    ".env is missing the definition of a APP_ORIGIN environmental variable",
  );
}

const clientOrigins = ["http://localhost:3000"];

export { supabaseUrl, serverPort, clientOriginUrl, clientOrigins };
