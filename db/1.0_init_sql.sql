-- Active: 1664437886799@@127.0.0.1@5432@note_to_my_self@public
BEGIN;

CREATE DOMAIN "email" AS text
CHECK(
    value ~ '(?:[a-z0-9!#$%&''*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&''*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])'
);

CREATE TABLE "user" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" email NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "photo_url" TEXT, 
    "dark" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ
);

CREATE TABLE "restaurant" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "location" TEXT,
    "photo_url" TEXT,
    "favorite" BOOLEAN DEFAULT false,
    "coordinate" TEXT,
    "comment" TEXT,
    "user_id" INT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE, 
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ
);

CREATE TABLE "tag_restaurant" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "label" text,
    "tag_restaurant_id" INT NOT NULL REFERENCES "restaurant" ("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ
);

CREATE TABLE "meal" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "photo_url" TEXT ,
    "favorite" BOOLEAN DEFAULT false,
    "review" TEXT,
    "meal_restaurant_id" INT NOT NULL REFERENCES "restaurant" ("id") ON DELETE CASCADE, 
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ
);

CREATE TABLE "tag_meal" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "label" text,
    "tag_meal_id" INT NOT NULL REFERENCES "meal" ("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ
);

CREATE TABLE "memento" (
    "id" INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" TEXT,
    "reminder" INT,
    "memento_restaurant_id" INT NOT NULL REFERENCES "restaurant" ("id") ON DELETE CASCADE, 
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ
);

COMMIT;