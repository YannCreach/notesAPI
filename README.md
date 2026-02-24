# NotesAPI

API Express servant de proxy vers les services externes (Google Places, Geoapify) qui nécessitent des clés API serveur. Toutes les opérations CRUD (places, notes, catégories, user preferences) sont gérées directement par le frontend mobile via Supabase.

## Architecture

```
Mobile App ──► Supabase (CRUD direct, RLS protège les données)
Mobile App ──► NotesAPI  (proxy Google / Geoapify, clés API côté serveur)
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

# APIs externes (proxy)
GOOGLE_API_KEY=...
GEOAPIFY_API_KEY=...

# Serveur
SERVER_PORT=3000

# Sécurité / réseaux (optionnel)
ALLOWED_ORIGINS=https://app.example.com,https://studio.supabase.co
HTTP_CLIENT_TIMEOUT_MS=5000
```

### Initialisation de la base sur Supabase

Option A — Éditeur SQL Supabase (Studio):

- Ouvrir Studio → SQL → exécuter `db/create_db.sql` puis `db/seed_db.sql`.

Option B — via `psql`:

```bash
psql "postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require" -f ./db/create_db.sql
psql "postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require" -f ./db/seed_db.sql
```

`create_db.sql` contient tout : tables, contraintes, indexes et politiques RLS.

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

Toutes les routes nécessitent un JWT Supabase valide, sauf `GET /health`.

### Health

- `GET /health` — pas d'auth
  - Response `200`: `{ status: "ok" }`

### Google Autocomplete

- `GET /googleautocomplete?location=...&lat=...&lng=...&types=...`
  - Proxy vers Google Places Autocomplete
  - Response `200`: `Array<{ main_text, secondary_text, place_id, main_text_matched_substrings }>`

### Existing Autocomplete

- `GET /existingautocomplete?location=...`
  - Recherche dans les lieux existants de l'utilisateur (DB)
  - Response `200`: `{ existingPlaces: Array<Place> }`

### Place Details

- `GET /getplacedetails?place_id=...`
  - Proxy vers Google Place Details (raw)

### Search by Coords

- `GET /searchcoords?lat=...&lng=...`
  - Proxy vers Geoapify Places (GeoJSON FeatureCollection)

### Place Photo

- `GET /placephoto?photo_reference=...&maxwidth=800`
  - Proxy vers Google Place Photo (stream image)

### Place from API

- `GET /placefromapi?place_id=...`
  - Google Place Details + lookup catégorie utilisateur
  - Response `200`: `{ name, current_opening_hours, formatted_address, formatted_phone_number, geometry, place_id, price_level, rating, types, category_id, user_ratings_total, website, photos }`

### Upload Place Photo (Google → S3)

- `POST /uploadplacephoto`
  - Body: `{ photo_reference, place_id, maxwidth? }`
  - Télécharge la photo Google et la stocke dans S3
  - Response `200`: `{ url: "https://<bucket>.s3.<region>.amazonaws.com/place-photos/<place_id>.jpg" }`

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

# Geoapify Places par coordonnées
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:3000/searchcoords?lat=48.8&lng=2.3"

# Place depuis Google avec catégorie
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:3000/placefromapi?place_id=ChIJ..."
```

---

## RLS (Row Level Security)

Les tables activent RLS avec Supabase Auth (`auth.uid()::text`):

- `category`, `place`, `note`, `user_preferences`: politiques owner-based (SELECT/INSERT/UPDATE/DELETE per-user).
- `place_tag`, `note_tag`: lecture et insertion libres (le frontend crée les tags directement).
- `place_has_tag`, `note_has_tag`: lecture libre, écriture via ownership de l'entité parente.

Toutes les politiques sont définies dans `db/create_db.sql`.

---

## Erreurs

Format standard (middleware `errorHandler`):

```json
{ "error": { "code": "string", "message": "string", "details": "any" } }
```

Codes: `validation_error` (400), `unauthorized` (401), `forbidden` (403), `not_found` (404), `internal_error` (500).
