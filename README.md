# NotesAPI

API Express servant de proxy vers les services externes (Google Places) qui nécessitent des clés API serveur. Toutes les opérations CRUD (places, notes, catégories, user preferences) sont gérées directement par le frontend mobile via Supabase.

## Architecture

```
Mobile App ──► Supabase (CRUD direct, RLS protège les données)
Mobile App ──► NotesAPI  (proxy Google, clés API côté serveur)
```

## Supabase

- Connexion via `SUPABASE_URL` + clé (`SUPABASE_ANON_KEY`).
- Les scripts SQL `db/create_db.sql` et `db/seed_db.sql` s'exécutent via Supabase Studio ou `psql`.

### Pré-requis

- Créer un projet sur <https://console.supabase.com> et récupérer:
  - `Project ref` (ex: `abcd1234`)
  - `SUPABASE_URL`: `https://<PROJECT_REF>.supabase.co`
  - `SUPABASE_ANON_KEY` (publishable)

### Configuration

Variables d'environnement (voir `.env.example`):

```env
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_ANON_KEY=...
# Requis pour les opérations admin (lookup users, social) — bypasse le RLS
SUPABASE_SERVICE_ROLE_KEY=...

# APIs externes (proxy)
GOOGLE_API_KEY=...

# Stockage photos (S3)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-3
S3_BUCKET=notesapi-photos

# Emails transactionnels (feature social)
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Serveur
NODE_ENV=development
SERVER_PORT=3001

# Sécurité / réseaux — ALLOWED_ORIGINS est REQUIS en production
ALLOWED_ORIGINS=https://app.example.com,https://studio.supabase.co
HTTP_CLIENT_TIMEOUT_MS=5000
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY`, `AWS_*` et `RESEND_API_KEY` sont des secrets serveur — ne jamais les exposer au client ni les committer (`.env` est gitignoré). En production, l'API **refuse de démarrer** si `ALLOWED_ORIGINS` est absent (pas de fallback CORS `*`).

### Initialisation de la base sur Supabase

Option A — Éditeur SQL Supabase (Studio):

- Ouvrir Studio → SQL → exécuter `db/create_db.sql` puis `db/seed_db.sql`.

Option B — via `psql`:

```bash
psql "postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require" -f ./db/create_db.sql
psql "postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require" -f ./db/seed_db.sql
```

`create_db.sql` contient le cœur : tables, contraintes, indexes et politiques RLS. Exécuter ensuite, dans l'ordre, les migrations complémentaires :

```bash
psql "$SUPABASE_DB_URL" -f ./db/social_tables.sql          # tables & RLS de la feature social
psql "$SUPABASE_DB_URL" -f ./db/security_rpcs.sql          # RPC lookup users (REQUIS pour /addfriend et /friends)
psql "$SUPABASE_DB_URL" -f ./db/rls_fix_tag_visibility.sql # RLS scopé sur place_has_tag / note_has_tag
psql "$SUPABASE_DB_URL" -f ./db/place_add_quickcom.sql     # colonne quickcom (bases deja en service)
```

> Sans `security_rpcs.sql`, les endpoints `/addfriend` et `/friends` échouent (RPC absente).

### Lancer l'API

```bash
npm install
npm run dev
```

### Tests

```bash
npm test
npm run test:watch
```

---

## API (Proxy endpoints)

Toutes les routes nécessitent un JWT Supabase valide, sauf `GET /health` et `GET /placephoto` (public).

> **Rate limiting** actif sur toutes les routes (réponse `429 rate_limited`) : global 300/15 min, `/placephoto` 30/min, proxys Google 60/min, `/addfriend` 20/h. Voir `app/middleware/rateLimiters.js`.
>
> Les endpoints de la **feature social** (`/addfriend`, `/friends`, `/friendrequests`, `/acceptfriend`, `/declinefriend`, `/removefriend`, `/friendplaces`, `/friendnotes`) sont documentés dans `SOCIAL_API_CONTRACT.md`.

### Health

- `GET /health` — pas d'auth
  - Response `200`: `{ status: "ok" }`

### Google Autocomplete

- `GET /googleautocomplete?location=...&lat=...&lng=...&types=...`
  - Proxy vers Google Places Autocomplete
  - Response `200`: `Array<{ main_text, secondary_text, place_id, main_text_matched_substrings, location }>`

### Existing Autocomplete

- `GET /existingautocomplete?location=...`
  - Recherche dans les lieux existants de l'utilisateur (DB)
  - Response `200`: `{ existingPlaces: Array<Place> }`

### Place Details

- `GET /getplacedetails?place_id=...`
  - Proxy vers Google Place Details (raw)

### Place Photo

- `GET /placephoto?photo_reference=...&maxwidth=800`
  - Proxy vers Google Place Photo (stream image)

### Place from API

- `GET /placefromapi?place_id=...`
  - Google Place Details + lookup catégorie utilisateur
  - Response `200`: `{ name, current_opening_hours, formatted_address, formatted_phone_number, geometry, place_id, price_level, rating, types, category_id, user_ratings_total, website, photos }`

### Upload Place Photo (Google → S3)

- `POST /uploadplacephoto`
  - Body: `{ photo_reference, maxwidth? }`
  - Télécharge la photo Google et la stocke dans S3
  - Response `200`: `{ url: "https://<bucket>.s3.<region>.amazonaws.com/place-photos/<uuid>_<userId>.jpg" }`

### Upload Place Cover (file → S3)

- `POST /uploadplacecover`
  - Body: `multipart/form-data` avec champ `photo` (max 10 Mo)
  - Response `200`: `{ url }` — URL S3 dans `place-covers/`

### Upload Memento Photo (file → S3)

- `POST /uploadmementophoto`
  - Body: `multipart/form-data` avec champ `photo` (max 10 Mo)
  - Response `200`: `{ url }` — URL S3 dans `memento-photos/`

### Change Category (batch)

- `PATCH /changecat?oldCatId=...&newCatId=...`
  - Réattribue toutes les places de `oldCatId` vers `newCatId`
  - Response `200`: `{ updated: number }`

### Delete Memento

- `DELETE /deletememento?id=...`
  - Supprime le memento (DB + cover S3)
  - Response `200`: `{ deleted: true }`

### Delete Place

- `DELETE /deleteplace?id=...`
  - Supprime la place, ses mementos (DB) et toutes les covers (S3)
  - Response `200`: `{ deleted: true }`

### Delete Resource (S3)

- `DELETE /deleteresource?url=...`
  - Supprime une ressource S3 (vérification ownership via userId dans le nom de fichier)
  - Response `200`: `{ deleted: true }`

### Exemples curl

```bash
# Healthcheck (pas d'auth)
curl http://localhost:3000/health

# Google autocomplete
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:3000/googleautocomplete?location=pizza&lat=48.8&lng=2.3"

# Recherche dans les lieux existants
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:3000/existingautocomplete?location=aziza"

# Détails Google d'un lieu
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:3000/getplacedetails?place_id=ChIJ..."

# Place depuis Google avec catégorie
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:3000/placefromapi?place_id=ChIJ..."
```

---

## RLS (Row Level Security)

Les tables activent RLS avec Supabase Auth (`auth.uid()::text`):

- `category`, `place`, `note`, `user_preferences`: politiques owner-based (SELECT/INSERT/UPDATE/DELETE per-user).
- `place_tag`, `note_tag`: lecture et insertion libres — dictionnaires de libellés partagés (aucune donnée utilisateur).
- `place_has_tag`, `note_has_tag`: **lecture ET écriture scopées au propriétaire** de l'entité parente (le SELECT libre a été retiré, voir `db/rls_fix_tag_visibility.sql`).
- Lookups d'utilisateurs (feature social) via les RPC `get_user_id_by_email` / `get_users_by_ids`, exécutables **uniquement par le `service_role`** (voir `db/security_rpcs.sql`).

⚠️ **Modèle de sécurité de l'API** : les contrôleurs utilisent le client `service_role` qui **contourne le RLS**. La protection repose sur les filtres manuels `.eq("user_id", …)` dans les modèles. Le RLS ci-dessus protège l'accès **direct** du client mobile à Supabase.

Toutes les politiques sont définies dans `db/create_db.sql` (+ migrations `social_tables.sql`, `rls_fix_tag_visibility.sql`).

---

## Erreurs

Format standard (middleware `errorHandler`):

```json
{ "error": { "code": "string", "message": "string", "details": "any" } }
```

Codes: `validation_error` (400), `unauthorized` (401), `forbidden` (403), `not_found` (404), `internal_error` (500).
