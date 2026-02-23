# NotesAPI — Structure BDD

Ce document décrit la structure de la base de données, les tables, champs principaux, contraintes et relations.

Le frontend mobile interagit directement avec Supabase pour toutes les opérations CRUD. Les RLS policies protègent les données par utilisateur.

## Vue d’ensemble

- `category` 1—N `place`
- `place` 1—N `note`
- `place` N—N `place_tag` via `place_has_tag`
- `note` N—N `note_tag` via `note_has_tag`
- `user_preferences` 1—1 avec `user_id` (Supabase Auth)

## Tables

### `category`

- `id` SERIAL PRIMARY KEY
- `user_id` TEXT NOT NULL (Supabase `auth.uid()`)
- `label` VARCHAR(255)
- `label_fr` VARCHAR(255)
- `label_en` VARCHAR(255)
- `icon` VARCHAR(50)
- `order_index` INTEGER NOT NULL DEFAULT 0
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ

Contraintes:

- Unicités par utilisateur :
  - `UNIQUE (user_id, label)`
  - `UNIQUE (user_id, label_fr)`
  - `UNIQUE (user_id, label_en)`

Relations:

- 1 catégorie possède plusieurs `place` (`place.category_id`)
- Chaque utilisateur possède ses propres catégories (gérées directement via Supabase)

### `place`

- `id` SERIAL PRIMARY KEY
- `user_id` VARCHAR(255) NOT NULL (Supabase `auth.uid()`)
- `name` VARCHAR(255) NOT NULL
- `address` VARCHAR(255)
- `city` VARCHAR(255)
- `latitude` DOUBLE PRECISION
- `longitude` DOUBLE PRECISION
- `cover` VARCHAR(255)
- `rating` INTEGER
- `favorite` BOOLEAN NOT NULL DEFAULT FALSE
- `comment` TEXT
- `slug` VARCHAR(255)
- `googleid` VARCHAR(50)
- `yelpid` VARCHAR(50)
- `category_id` INTEGER NOT NULL REFERENCES `category`(`id`) ON DELETE RESTRICT
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ

Contraintes:

- Unicités par utilisateur :
  - `UNIQUE (user_id, slug)`
  - `UNIQUE (user_id, googleid)`
  - `UNIQUE (user_id, yelpid)`

Relations:

- N `place` pour 1 `category`
- 1 `place` possède plusieurs `note`
- N—N avec `place_tag` via `place_has_tag`

### `note`

- `id` SERIAL PRIMARY KEY
- `place_id` INTEGER REFERENCES `place`(`id`) ON DELETE CASCADE
- `user_id` VARCHAR(255) NOT NULL
- `name` VARCHAR(255) NOT NULL
- `price` VARCHAR(50)
- `cover` VARCHAR(255)
- `rating` NUMERIC(3,2)
- `favorite` BOOLEAN NOT NULL DEFAULT FALSE
- `comment` TEXT
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ

Contraintes:

- `rating` entre 0 et 5 si renseigné (`note_rating_check`)

Relations:

- N `note` pour 1 `place`
- N—N avec `note_tag` via `note_has_tag`

### `place_tag`

- `id` SERIAL PRIMARY KEY
- `label` VARCHAR(255) UNIQUE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ

Relations:

- N—N avec `place` via `place_has_tag`

### `note_tag`

- `id` SERIAL PRIMARY KEY
- `label` VARCHAR(255) UNIQUE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ

Relations:

- N—N avec `note` via `note_has_tag`

### `place_has_tag`

- `id` SERIAL PRIMARY KEY
- `place_id` INTEGER NOT NULL REFERENCES `place`(`id`) ON DELETE CASCADE
- `tag_id` INTEGER NOT NULL REFERENCES `place_tag`(`id`) ON DELETE CASCADE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ

Contraintes:

- `UNIQUE (place_id, tag_id)`

Relations:

- Table de jointure N—N entre `place` et `place_tag`

### `note_has_tag`

- `id` SERIAL PRIMARY KEY
- `note_id` INTEGER NOT NULL REFERENCES `note`(`id`) ON DELETE CASCADE
- `tag_id` INTEGER NOT NULL REFERENCES `note_tag`(`id`) ON DELETE CASCADE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ

Contraintes:

- `UNIQUE (note_id, tag_id)`

Relations:

- Table de jointure N—N entre `note` et `note_tag`

### `user_preferences`

- `user_id` VARCHAR(255) PRIMARY KEY
- `theme` VARCHAR(10) NOT NULL DEFAULT 'light'
- `currency` VARCHAR(3) NOT NULL DEFAULT 'EUR'
- `display_bullet_points` BOOLEAN NOT NULL DEFAULT TRUE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ

Contraintes:

- `theme` ∈ {`light`, `dark`}
- `currency` = code ISO 4217 (`^[A-Z]{3}$`)

Relations:

- 1—1 logique par utilisateur (clé primaire `user_id`)

## Sécurité (RLS)

- RLS activée sur `place`, `note`, `place_has_tag`, `note_has_tag`, `place_tag`, `note_tag`, `category`, `user_preferences`.
- Politiques owner-based utilisent `auth.uid()::text`.
- `category` : SELECT/INSERT/UPDATE/DELETE per-user (`user_id = auth.uid()::text`).
- `place_tag`, `note_tag` : lecture libre (SELECT) + insertion libre (INSERT) — le frontend crée les tags directement.
- Les tables de jointure (`place_has_tag`, `note_has_tag`) autorisent l’écriture uniquement au propriétaire de l’entité parente.

## Indexes (perf)

Définis dans `db/create_db.sql` : indexes sur `category.user_id`, `place.user_id`, `place.category_id`, `place.slug`, `place.googleid`, `place.yelpid`, `note.user_id`, `note.place_id`, tags, jointures, et trigram (ILIKE) sur `place.name`/`place.address`.
