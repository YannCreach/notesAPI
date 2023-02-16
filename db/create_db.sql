BEGIN;

DROP TABLE IF EXISTS public.user,
"place",
"note",
"place_has_tag",
"note_has_tag",
"category",
"tag";

-- CREATE TABLE IF NOT EXISTS public.user (
--     "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
--     "username" VARCHAR(50),
--     "email" VARCHAR(255) NOT NULL UNIQUE,
--     "password" VARCHAR(255) NOT NULL,
--     "picture" VARCHAR(255),
--     "premium" BOOL DEFAULT FALSE,
--     "colorscheme" BOOLEAN NOT NULL DEFAULT TRUE,
--     "created_at" TIMESTAMP with time zone NOT NULL DEFAULT now(),
--     "updated_at" TIMESTAMP with time zone
--   );
 
CREATE TABLE IF NOT EXISTS "place" (
    "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "user_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "adress" VARCHAR(255),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "cover" VARCHAR(255),
    "rating" INTEGER,
    "favorite" BOOLEAN NOT NULL DEFAULT FALSE,
    "opening" VARCHAR(255),
    "comment" TEXT,
    "yelpid" VARCHAR(50) UNIQUE,
    "category_id" INTEGER,
    "created_at" TIMESTAMP with time zone NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP with time zone
  );

CREATE TABLE IF NOT EXISTS "note" (
    "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "place_id" INTEGER REFERENCES "place"("id") ON DELETE CASCADE,
    "user_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "price" VARCHAR(50),
    "cover" VARCHAR(255),
    "favorite" BOOLEAN NOT NULL DEFAULT FALSE,
    "comment" TEXT,
    "created_at" TIMESTAMP with time zone NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP with time zone
  );

CREATE TABLE IF NOT EXISTS "category" (
    "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "label" VARCHAR(255) UNIQUE,
    "created_at" TIMESTAMP with time zone NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP with time zone
  );

CREATE TABLE IF NOT EXISTS "tag" (
    "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "label" VARCHAR(255) UNIQUE,
    "created_at" TIMESTAMP with time zone NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP with time zone
  );

CREATE TABLE IF NOT EXISTS "place_has_tag" (
    "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "place_id" INTEGER NOT NULL REFERENCES "place"("id") ON DELETE CASCADE,
    "tag_id" INTEGER NOT NULL REFERENCES "tag"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ
  );

CREATE TABLE IF NOT EXISTS "note_has_tag" (
  "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "note_id" INTEGER NOT NULL REFERENCES "note"("id") ON DELETE CASCADE,
  "tag_id" INTEGER NOT NULL REFERENCES "tag"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ
);

COMMIT;