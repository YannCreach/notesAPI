# Structure de la base locale (SQLite)

Ce document décrit le schéma actuel de la base SQLite locale et les liaisons entre tables.

## Tables

### `category`

- `id` INTEGER PK
- `user_id` TEXT NOT NULL DEFAULT 'local'
- `label` TEXT
- `label_fr` TEXT
- `label_en` TEXT
- `icon` TEXT
- `order_index` INTEGER NOT NULL DEFAULT 0
- `created_at` TEXT
- `updated_at` TEXT
- Uniques :
  - `(user_id, label)`
  - `(user_id, label_fr)`
  - `(user_id, label_en)`

### `place_tag`

- `id` INTEGER PK
- `label` TEXT UNIQUE
- `created_at` TEXT
- `updated_at` TEXT

### `note_tag`

- `id` INTEGER PK
- `label` TEXT UNIQUE
- `created_at` TEXT
- `updated_at` TEXT

### `place`

- `id` INTEGER PK
- `user_id` TEXT NOT NULL
- `name` TEXT NOT NULL
- `address` TEXT
- `city` TEXT
- `latitude` REAL
- `longitude` REAL
- `cover` TEXT
- `rating` INTEGER CHECK (0–5)
- `favorite` INTEGER NOT NULL DEFAULT 0
- `comment` TEXT
- `slug` TEXT
- `googleid` TEXT
- `yelpid` TEXT
- `category_id` INTEGER NOT NULL → FK `category.id` ON DELETE RESTRICT
- `created_at` TEXT
- `updated_at` TEXT
- Uniques :
  - `(user_id, slug)`
  - `(user_id, googleid)`
  - `(user_id, yelpid)`

### `note` (memento)

- `id` INTEGER PK
- `place_id` INTEGER → FK `place.id` ON DELETE CASCADE
- `user_id` TEXT NOT NULL
- `name` TEXT NOT NULL
- `option` TEXT
- `price` TEXT
- `cover` TEXT
- `rating` REAL CHECK (0–5)
- `favorite` INTEGER NOT NULL DEFAULT 0
- `comment` TEXT
- `created_at` TEXT
- `updated_at` TEXT

### `place_has_tag`

- `id` INTEGER PK
- `place_id` INTEGER NOT NULL
- `tag_id` INTEGER NOT NULL (référence `place_tag.id`)
- `created_at` TEXT
- `updated_at` TEXT
- Unique `(place_id, tag_id)`

### `note_has_tag`

- `id` INTEGER PK
- `note_id` INTEGER NOT NULL
- `tag_id` INTEGER NOT NULL (référence `note_tag.id`)
- `created_at` TEXT
- `updated_at` TEXT
- Unique `(note_id, tag_id)`

### `user_preferences`

- `user_id` TEXT PK
- `theme` TEXT NOT NULL DEFAULT "light"
- `currency` TEXT NOT NULL DEFAULT "EUR"
- `display_bullet_points` INTEGER NOT NULL DEFAULT 1
- `created_at` TEXT
- `updated_at` TEXT

### `items` (compat demo)

- `id` INTEGER PK
- `type` TEXT NOT NULL
- `payload` TEXT NOT NULL
- `created_at` TEXT

### `migrations`

- `name` TEXT PK
- `applied_at` TEXT

## Liaisons (relations)

- `place.category_id` → `category.id`
  - `category` 1 — N `place`
  - `ON DELETE RESTRICT`

- `note.place_id` → `place.id`
  - `place` 1 — N `note`
  - `ON DELETE CASCADE`

- `place_has_tag.place_id` → `place.id`
- `place_has_tag.tag_id` → `place_tag.id`
  - `place` N — N `place_tag` via `place_has_tag`
  - `ON DELETE CASCADE`

- `note_has_tag.note_id` → `note.id`
- `note_has_tag.tag_id` → `note_tag.id`
  - `note` N — N `note_tag` via `note_has_tag`
  - `ON DELETE CASCADE`

## Indexes principaux

- `place_user_slug_key` (unique)
- `place_user_googleid_key` (unique)
- `place_user_yelpid_key` (unique)
- `pht_place_tag_unique` (unique)
- `nht_note_tag_unique` (unique)
- `idx_place_user`
- `idx_place_category`
- `idx_place_slug`
- `idx_place_googleid`
- `idx_place_yelpid`
- `idx_note_place`
- `idx_note_user`
- `idx_pht_place`
- `idx_pht_tag`
- `idx_place_tag_label`
- `idx_note_tag_label`
- `idx_category_user`

## Notes

- Le terme "memento" correspond à la table `note`.
- `user_preferences` est indexé par `user_id` (clé primaire), aligné sur l'API.
- Les catégories sont **par utilisateur** (`user_id`). En mode guest/local, `user_id` vaut `'local'`.
