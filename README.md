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

Toutes les routes nécessitent un JWT valide (Auth0). Les paramètres passent par route params et/ou query; les headers ne sont plus utilisés pour passer des identifiants fonctionnels.

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
