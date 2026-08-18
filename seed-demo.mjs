/**
 * Alimente un compte en données de démonstration : catégories, lieux avec
 * photo, mementos avec photo.
 *
 * Écrit dans Supabase avec la clé service_role et pousse les photos sur S3 en
 * respectant les conventions de notesAPI (préfixes de clé, forme des URL) : le
 * moteur de synchro les redescend ensuite dans l'app comme des lignes normales.
 *
 * Idempotent : relancé, il ne recrée pas ce qui existe déjà (repéré par le
 * `googleid` du lieu).
 */
import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const ROOT = "C:/Users/akni_/NOTES/notesAPI";
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, ".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const EMAIL = process.argv[2];
const DRY = process.argv.includes("--dry");
if (!EMAIL) throw new Error("usage: node seed-demo.mjs <email> [--dry]");

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});
const S3_BASE = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/`;
const GOOGLE = env.GOOGLE_API_KEY;

// Rennes : la ville où l'app est testée, donc des lieux qui tombent dans le
// cadrage initial de la carte.
const CITY = "Rennes";
const RENNES = { lat: 48.1113, lng: -1.68 };

/**
 * Deux jeux distincts. Le carnet d'un ami doit être *autre* : mêmes lieux des
 * deux côtés donnerait des pins superposés et une démonstration qui ne montre
 * rien. Les catégories diffèrent aussi — c'est ce qui prouve que les pins d'un
 * ami portent l'icône de *sa* catégorie, et non d'une des nôtres.
 */
const SEEDS_FRIEND = [
  {
    category: "Pizzeria",
    icon: "pizza-slice",
    query: "pizzeria Rennes",
    rating: 4,
    favorite: true,
    notes: [
      { name: "Margherita", price: "11,00", rating: 4, comment: "Pâte fine, bien cuite au feu de bois. Service rapide le midi." },
    ],
  },
  {
    category: "Bar",
    icon: "beer-mug-empty",
    query: "bar à vins Rennes",
    rating: 5,
    notes: [
      { name: "Verre de chinon", price: "5,50", rating: 5, favorite: true, comment: "Belle carte au verre, la patronne conseille très bien." },
      { name: "Planche de fromages", price: "14,00", rating: 4, comment: "À partager à deux, largement." },
    ],
  },
  {
    category: "Restaurant",
    icon: "utensils",
    query: "restaurant japonais Rennes",
    rating: 4,
    notes: [
      { name: "Chirashi saumon", price: "16,50", rating: 4, comment: "Poisson très frais. Salle petite, réserver." },
    ],
  },
  {
    category: "Salon de thé",
    icon: "mug-hot",
    query: "salon de thé Rennes",
    rating: 5,
    favorite: true,
    notes: [
      { name: "Earl grey et scone", price: "7,80", rating: 5, comment: "Le scone arrive tiède avec de la crème épaisse." },
    ],
  },
  {
    category: "Burger",
    icon: "burger",
    query: "burger Rennes",
    rating: 4,
    notes: [
      { name: "Burger du mois", price: "15,00", rating: 4, favorite: true, comment: "Frites maison. Bruyant le soir." },
    ],
  },
];

const SEEDS_MAIN = [
  {
    category: "Restaurant",
    icon: "utensils",
    query: "crêperie Rennes centre",
    rating: 5,
    favorite: true,
    notes: [
      { name: "Galette complète", price: "9,50", rating: 5, favorite: true, comment: "La pâte est fine et bien croustillante. Demander un cidre brut avec." },
      { name: "Far breton", price: "5,00", rating: 4, comment: "Servi tiède, pas trop sucré." },
    ],
  },
  {
    category: "Restaurant",
    icon: "utensils",
    query: "restaurant Rennes",
    rating: 4,
    notes: [
      { name: "Galette Saint-Georges", price: "14,00", rating: 4, comment: "Copieuse. Réserver le soir, ça se remplit vite." },
    ],
  },
  {
    category: "Bar",
    icon: "beer-mug-empty",
    query: "bar Rennes",
    rating: 4,
    notes: [
      { name: "Pinte de blonde locale", price: "6,50", rating: 4, favorite: true, comment: "Terrasse au calme dès qu'il fait beau." },
    ],
  },
  {
    category: "Café",
    icon: "mug-hot",
    query: "café Rennes",
    rating: 5,
    favorite: true,
    notes: [
      { name: "Filtre Éthiopie", price: "4,20", rating: 5, comment: "Notes de fruits rouges très nettes. Ils vendent les grains." },
      { name: "Cookie noisette", price: "3,00", rating: 4, comment: "Encore tiède le matin." },
    ],
  },
  {
    category: "Boulangerie",
    icon: "bread-slice",
    query: "boulangerie Rennes",
    rating: 4,
    notes: [
      { name: "Kouign-amann", price: "2,80", rating: 5, favorite: true, comment: "Le vrai, bien caramélisé. Épuisé après 11 h." },
    ],
  },
  {
    category: "Hôtel",
    icon: "bed",
    query: "hôtel Rennes centre",
    rating: 4,
    notes: [
      { name: "Chambre double", price: "110,00", rating: 4, comment: "Petite mais impeccable, et à deux pas du centre." },
    ],
  },
];

const SEEDS = process.argv.includes("--set=friend") ? SEEDS_FRIEND : SEEDS_MAIN;

const log = (...a) => console.log(...a);

async function findUser(email) {
  // Pas de filtre par email dans l'API admin : on pagine et on compare.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = (data.users || []).find(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase(),
    );
    if (hit) return hit;
    if ((data.users || []).length < 200) break;
  }
  throw new Error(`Compte introuvable : ${email}`);
}

/**
 * Jeton d'accès du compte, sans mot de passe.
 *
 * La clé Google est restreinte par IP : elle n'accepte que le déploiement
 * Vercel. On passe donc par les proxys de notesAPI, qui exigent un Bearer.
 * `generateLink` fabrique un jeton à usage unique sans envoyer d'e-mail, que
 * l'on échange contre une session.
 */
async function accessTokenFor(email) {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error) throw new Error(`generateLink: ${error.message}`);
  const tokenHash = data?.properties?.hashed_token;
  if (!tokenHash) throw new Error("generateLink n'a pas renvoyé de jeton");

  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const verified = await anon.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (verified.error) throw new Error(`verifyOtp: ${verified.error.message}`);
  const token = verified.data?.session?.access_token;
  if (!token) throw new Error("aucune session obtenue");
  return token;
}

let API_TOKEN = null;
const API = env.API_BASE_URL || "https://notes-api-pied.vercel.app";

async function api(pathAndQuery, init = {}) {
  const res = await fetch(`${API}${pathAndQuery}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${pathAndQuery} → ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function googleFindPlace(query) {
  // Autocomplete puis Details : le seul chemin qu'autorise la cle de notesAPI
  // (Text Search n'y est pas activee), et celui que l'app emprunte deja.
  // `types=establishment` : sans lui, Google remonte d'abord les rues et les
  // places. On veut des commerces. Le biais lat/lng recentre sur Rennes.
  const predictions = await api(
    `/googleautocomplete?location=${encodeURIComponent(query)}` +
      `&types=establishment&lat=${RENNES.lat}&lng=${RENNES.lng}`,
  );
  const first = (predictions || [])[0];
  if (!first) throw new Error(`Aucune suggestion pour « ${query} »`);

  const r = await api(`/getplacedetails?place_id=${encodeURIComponent(first.place_id)}`);
  if (!r) throw new Error(`Details indisponibles pour ${first.place_id}`);
  return {
    googleid: r.place_id,
    name: r.name,
    address: r.formatted_address || r.vicinity || null,
    latitude: r.geometry?.location?.lat ?? null,
    longitude: r.geometry?.location?.lng ?? null,
    photoRef: r.photos?.[0]?.photo_reference || null,
  };
}

/**
 * Photo Google → S3, via `/uploadplacephoto` : c'est notesAPI qui va chercher
 * l'image chez Google (sa clé, son IP autorisée) et la pousse sur le bucket,
 * exactement comme quand l'app enregistre un lieu.
 */
async function uploadPhoto(photoRef, placeId, maxwidth = 800) {
  if (!photoRef || !placeId) return null;
  if (DRY) return `${S3_BASE}place-photos/<simulation>.jpg`;
  try {
    const out = await api("/uploadplacephoto", {
      method: "POST",
      body: JSON.stringify({ photo_reference: photoRef, place_id: placeId, maxwidth }),
    });
    return out?.url || null;
  } catch (e) {
    console.log(`      (photo indisponible : ${e.message})`);
    return null;
  }
}

function slugify(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureCategory(userId, label, icon, orderIndex) {
  const { data: existing } = await supabase
    .from("category")
    .select("id")
    .eq("user_id", userId)
    .eq("label", label)
    .maybeSingle();
  if (existing) return existing.id;
  if (DRY) return -1;
  const { data, error } = await supabase
    .from("category")
    .insert({
      user_id: userId,
      label,
      icon,
      order_index: orderIndex,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`category ${label}: ${error.message}`);
  return data.id;
}

async function main() {
  const user = await findUser(EMAIL);
  API_TOKEN = await accessTokenFor(EMAIL);
  log(`Compte : ${user.email} (${user.id})${DRY ? "  [SIMULATION]" : ""}`);

  const before = await supabase
    .from("place")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  log(`Lieux déjà présents : ${before.count ?? "?"}`);

  const categories = new Map();
  let order = 0;
  for (const seed of SEEDS) {
    if (!categories.has(seed.category)) {
      const id = await ensureCategory(user.id, seed.category, seed.icon, order++);
      categories.set(seed.category, id);
      log(`  catégorie ${seed.category} → ${id}`);
    }
  }

  for (const seed of SEEDS) {
    const g = await googleFindPlace(seed.query);

    const { data: dup } = await supabase
      .from("place")
      .select("id")
      .eq("user_id", user.id)
      .eq("googleid", g.googleid)
      .maybeSingle();
    if (dup) {
      log(`  = ${g.name} — déjà présent, ignoré`);
      continue;
    }

    const cover = await uploadPhoto(g.photoRef, g.googleid);
    const row = {
      user_id: user.id,
      name: g.name,
      slug: slugify(g.name),
      address: g.address,
      city: CITY,
      latitude: g.latitude,
      longitude: g.longitude,
      cover,
      rating: seed.rating ?? null,
      favorite: !!seed.favorite,
      googleid: g.googleid,
      category_id: categories.get(seed.category),
      updated_at: new Date().toISOString(),
    };

    if (DRY) {
      log(`  + ${g.name} (${seed.notes.length} mementos) — simulation`);
      continue;
    }

    const { data: place, error } = await supabase
      .from("place")
      .insert(row)
      .select("id")
      .single();
    if (error) {
      log(`  ! ${g.name} : ${error.message}`);
      continue;
    }
    log(`  + ${g.name} → place ${place.id}${cover ? " (photo)" : ""}`);

    for (const n of seed.notes) {
      const noteCover = await uploadPhoto(g.photoRef, g.googleid, 600);
      const { error: noteErr } = await supabase.from("note").insert({
        place_id: place.id,
        user_id: user.id,
        name: n.name,
        price: n.price ?? null,
        rating: n.rating ?? null,
        favorite: !!n.favorite,
        comment: n.comment ?? null,
        cover: noteCover,
        updated_at: new Date().toISOString(),
      });
      log(noteErr ? `      ! ${n.name} : ${noteErr.message}` : `      · ${n.name}`);
    }
  }

  const after = await supabase
    .from("place")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  log(`Lieux après : ${after.count ?? "?"}`);
}

main().catch((e) => {
  console.error("ÉCHEC :", e.message);
  process.exit(1);
});
