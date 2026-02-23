import { supabase } from "../database.js";

export async function checkSupabaseJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res
        .status(401)
        .json({ error: { code: "unauthorized", message: "Missing bearer token" } });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res
        .status(401)
        .json({ error: { code: "unauthorized", message: "Invalid token" } });
    }

    req.auth = {
      token,
      payload: {
        sub: data.user.id,
        email: data.user.email,
      },
      user: data.user,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

