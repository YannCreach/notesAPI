# NotesAPI — Frontend Contract

Ce document décrit le contrat entre le frontend mobile et l'API NotesAPI.

## Architecture

Le frontend mobile communique avec **deux backends** :

1. **Supabase (direct)** — Toutes les opérations CRUD : places, notes, catégories, user preferences, tags.
2. **NotesAPI (proxy)** — Recherche externe (Google Places) qui nécessite des clés API serveur.

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
  - Response `200`: `Array<{ main_text, secondary_text, place_id, main_text_matched_substrings, location }>`
  - `location`: `{ lat: number, lng: number } | null` — coordonnées obtenues via Place Details

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

### Place Photo (Google proxy)

- `GET /placephoto`
  - Auth: **none** (public, usable as `<Image src=...>`)
  - Query:
    - `photo_reference` string (required) — from `photos[].photo_reference` in `/placefromapi` response
    - `maxwidth` number (optional, default 800)
  - Response `200`: image binary (streamed), `Content-Type` set by Google (e.g. `image/jpeg`)
  - Cache: `Cache-Control: public, max-age=86400` (24h)

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
  category_id: number | null;    // resolved from user's categories, null if no match
  user_ratings_total: number;
  website: string;
  photos: Array<{ photo_reference: string; height: number; width: number; html_attributions: string[] }>;
}
```

### Upload Place Photo (Google → S3)

- `POST /uploadplacephoto`
  - Body (JSON):
    - `photo_reference` string (required) — from `photos[].photo_reference`
    - `maxwidth` number (optional, default 800)
  - Response `200`: `{ url: string }` — permanent public S3 URL
  - Downloads the Google photo server-side and stores it in AWS S3
  - Filename: `{uuid}_{userId}.{ext}`

### Upload Place Cover (file → S3)

- `POST /uploadplacecover`
  - Body: `multipart/form-data`
    - `photo` file (required) — image file, max 10 Mo
  - Response `200`: `{ url: string }` — permanent public S3 URL (dossier `place-covers/`)
  - Filename: `{uuid}_{userId}.{ext}`

### Upload Memento Photo (file → S3)

- `POST /uploadmementophoto`
  - Body: `multipart/form-data`
    - `photo` file (required) — image file, max 10 Mo
  - Response `200`: `{ url: string }` — permanent public S3 URL (dossier `memento-photos/`)
  - Filename: `{uuid}_{userId}.{ext}`

### Change Category (batch)

- `PATCH /changecat`
  - Query:
    - `oldCatId` number (required)
    - `newCatId` number (required)
  - Response `200`: `{ updated: number }` — nombre de places mises à jour
  - Réattribue toutes les places de l'utilisateur ayant `oldCatId` vers `newCatId`

### Delete Memento

- `DELETE /deletememento`
  - Query:
    - `id` number (required) — ID du memento
  - Response `200`: `{ deleted: true }`
  - Response `404`: `{ error: "Memento not found" }`
  - Supprime le memento en DB et sa cover sur S3

### Delete Place (avec mementos)

- `DELETE /deleteplace`
  - Query:
    - `id` number (required) — ID de la place
  - Response `200`: `{ deleted: true }`
  - Response `404`: `{ error: "Place not found" }`
  - Supprime les covers des mementos et de la place sur S3, puis supprime les mementos et la place en DB

### Delete Resource (S3)

- `DELETE /deleteresource`
  - Query:
    - `url` string (required) — URL complète S3 de la ressource
  - Response `200`: `{ deleted: true }`
  - Response `400`: `{ error: "Invalid resource URL" }`
  - Response `403`: `{ error: "Forbidden" }` — si le `userId` dans le nom de fichier ne correspond pas au JWT
  - Supprime une ressource S3 avec vérification d'ownership via le nom de fichier (`{uuid}_{userId}.{ext}`)

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
