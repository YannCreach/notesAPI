# CLAUDE.md — notesAPI

Backend Express (ESM) pour l'app **Note To Myself**. Fait proxy/relais entre l'app mobile et : **Supabase** (DB + Auth), **Google Places**, **AWS S3** (photos) et **Resend** (emails). Déployé sur Vercel (`notes-api-pied.vercel.app`).

## Commandes

```bash
npm run dev          # nodemon index.js (dev local, port SERVER_PORT)
npm test             # vitest run (tests/unit/**)
npm run test:watch   # vitest watch
npm run createDB     # psql $SUPABASE_DB_URL -f ./db/create_db.sql
npm run seedDB       # psql $SUPABASE_DB_URL -f ./db/seed_db.sql
```

Pas de script `lint` (config eslint airbnb présente mais non branchée). Node ESM (`"type": "module"`) — utiliser `import`, extensions `.js` obligatoires dans les imports.

## Architecture

```
index.js                     → bootstrap : helmet, CORS, rate-limit global, /health,
                               /placephoto (public), puis checkSupabaseJwt sur tout le reste
app/router.js                → toutes les routes authentifiées (places, uploads, social)
app/middleware/
  checkSupabaseJwt.js         → auth : valide le Bearer via supabase.auth.getUser(token)
  rateLimiters.js             → limiteurs (global, photo, addFriend, googleProxy)
  validate.js                 → validation Zod (query/body/params)
  errorHandler.js             → ApiError + notFound + errorHandler centralisé
app/controllers/              → placeController, socialController (old/ = code mort, ignorer)
app/models/                   → place, category, social (accès Supabase)
app/database.js               → clients Supabase (voir Modèle de sécurité)
app/s3.js                     → client S3
app/services/email.js         → Resend + templates/ (escapeHtml.js pour l'anti-injection)
app/validators/               → schémas Zod
db/                           → SQL (schéma + RLS + RPC). À exécuter manuellement sur Supabase.
src/                          → legacy partiel (messages, check-jwt) — peu utilisé
```

Flux d'une requête authentifiée : `helmet → cors → globalLimiter → express.json → checkSupabaseJwt (pose req.auth) → [limiteur route] → validate(zod) → controller → model → Supabase`.

`req.auth = { token, payload: { sub, email }, user }`. **Toujours** scoper les accès data par `req.auth.payload.sub`.

## ⚠️ Modèle de sécurité — À COMPRENDRE avant toute modif data

Les modèles utilisent **`supabaseAdmin` (service_role) qui CONTOURNE le RLS** ([app/database.js](app/database.js)). La sécurité repose donc **entièrement sur les filtres manuels** `.eq("user_id", userId)` dans chaque requête modèle.

**Règle absolue** : toute requête sur `place`, `note`, `category` DOIT filtrer par `user_id`. Une requête sans ce filtre = fuite/altération cross-tenant totale. Il n'y a pas de filet RLS côté API.

(À l'inverse, l'app mobile accède à Supabase avec la clé `anon` + RLS actif — voir `db/create_db.sql`. Les deux chemins doivent rester corrects.)

Autres invariants :
- `/addfriend` renvoie **toujours 200** (ne jamais révéler l'existence d'un compte). Rate-limité (anti-spam email).
- Lookups d'utilisateurs via les RPC `get_user_id_by_email` / `get_users_by_ids` (service_role only), **jamais** `admin.listUsers()` (charge toute la table, cassé >50 users).
- Toute donnée utilisateur interpolée dans du HTML d'email doit passer par `escapeHtml()` ([app/templates/escapeHtml.js](app/templates/escapeHtml.js)).
- Les clés Google/AWS/Resend restent **serveur only** (jamais renvoyées au client).
- CORS : refuse de démarrer en prod si `ALLOWED_ORIGINS` absent (pas de fallback `*`).
- Rate limiting global + par route sensible dans `app/middleware/rateLimiters.js`.
- Pas de `console.log` de données utilisateur / réponses d'API tierces (fuite dans les logs).

## Base de données

Le schéma évolue par **migrations versionnées Supabase** dans `supabase/migrations/`
(CLI `npx supabase`, table `schema_migrations` sur la base). **Workflow complet :
[MIGRATIONS.md](MIGRATIONS.md).**

- Nouvelle évolution : `npx supabase migration new <nom>` → éditer → `db push`.
- Additif de préférence (jamais de `DROP`/`RENAME` direct — expand-contract).
- **Couplage** : tout champ ajouté ici doit l'être aussi côté SQLite local
  (`notesMobile/src/db/migrations.js`), sinon `syncLocalToRemote` casse.
- `db/*.sql` = artefacts historiques consolidés dans la baseline (voir `db/README.md`) ;
  ne plus les rejouer sur la prod (`create_db.sql` contient des `DROP`).

## Variables d'environnement

Voir [.env.example](.env.example). Secrets serveur : `SUPABASE_SERVICE_ROLE_KEY`, `AWS_*`, `GOOGLE_API_KEY`, `RESEND_API_KEY`. `.env` est gitignoré — ne jamais le committer.

## Conventions

- Contrôleurs = classes avec méthodes `static async (req, res, next)`, erreurs via `return next(error)` ou `throw new ApiError(...)`.
- Validation : ajouter un schéma Zod dans `app/validators/` + middleware `validate(Schema, "query"|"body")` dans la route.
- Clés S3 : format `{dossier}/{uuid}_{userId}.{ext}` (le `_userId` sert au contrôle de propriété dans `deleteResource`).
