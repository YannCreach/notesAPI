-- =============================================================
-- NotesAPI — Création complète de la base de données
-- Tables, RLS, contraintes, indexes
-- À exécuter sur une base Supabase vierge
-- =============================================================

BEGIN;

-- =============================================================
-- TABLES
-- =============================================================

CREATE TABLE IF NOT EXISTS "category" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "label" VARCHAR(255),
  "label_fr" VARCHAR(255),
  "label_en" VARCHAR(255),
  "icon" VARCHAR(50),
  "order_index" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "place_tag" (
  "id" SERIAL PRIMARY KEY,
  "label" VARCHAR(255) UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "note_tag" (
  "id" SERIAL PRIMARY KEY,
  "label" VARCHAR(255) UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "user_preferences" (
  "user_id" VARCHAR(255) PRIMARY KEY,
  "theme" VARCHAR(10) NOT NULL DEFAULT 'light',
  "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
  "display_bullet_points" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ,
  CONSTRAINT user_preferences_theme_check CHECK (theme IN ('light', 'dark')),
  CONSTRAINT user_preferences_currency_check CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE TABLE IF NOT EXISTS "place" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "address" VARCHAR(255),
  "city" VARCHAR(255),
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "cover" VARCHAR(255),
  "rating" INTEGER,
  "favorite" BOOLEAN NOT NULL DEFAULT FALSE,
  "comment" TEXT,
  "slug" VARCHAR(255),
  "googleid" VARCHAR(50),
  "yelpid" VARCHAR(50),
  "category_id" INTEGER NOT NULL REFERENCES "category"("id") ON DELETE RESTRICT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "note" (
  "id" SERIAL PRIMARY KEY,
  "place_id" INTEGER REFERENCES "place"("id") ON DELETE CASCADE,
  "user_id" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "price" VARCHAR(50),
  "cover" VARCHAR(255),
  "rating" NUMERIC(3,2),
  "favorite" BOOLEAN NOT NULL DEFAULT FALSE,
  "comment" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ,
  CONSTRAINT note_rating_check CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5))
);

CREATE TABLE IF NOT EXISTS "place_has_tag" (
  "id" SERIAL PRIMARY KEY,
  "place_id" INTEGER NOT NULL REFERENCES "place"("id") ON DELETE CASCADE,
  "tag_id" INTEGER NOT NULL REFERENCES "place_tag"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ,
  CONSTRAINT place_has_tag_place_id_tag_id_key UNIQUE ("place_id", "tag_id")
);

CREATE TABLE IF NOT EXISTS "note_has_tag" (
  "id" SERIAL PRIMARY KEY,
  "note_id" INTEGER NOT NULL REFERENCES "note"("id") ON DELETE CASCADE,
  "tag_id" INTEGER NOT NULL REFERENCES "note_tag"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ,
  CONSTRAINT note_has_tag_note_id_tag_id_key UNIQUE ("note_id", "tag_id")
);

-- =============================================================
-- CONTRAINTES UNIQUE COMPOSITES
-- =============================================================

-- Category : unicité par utilisateur
ALTER TABLE "category" ADD CONSTRAINT category_user_label_unique UNIQUE ("user_id", "label");
ALTER TABLE "category" ADD CONSTRAINT category_user_label_fr_unique UNIQUE ("user_id", "label_fr");
ALTER TABLE "category" ADD CONSTRAINT category_user_label_en_unique UNIQUE ("user_id", "label_en");

-- Place : unicité par utilisateur
ALTER TABLE "place" ADD CONSTRAINT place_user_slug_key UNIQUE ("user_id", "slug");
ALTER TABLE "place" ADD CONSTRAINT place_user_googleid_key UNIQUE ("user_id", "googleid");
ALTER TABLE "place" ADD CONSTRAINT place_user_yelpid_key UNIQUE ("user_id", "yelpid");

-- =============================================================
-- INDEXES
-- =============================================================

-- Category
CREATE INDEX IF NOT EXISTS idx_category_user_id ON "category"("user_id");
CREATE INDEX IF NOT EXISTS idx_category_order ON "category"("order_index");

-- Place
CREATE INDEX IF NOT EXISTS idx_place_user ON "place"("user_id");
CREATE INDEX IF NOT EXISTS idx_place_category ON "place"("category_id");
CREATE INDEX IF NOT EXISTS idx_place_slug ON "place"("slug");
CREATE INDEX IF NOT EXISTS idx_place_googleid ON "place"("googleid");
CREATE INDEX IF NOT EXISTS idx_place_yelpid ON "place"("yelpid");

-- Note
CREATE INDEX IF NOT EXISTS idx_note_place ON "note"("place_id");
CREATE INDEX IF NOT EXISTS idx_note_user ON "note"("user_id");

-- Tables de jointure
CREATE INDEX IF NOT EXISTS idx_pht_place ON "place_has_tag"("place_id");
CREATE INDEX IF NOT EXISTS idx_pht_tag ON "place_has_tag"("tag_id");
CREATE INDEX IF NOT EXISTS idx_nht_note ON "note_has_tag"("note_id");
CREATE INDEX IF NOT EXISTS idx_nht_tag ON "note_has_tag"("tag_id");

-- Tags
CREATE INDEX IF NOT EXISTS idx_place_tag_label ON "place_tag"("label");
CREATE INDEX IF NOT EXISTS idx_note_tag_label ON "note_tag"("label");

-- Recherche texte (ILIKE)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_place_name_trgm ON "place" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_place_address_trgm ON "place" USING gin ("address" gin_trgm_ops);

COMMIT;

-- =============================================================
-- RLS (Row Level Security)
-- =============================================================

ALTER TABLE "category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "place" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "place_tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "place_has_tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_has_tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_preferences" ENABLE ROW LEVEL SECURITY;

-- Category : per-user
CREATE POLICY category_select_own ON "category"
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY category_insert_own ON "category"
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY category_update_own ON "category"
  FOR UPDATE USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY category_delete_own ON "category"
  FOR DELETE USING (user_id = auth.uid()::text);

-- Tags : lecture ouverte + insertion libre (le frontend crée des tags directement)
CREATE POLICY allow_all_select_place_tag ON "place_tag" FOR SELECT USING (true);
CREATE POLICY place_tag_insert_all ON "place_tag" FOR INSERT WITH CHECK (true);
CREATE POLICY allow_all_select_note_tag ON "note_tag" FOR SELECT USING (true);
CREATE POLICY note_tag_insert_all ON "note_tag" FOR INSERT WITH CHECK (true);

-- Place : owner-based
CREATE POLICY place_owner_select ON "place"
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY place_owner_insert ON "place"
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY place_owner_update ON "place"
  FOR UPDATE USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY place_owner_delete ON "place"
  FOR DELETE USING (user_id = auth.uid()::text);

-- Note : owner-based
CREATE POLICY note_owner_select ON "note"
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY note_owner_insert ON "note"
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY note_owner_update ON "note"
  FOR UPDATE USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY note_owner_delete ON "note"
  FOR DELETE USING (user_id = auth.uid()::text);

-- User preferences : owner-based
CREATE POLICY user_preferences_owner_select ON "user_preferences"
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY user_preferences_owner_insert ON "user_preferences"
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY user_preferences_owner_update ON "user_preferences"
  FOR UPDATE USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY user_preferences_owner_delete ON "user_preferences"
  FOR DELETE USING (user_id = auth.uid()::text);

-- place_has_tag : lecture libre, écriture via ownership du place
CREATE POLICY place_tag_select_all ON "place_has_tag" FOR SELECT USING (true);
CREATE POLICY place_tag_insert_owner ON "place_has_tag"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "place" p WHERE p.id = place_id AND p.user_id = auth.uid()::text)
  );
CREATE POLICY place_tag_delete_owner ON "place_has_tag"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "place" p WHERE p.id = place_id AND p.user_id = auth.uid()::text)
  );
CREATE POLICY place_tag_update_owner ON "place_has_tag"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "place" p WHERE p.id = place_id AND p.user_id = auth.uid()::text)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "place" p WHERE p.id = place_id AND p.user_id = auth.uid()::text)
  );

-- note_has_tag : lecture libre, écriture via ownership de la note
CREATE POLICY note_tag_select_all ON "note_has_tag" FOR SELECT USING (true);
CREATE POLICY note_tag_insert_owner ON "note_has_tag"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "note" n WHERE n.id = note_id AND n.user_id = auth.uid()::text)
  );
CREATE POLICY note_tag_delete_owner ON "note_has_tag"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "note" n WHERE n.id = note_id AND n.user_id = auth.uid()::text)
  );
CREATE POLICY note_tag_update_owner ON "note_has_tag"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "note" n WHERE n.id = note_id AND n.user_id = auth.uid()::text)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "note" n WHERE n.id = note_id AND n.user_id = auth.uid()::text)
  );
