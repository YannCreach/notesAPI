import { supabaseAdmin } from "../database.js";

/**
 * Notifications push via le service Expo.
 *
 * Pas de clé obligatoire : l'endpoint accepte les envois anonymes tant que les
 * jetons sont des `ExponentPushToken`. `EXPO_ACCESS_TOKEN` reste recommandé — il
 * empêche quiconque connaîtrait un de vos jetons de pousser en votre nom.
 *
 * Tout est en « fire-and-forget » : une notification perdue ne doit jamais faire
 * échouer l'action qui l'a déclenchée. C'est déjà la règle pour les emails.
 */
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const accessToken = process.env.EXPO_ACCESS_TOKEN || null;

async function tokensForUser(userId) {
  const { data, error } = await supabaseAdmin
    .from("push_token")
    .select("token")
    .eq("user_id", userId);
  if (error) {
    console.error("[push] Impossible de lire les jetons:", error.message);
    return [];
  }
  return (data || []).map((row) => row.token).filter(Boolean);
}

/**
 * Expo répond `DeviceNotRegistered` pour une app désinstallée ou un jeton
 * périmé. Le garder reviendrait à retenter indéfiniment : on le supprime.
 */
async function dropTokens(tokens) {
  if (!tokens.length) return;
  const { error } = await supabaseAdmin
    .from("push_token")
    .delete()
    .in("token", tokens);
  if (error) console.error("[push] Purge des jetons morts:", error.message);
}

export async function sendPushToUser(userId, { title, body, data = {} }) {
  const tokens = await tokensForUser(userId);
  if (!tokens.length) return;

  const messages = tokens.map((to) => ({
    to,
    title,
    body,
    data,
    sound: "default",
    channelId: "default",
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      console.error("[push] Expo a répondu", res.status);
      return;
    }
    const json = await res.json();
    const dead = (json?.data || [])
      .map((ticket, i) => (ticket?.details?.error === "DeviceNotRegistered" ? tokens[i] : null))
      .filter(Boolean);
    await dropTokens(dead);
  } catch (e) {
    console.error("[push] Envoi impossible:", e?.message || e);
  }
}

export async function registerPushToken(userId, token, platform) {
  // Le jeton est la clé : s'il change de compte — appareil partagé, ou
  // déconnexion puis reconnexion — la ligne suit le nouveau propriétaire au lieu
  // d'envoyer les notifications de l'un sur l'écran de l'autre.
  const { error } = await supabaseAdmin.from("push_token").upsert(
    {
      token,
      user_id: userId,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );
  if (error) throw new Error(error.message);
}

export async function unregisterPushToken(userId, token) {
  const { error } = await supabaseAdmin
    .from("push_token")
    .delete()
    .eq("token", token)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
