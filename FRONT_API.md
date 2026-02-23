# NotesAPI — Frontend Contract

Ce document décrit le contrat entre le frontend mobile et l'API NotesAPI.

## Architecture

Le frontend mobile communique avec **deux backends** :

1. **Supabase (direct)** — Toutes les opérations CRUD : places, notes, catégories, user preferences, tags.
2. **NotesAPI (proxy)** — Recherche externe (Google Places, Yelp) qui nécessite des clés API serveur.

## Base

- Base URL: `http://localhost:<SERVER_PORT>` where `SERVER_PORT` is defined in `.env`.
- Auth: All routes (except `/health`) require `Authorization: Bearer <JWT Supabase>`.
- CORS: configure via `ALLOWED_ORIGINS` in `.env`.

## Health

- `GET /health`
  - Auth: none
  - Response `200`: `{ status: "ok" }`

## Autocomplete & Details (Proxy)

### Google Autocomplete

- `GET /googleautocomplete`
  - Query:
    - `location` string (required)
    - `lat` number (optional)
    - `lng` number (optional)
    - `types` string (optional)
  - Response `200`: `Array<{ main_text, secondary_text, place_id, main_text_matched_substrings }>`

### Yelp Autocomplete

- `GET /yelpautocomplete`
  - Query: same as `/googleautocomplete`
  - Response `200`: same shape (proxy to Google autocomplete)

### Existing Autocomplete (DB)

- `GET /existingautocomplete`
  - Query:
    - `location` string (required)
  - Response `200`:
    - `{ existingPlaces: Array<Place> }`
  - Searches user's existing places in DB (name/address ILIKE match)

### Place Details (Google raw)

- `GET /getplacedetails`
  - Query:
    - `place_id` string (required)
  - Response `200`: Google Place Details result (raw)

### Search by Coords (Yelp raw)

- `GET /searchcoords`
  - Query:
    - `lat` number (required)
    - `lng` number (required)
  - Response `200`: Yelp Business Search response (raw)

### Place from API (Google + category lookup)

- `GET /placefromapi`
  - Query:
    - `place_id` string (required)
  - Response `200`: formatted Google Place Details with `category_id` resolved from user's categories

```ts
{
  name: string;
  current_opening_hours: object;
  formatted_address: string;
  formatted_phone_number: string;
  geometry: object;
  place_id: string;
  price_level: number;
  rating: number;
  types: string[];
  category_id: number;          // resolved from user's categories
  user_ratings_total: number;
  website: string;
  google_cover: string;
}
```

## Error Format

Standard error envelope:

```json
{ "error": { "code": "string", "message": "string", "details": "any" } }
```

Codes: `validation_error` (400), `unauthorized` (401), `forbidden` (403), `not_found` (404), `internal_error` (500).

## CRUD (via Supabase direct)

Toutes les opérations CRUD sont gérées directement par le frontend via le client Supabase (`@supabase/supabase-js`). Les RLS policies protègent les données par utilisateur.

Tables concernées : `category`, `place`, `note`, `place_tag`, `note_tag`, `place_has_tag`, `note_has_tag`, `user_preferences`.

Voir `BDD_API.md` pour la structure complète des tables et `db/create_db.sql` pour les policies RLS.
