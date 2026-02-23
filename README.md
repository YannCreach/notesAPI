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
```

`create_db.sql` contient tout : tables, contraintes, indexes et politiques RLS.

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

### Lancer l’API

```bash
npm install
npm run dev
```

Le serveur lit `SUPABASE_URL` et la clé depuis `.env`.

---

## API

Toutes les routes nécessitent un JWT valide Supabase, sauf `GET /health` et `POST /register`. Les paramètres passent par route params et/ou query; les headers ne sont plus utilisés pour passer des identifiants fonctionnels.

### Health

- GET `/health`

### Places

- GET `/places`
- GET `/place/:id`
- POST `/place`
  - body JSON: `{ name, slug, category_id, latitude, longitude, rating?, address?, city?, cover?, comment?, favorite?, googleid?, yelpid?, tags?: [{ label }] }`
- PATCH `/place/:id`
  - body JSON: `{ favorite: boolean }`
- DELETE `/place/:id`
- GET `/latestplaces`
- GET `/searchcoords?lat=..&lng=..`
- GET `/placefromapi` (lecture par ID externe, params/usage selon contrôleur)

### Catégories (per-user, lazy init)

- GET `/categories`
- POST `/category`
  - body JSON: `{ label, label_fr, label_en, icon? }`
- PATCH `/categories/order`
  - body JSON: `{ order: [{ id, order_index }] }`
- DELETE `/category/:id`
- GET `/categories/:categorylabel`
- GET `/categories/:categorylabel/places`
- GET `/categories/:categorylabel/latestplaces`

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

Les tables activent RLS avec Supabase Auth:

```sql
-- Exemple: accès propriétaire Supabase Auth
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text)
```

Pour une migration complète Supabase Auth: passez `user_id` en UUID et utilisez `auth.uid()`.

- Tables principales: `place`, `note`, `category`, `user_preferences`, tables de liaison (`place_has_tag`, `note_has_tag`).
- `category`: politiques per-user (SELECT/INSERT/UPDATE/DELETE via `user_id = auth.uid()::text`).
- `place_tag`, `note_tag`: lecture libre.
- Toutes les politiques sont définies dans `db/create_db.sql`.

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
- Auth: `Authorization: Bearer <JWT>` (JWT Supabase requis pour toutes les routes privées).
- CORS: restreignez en prod via `ALLOWED_ORIGINS="https://app.example.com,https://studio.supabase.co"`.

### Conventions de requêtes

- Identifiants fonctionnels passent par route params et/ou query (cf. routes ci-dessus). Les headers ne doivent plus être utilisés à cet effet.
- Pagination commune: `page`, `limit`, `sort` (par défaut `created_at`), `order` (`asc`|`desc`).

### Conventions de réponses

- Pagination:
  - Format: `{ items|places|notes: [...], meta: { page, limit, total, totalPages } }`.
- Ressources usuelles:
  - `GET /places`: `{ places: Array<PlaceWithCount>, meta }`.
  - `GET /categories`: `{ categories: Array<Category> }` (lazy init: crée les catégories par défaut si vide).
  - `POST /category`: `{ category: Category }` (201 créé).
  - `PATCH /categories/order`: `{ categories: Array<Category> }`.
  - `DELETE /category/:id`: `{ message: "Category deleted" }` (200), ou 404.
  - `GET /categories/:label/places`: `{ places: Array<PlaceWithCount>, meta }`.
  - `GET /latestplaces`: `{ places: Array<Place> }`.
  - `GET /place/:id`: `Place` enrichi potentiellement avec `{ google, yelp, google_cover }`.
  - `GET /places/:id/notes`: `{ notes: Array<Note>, meta }`.
  - `GET /notes/:id`: `{ note: Note }`.
  - `PATCH /notes/:id`: `{ note: Note }` (favori mis à jour).
  - `POST /notes/:id/tags`: `{ tags: Array<NoteTag> }`.
  - `GET /notes/:id/tags`: `{ tags: Array<NoteTag> }`.
  - `DELETE /notes/:id/tags`: `{ removed: number }`.
  - `POST /place`: `{ place: Place, tags?: Array<PlaceTag> }` (201 créé).
  - `PATCH /place/:id`: `{ place: Place }` (favori mis à jour).
  - `DELETE /place/:id`: `{ message: "Place deleted" }` (200), ou 404 si introuvable.

### Paramètres optionnels

- `GET /place/:id`:
  - `include=google,yelp` pour inclure les détails Google et/ou Yelp.
  - `include=none` (ou `include=`) pour n'inclure aucun appel externe.

### Modèles (types indicatifs)

Ces structures reflètent les champs manipulés par les contrôleurs/services. Les types peuvent être affinés selon la base.

```ts
type UUIDString = string; // UUID Supabase Auth (ou string legacy)

type Category = {
  id: number;
  label: string;
  label_en?: string;
  label_fr?: string;
  icon?: string;
  order_index: number;
};

type PlaceTag = {
  id: number;
  label: string;
};

type NoteTag = {
  id: number;
  label: string;
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
  city?: string;
  cover?: string;
  comment?: string;
  favorite?: boolean;
  googleid?: string | null;
  yelpid?: string | null;
  created_at?: string;
  updated_at?: string | null;
  tags?: Array<PlaceTag>;
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
  - `{ favorite?: boolean, rating?: number }`
    - Détails `rating`: décimal accepté (ex: 3.5), virgule tolérée en entrée (ex: "3,5"), bornes 0..5
- `POST /category`:
  - `{ label, label_fr, label_en, icon? }`
- `PATCH /categories/order`:
  - `{ order: [{ id, order_index }] }`
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
