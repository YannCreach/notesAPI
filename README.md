# NotesAPI

Backend Express migré vers Supabase (Postgres managé + RLS) et exposant des endpoints REST clairs avec route params et query.

## Migration vers Supabase

- Remplacement de Sequelize par le client Supabase (`@supabase/supabase-js`).
- Connexion via `SUPABASE_URL` + clé (`SUPABASE_SERVICE_ROLE_KEY` recommandée côté serveur, sinon `SUPABASE_ANON_KEY`).
- Les scripts SQL `db/create_db.sql` et `db/seed_db.sql` s'exécutent via Supabase Studio ou `psql`.

### Pré-requis

- Créer un projet sur <https://console.supabase.com> et récupérer:
  - `Project ref` (ex: `abcd1234`)
  - `SUPABASE_URL`: `https://<PROJECT_REF>.supabase.co`
  - `SUPABASE_ANON_KEY` (publishable) et idéalement `SUPABASE_SERVICE_ROLE_KEY` (server-only)

### Configuration

1. Variables d'environnement (voir `.env.example`):

```env
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_ANON_KEY=...
# Optionnel mais recommandé côté serveur
SUPABASE_SERVICE_ROLE_KEY=...

# Auth / APIs externes
AUTH_ISSUER_BASE_URL=...
AUTH_AUDIENCE=...
GOOGLE_API_KEY=...
YELP_API_KEY=...

# Sécurité / réseaux (optionnel)
ALLOWED_ORIGINS=https://app.example.com,https://studio.supabase.co
HTTP_CLIENT_TIMEOUT_MS=5000
```

1. Outils SQL: utiliser l'éditeur SQL de Supabase (Studio). `psql` est optionnel. Aucune dépendance au Supabase CLI.

### Initialisation de la base sur Supabase

Option A — Éditeur SQL Supabase (Studio):

- Ouvrir Studio → SQL → exécuter `db/create_db.sql` puis `db/seed_db.sql`.

Option B — via `psql`:

```bash
psql "postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require" -f ./db/create_db.sql
psql "postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require" -f ./db/seed_db.sql
psql "postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require" -f ./db/rls_update.sql
## Revenir à Supabase Auth (auth.uid())
psql "postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require" -f ./db/rls_revert_to_auth_uid.sql

## Indexation conseillée (performances)
psql "postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require" -f ./db/perf_indexes.sql
```

**Tests**

- Installer les dépendances:

```bash
npm install -D vitest supertest
```

- Lancer les tests:

```bash
npm test
```

- Mode watch:

```bash
npm run test:watch
```

### Migration des contraintes d’unicité (par utilisateur)

Remplace les uniques globaux sur `place.slug/googleid/yelpid` par des contraintes composites `(user_id, slug/googleid/yelpid)`.

```bash
psql "postgresql://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require" -f ./db/constraints.sql
```

Ce script:

- Remplace les `UNIQUE` globaux de `place.slug/googleid/yelpid` par des contraintes composites `(user_id, slug/googleid/yelpid)`
- Déduplique les tables de liaison et ajoute `UNIQUE(place_id, tag_id)` et `UNIQUE(note_id, tag_id)`

### Lancer l’API

```bash
npm install
npm run dev
```

Le serveur lit `SUPABASE_URL` et la clé depuis `.env`.

---

## API

Toutes les routes nécessitent un JWT valide (Auth0), sauf `GET /health`. Les paramètres passent par route params et/ou query; les headers ne sont plus utilisés pour passer des identifiants fonctionnels.

### Health

- GET `/health`

### Places

- GET `/places`
- GET `/place/:id`
- POST `/place`
  - body JSON: `{ name, slug, category_id, latitude, longitude, rating?, address?, cover?, comment?, favorite?, googleid?, yelpid?, tags?: [{ label }] }`
- PATCH `/place/:id`
  - body JSON: `{ favorite: boolean }`
- DELETE `/place/:id`
- GET `/latestplaces`
- GET `/searchcoords?lat=..&lng=..`
- GET `/placefromapi` (lecture par ID externe, params/usage selon contrôleur)

### Catégories / Tags

- GET `/categories`
- GET `/categories/:categorylabel`
- GET `/categories/:categorylabel/places`
- GET `/categories/:categorylabel/latestplaces`
- GET `/categories/:categorylabel/tags`

### Autocomplete / Détails

- GET `/googleautocomplete?location=...&lat=...&lng=...&types=...`
- GET `/yelpautocomplete?location=...&lat=...&lng=...&types=...`
- GET `/existingautocomplete?location=...`
- GET `/getplacedetails?place_id=...`

### Notes

- GET `/places/:id/notes`
- GET `/notes/:id`
- PATCH `/notes/:id`
  - body JSON: `{ favorite: boolean }`
- GET `/notes/:id/tags`
- POST `/notes/:id/tags`
  - body JSON: `{ tags: [{ label }] }`
- DELETE `/notes/:id/tags`
  - body JSON: `{ tags: [{ label }] }`

### Exemples curl

```bash
# Récupérer un lieu
curl -H "Authorization: Bearer <JWT>" \
  http://localhost:3000/place/123

# Créer un lieu
curl -X POST -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"name":"Aziza","slug":"aziza","category_id":2,"latitude":48.73,"longitude":-3.46}' \
  http://localhost:3000/place

# Marquer favori
curl -X PATCH -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"favorite":true}' \
  http://localhost:3000/place/123

# Notes d'un lieu
curl -H "Authorization: Bearer <JWT>" \
  http://localhost:3000/places/123/notes

# Mettre une note en favori
curl -X PATCH -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"favorite":false}' \
  http://localhost:3000/notes/42

# Tags d'une note
curl -H "Authorization: Bearer <JWT>" \
  http://localhost:3000/notes/42/tags

# Ajouter des tags à une note
curl -X POST -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"tags":[{"label":"spicy"},{"label":"vegan"}]}' \
  http://localhost:3000/notes/42/tags

# Supprimer des tags d'une note
curl -X DELETE -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"tags":[{"label":"spicy"}]}' \
  http://localhost:3000/notes/42/tags

# Healthcheck (pas d'auth)
curl http://localhost:3000/health
```

---

## RLS (Row Level Security)

Les tables activent RLS. Si vous restez sur Auth0, alignez les policies sur le `sub` du JWT:

```sql
-- Exemple: accès propriétaire supportant Auth0 (sub) OU Supabase Auth (auth.uid())
USING (user_id = coalesce(auth.jwt()->>'sub', auth.uid()::text))
WITH CHECK (user_id = coalesce(auth.jwt()->>'sub', auth.uid()::text))
```

Si vous migrez vers Supabase Auth: passez `user_id` en UUID et utilisez `auth.uid()`.

- Tables principales: `place`, `note`, `tag`, tables de liaison (`place_has_tag`).
- Politiques: propriétaire = utilisateur (lecture/écriture limitées au propriétaire).

Vous pouvez exécuter vos policies via Studio ou des scripts SQL dédiés.

---

## Sécurité Supabase

- Clés:
  - `SUPABASE_ANON_KEY` (publishable): utilisée par défaut côté serveur pour les opérations standards (lectures) avec RLS actif.
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only): utilisée uniquement pour des opérations sensibles (écritures, maintenance). Ne jamais l’exposer côté client.
- Implémentation:
  - Deux clients sont créés dans `app/database.js`:
    - `supabase`: client RLS (anon).
    - `supabaseAdmin`: client admin (service role) — fallback sur `supabase` si la clé n’est pas fournie.
  - Les modèles emploient `supabase` pour les lectures et `supabaseAdmin` pour les écritures.
- Côté client (front): utilisez la clé publishable et laissez les policies RLS protéger les accès. Les opérations nécessitant des privilèges doivent passer par le backend.

---

## Contrat API (Front)

Ce chapitre formalise les conventions nécessaires pour refactorer le front en cohérence avec l’API.

### Base URL, Auth et CORS

- Base URL: `http://localhost:<SERVER_PORT>` (défini par `SERVER_PORT` dans `.env`).
- Auth: `Authorization: Bearer <JWT>` (JWT Auth0 requis pour toutes les routes).
- Audience/Issuer: voir `AUTH_AUDIENCE` et `AUTH_ISSUER_BASE_URL` dans `.env`.
- CORS: restreignez en prod via `ALLOWED_ORIGINS="https://app.example.com,https://studio.supabase.co"`.

### Conventions de requêtes

- Identifiants fonctionnels passent par route params et/ou query (cf. routes ci-dessus). Les headers ne doivent plus être utilisés à cet effet.
- Pagination commune: `page`, `limit`, `sort` (par défaut `created_at`), `order` (`asc`|`desc`).

### Conventions de réponses

- Pagination:
  - Format: `{ items|places|notes: [...], meta: { page, limit, total, totalPages } }`.
- Ressources usuelles:
  - `GET /places`: `{ places: Array<PlaceWithCount>, meta }`.
  - `GET /categories`: `{ categories: Array<Category> }`.
  - `GET /categories/:label/places`: `{ places: Array<PlaceWithCount>, meta }`.
  - `GET /latestplaces`: `{ places: Array<Place> }`.
  - `GET /place/:id`: `Place` enrichi potentiellement avec `{ google, yelp, google_cover }`.
  - `GET /places/:id/notes`: `{ notes: Array<Note>, meta }`.
  - `GET /notes/:id`: `{ note: Note }`.
  - `PATCH /notes/:id`: `{ note: Note }` (favori mis à jour).
  - `POST /notes/:id/tags`: `{ tags: Array<Tag> }`.
  - `GET /notes/:id/tags`: `{ tags: Array<Tag> }`.
  - `DELETE /notes/:id/tags`: `{ removed: number }`.
  - `POST /place`: `{ place: Place, tags?: Array<Tag> }` (201 créé).
  - `PATCH /place/:id`: `{ place: Place }` (favori mis à jour).
  - `DELETE /place/:id`: `{ message: "Place deleted" }` (200), ou 404 si introuvable.
  - `GET /categories/:categorylabel/tags`: `{ tags: Array<Tag> }`.

### Paramètres optionnels

- `GET /place/:id`:
  - `include=google,yelp` pour inclure les détails Google et/ou Yelp.
  - `include=none` (ou `include=`) pour n'inclure aucun appel externe.

### Modèles (types indicatifs)

Ces structures reflètent les champs manipulés par les contrôleurs/services. Les types peuvent être affinés selon la base.

```ts
type UUIDString = string; // Auth0 sub (string), ou UUID via Supabase Auth

type Category = {
  id: number;
  label: string;
  label_en?: string;
  label_fr?: string;
};

type Tag = {
  id: number;
  label: string;
  category_id?: number;
};

type Place = {
  id: number;
  name: string;
  slug?: string;
  category_id: number;
  latitude: number;
  longitude: number;
  rating?: number; // peut être 0
  address?: string;
  cover?: string;
  comment?: string;
  favorite?: boolean;
  googleid?: string | null;
  yelpid?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

type PlaceWithCount = Place & { notes_count: number };

type Note = {
  id: number;
  place_id: number;
  content?: string;
  favorite?: boolean;
  created_at?: string;
  updated_at?: string | null;
};

type PlaceDetailsGoogle = {
  // Sous-ensemble des champs Google Place Details (voir contrôleur)
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  geometry?: unknown;
  place_id: string;
  price_level?: number;
  rating?: number;
  types?: string[];
  user_ratings_total?: number;
  website?: string;
};
```

### Schémas des corps de requête (extraits)

- `POST /place`:
  - `{ name, slug, category_id, latitude, longitude, rating?, address?, cover?, comment?, favorite?, googleid?, yelpid?, tags?: [{ label }] }`
- `PATCH /place/:id`:
  - `{ favorite: boolean }`
- `PATCH /notes/:id`:
  - `{ favorite: boolean }`
- `POST /notes/:id/tags` | `DELETE /notes/:id/tags`:
  - `{ tags: [{ label }] }`

### Erreurs

- Format standard (middleware `errorHandler`):
  - `{ error: { code: string, message: string, details?: any, stack?: string } }`
  - Codes typiques: `validation_error` (400), `unauthorized` (401), `forbidden` (403), `not_found` (404), `conflict` (409), `internal_error` (500).
- 404 route inconnue: `{ error: { code: "not_found", message: "Route not found" } }`.
- Remarque: certains contrôleurs héritent encore de réponses `{ message: "..." }` pour 404. Le front peut gérer les deux formes le temps d’une harmonisation.

### Bonnes pratiques front

- Centralisez `Authorization` et la gestion des erreurs (standardisez l’affichage à partir de `{ error }`).
- Utilisez systématiquement les params/query (pas de headers pour les identifiants fonctionnels).
- Anticipez l’enrichissement optionnel de `GET /place/:id` avec `google`, `yelp`, et `google_cover`.
- Respectez la pagination et consommez `meta.totalPages` pour la navigation.
- Affichez `notes_count` dans les listes de lieux quand disponible.

### Checklist de refactor front (Copilot)

- Configurer la base URL à partir de l’environnement (`SERVER_PORT` côté API; variable front `VITE_API_URL`/`NEXT_PUBLIC_API_URL`).
- Créer un client HTTP typé (fetch/axios) avec intercepteur `Authorization` et parsing des erreurs `{ error }`.
- Implémenter les pages/lists en consommant `places`/`notes` + `meta`.
- Mettre à jour les formulaires selon les schémas de corps (création lieu, tags, favoris).
- Gérer l’affichage conditionnel des détails Google/Yelp et `google_cover`.
- Vérifier CORS via `ALLOWED_ORIGINS` (adapter l’origine du front).

Si nécessaire, on peut ajouter un fichier OpenAPI minimal (YAML/JSON) pour guider davantage les outils d’IA.
