# NotesAPI — Frontend Contract

This document is intended for frontend agents/engineers consuming the NotesAPI. It lists all endpoints, required auth, params, request bodies, and response shapes.

## Base

- Base URL: `http://localhost:<SERVER_PORT>` where `SERVER_PORT` is defined in `.env`.
- Auth: All routes require `Authorization: Bearer <JWT>` (Auth0), **except** `GET /health`.
- CORS: configure via `ALLOWED_ORIGINS` in `.env`.
- IDs must be passed via **route params** or **query**, not headers.

## Health

- `GET /health`
  - Auth: none
  - Response `200`: `{ status: "ok" }`

## Places

- `GET /places`
  - Query (pagination):
    - `page` number (default `1`)
    - `limit` number (default `20`, max `100`)
    - `sort` `"created_at" | "updated_at"` (default `"created_at"`)
    - `order` `"asc" | "desc"` (default `"desc"`)
  - Response `200`:
    - `{ places: Array<PlaceWithCount>, meta: { page, limit, total, totalPages } }`

- `GET /place/:id`
  - Params:
    - `id` string
  - Optional query:
    - `include=google,yelp` to include Google and/or Yelp details
    - `include=none` (or empty) to skip external API calls
  - Response `200`: `Place` (object, possibly enriched with `google`, `yelp`, and `google_cover`)
  - Response `404`: `{ message: "Place not found" }`

- `POST /place`
  - Body:
    - `{ name, slug, category_id, latitude, longitude, rating?, address?, cover?, comment?, favorite?, googleid?, yelpid?, tags?: [{ label }] }`
  - Response `201`:
    - `{ place: Place, tags?: Array<Tag> }`

- `PATCH /place/:id`
  - Body:
    - `{ favorite: boolean }`
  - Response `200`:
    - `{ place: Place }`
  - Response `404`: `{ message: "Place not found" }`

- `DELETE /place/:id`
  - Response `200`: `{ message: "Place deleted" }`
  - Response `404`: `{ message: "Place not found" }`

- `GET /latestplaces`
  - Query:
    - `limit` number (default `9`, max `50`)
  - Response `200`:
    - `{ places: Array<Place> }`

- `GET /categories/:categorylabel/latestplaces`
  - Params:
    - `categorylabel` string
  - Query:
    - `limit` number (default `9`, max `50`)
  - Response `200`:
    - `{ places: Array<Place> }`

- `GET /searchcoords`
  - Query:
    - `lat` number
    - `lng` number
  - Response `200`: Yelp API response (raw)

- `GET /placefromapi`
  - Query:
    - `place_id` string
  - Response `200`: Google Place Details (formatted subset)

## Categories & Tags

- `GET /categories`
  - Response `200`:
    - `{ categories: Array<Category> }`

- `GET /categories/:categorylabel`
  - Params:
    - `categorylabel` string
  - Response `200`:
    - `{ category: Category }`

- `GET /categories/:categorylabel/places`
  - Params:
    - `categorylabel` string
  - Query (pagination):
    - `page`, `limit`, `sort`, `order` (same as `/places`)
  - Response `200`:
    - `{ places: Array<PlaceWithCount>, meta: { page, limit, total, totalPages } }`

- `GET /categories/:categorylabel/tags`
  - Params:
    - `categorylabel` string
  - Response `200`:
    - `{ tags: Array<Tag> }`

## Autocomplete & Details

- `GET /googleautocomplete`
  - Query:
    - `location` string (required)
    - `lat` number (optional)
    - `lng` number (optional)
    - `types` string (optional)
  - Response `200`: Array of `{ main_text, secondary_text, place_id, main_text_matched_substrings }`

- `GET /yelpautocomplete`
  - Query:
    - `location` string (required)
    - `lat` number (optional)
    - `lng` number (optional)
    - `types` string (optional)
  - Response `200`: Same shape as `/googleautocomplete` (proxy to Google autocomplete)

- `GET /existingautocomplete`
  - Query:
    - `location` string
  - Response `200`:
    - `{ existingPlaces: Array<Place> }`

- `GET /getplacedetails`
  - Query:
    - `place_id` string
  - Response `200`: Google Place Details (raw)

## Notes

- `GET /places/:id/notes`
  - Params:
    - `id` string
  - Query (pagination):
    - `page`, `limit`, `sort`, `order` (same as `/places`)
  - Response `200`:
    - `{ notes: Array<Note>, meta: { page, limit, total, totalPages } }`

- `GET /notes/:id`
  - Params:
    - `id` string
  - Response `200`:
    - `{ note: Note }`
  - Response `404`:
    - `{ message: "Note not found" }`

- `PATCH /notes/:id`
  - Body:
    - `{ favorite: boolean }`
  - Response `200`:
    - `{ note: Note }`
  - Response `404`:
    - `{ message: "Note not found" }`

- `GET /notes/:id/tags`
  - Response `200`:
    - `{ tags: Array<Tag> }`

- `POST /notes/:id/tags`
  - Body:
    - `{ tags: [{ label }] }`
  - Response `200`:
    - `{ tags: Array<Tag> }`

- `DELETE /notes/:id/tags`
  - Body:
    - `{ tags: [{ label }] }`
  - Response `200`:
    - `{ removed: number }`

## Error Format

- Standard error envelope:
  - `{ error: { code: string, message: string, details?: any, stack?: string } }`
- Typical codes:
  - `validation_error` (400)
  - `unauthorized` (401)
  - `forbidden` (403)
  - `not_found` (404)
  - `conflict` (409)
  - `internal_error` (500)

## Types (indicative)

```ts
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
  rating?: number;
  address?: string;
  cover?: string;
  comment?: string;
  favorite?: boolean;
  googleid?: string | null;
  yelpid?: string | null;
  created_at?: string;
  updated_at?: string | null;
  google?: any;
  yelp?: any;
  google_cover?: string;
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
```
