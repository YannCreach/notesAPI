-- =============================================================
-- BASELINE — état du schéma au 2026-07-19
--
-- Consolidation de create_db.sql + social_tables.sql + security_rpcs.sql.
-- Represente le schema DEJA en place sur la prod.
--
-- ⚠️  La base de prod a deja ce schema : NE PAS 'db push' cette migration
--     dessus. L'onboarding unique se fait via 'migration repair
--     --status applied 20260719083932' (voir MIGRATIONS.md). Sur une base vierge
--     (staging), elle s'applique normalement.
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- Source : db/create_db.sql
-- ─────────────────────────────────────────────────────────────
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
  "quickcom" TEXT,
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

-- place_has_tag : lecture et écriture réservées au propriétaire du place
CREATE POLICY place_tag_select_owner ON "place_has_tag"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "place" p WHERE p.id = place_id AND p.user_id = auth.uid()::text)
  );
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

-- note_has_tag : lecture et écriture réservées au propriétaire de la note
CREATE POLICY note_tag_select_owner ON "note_has_tag"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "note" n WHERE n.id = note_id AND n.user_id = auth.uid()::text)
  );
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


-- ─────────────────────────────────────────────────────────────
-- Source : db/social_tables.sql
-- ─────────────────────────────────────────────────────────────
-- =============================================================
-- Feature Social — Tables friend_requests & friends
-- =============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "friend_requests" (
  "id" SERIAL PRIMARY KEY,
  "from_user_id" UUID NOT NULL,
  "to_user_id" UUID NOT NULL,
  "from_email" TEXT NOT NULL,
  "from_name" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friend_requests_pair_unique UNIQUE ("from_user_id", "to_user_id")
);

CREATE TABLE IF NOT EXISTS "friends" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "friend_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friends_pair_unique UNIQUE ("user_id", "friend_id")
);

CREATE TABLE IF NOT EXISTS "pending_invitations" (
  "id" SERIAL PRIMARY KEY,
  "from_user_id" UUID NOT NULL,
  "to_email" TEXT NOT NULL,
  "from_email" TEXT NOT NULL,
  "from_name" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pending_invitations_pair_unique UNIQUE ("from_user_id", "to_email")
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON "friend_requests"("to_user_id");
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON "friend_requests"("from_user_id");
CREATE INDEX IF NOT EXISTS idx_friends_user ON "friends"("user_id");
CREATE INDEX IF NOT EXISTS idx_friends_friend ON "friends"("friend_id");
CREATE INDEX IF NOT EXISTS idx_pending_invitations_email ON "pending_invitations"("to_email");
CREATE INDEX IF NOT EXISTS idx_pending_invitations_from ON "pending_invitations"("from_user_id");

COMMIT;

-- =============================================================
-- RLS (Row Level Security)
-- =============================================================

ALTER TABLE "friend_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "friends" ENABLE ROW LEVEL SECURITY;

-- friend_requests : l'envoyeur peut insérer, le destinataire peut lire et supprimer
CREATE POLICY friend_requests_select_recipient ON "friend_requests"
  FOR SELECT USING (to_user_id = auth.uid());
CREATE POLICY friend_requests_select_sender ON "friend_requests"
  FOR SELECT USING (from_user_id = auth.uid());
CREATE POLICY friend_requests_insert_sender ON "friend_requests"
  FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY friend_requests_delete_recipient ON "friend_requests"
  FOR DELETE USING (to_user_id = auth.uid());

-- friends : chaque utilisateur peut lire/supprimer ses propres lignes
CREATE POLICY friends_select_own ON "friends"
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY friends_insert_own ON "friends"
  FOR INSERT WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY friends_delete_own ON "friends"
  FOR DELETE USING (user_id = auth.uid());

-- pending_invitations : l'envoyeur peut insérer et lire ses invitations
ALTER TABLE "pending_invitations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY pending_invitations_select_sender ON "pending_invitations"
  FOR SELECT USING (from_user_id = auth.uid());
CREATE POLICY pending_invitations_insert_sender ON "pending_invitations"
  FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY pending_invitations_delete_sender ON "pending_invitations"
  FOR DELETE USING (from_user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────
-- Source : db/security_rpcs.sql
-- ─────────────────────────────────────────────────────────────
-- =============================================================
-- Security RPCs — targeted auth.users lookups for the backend
-- Replace admin.listUsers() (loads the entire user table, breaks past the
-- default 50-row page) with scoped, service-role-only functions.
--
-- À exécuter sur la base Supabase.
-- =============================================================

BEGIN;

-- Resolve a single user id by email (case-insensitive). Returns NULL if none.
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
$$;

-- Fetch email + display name for a set of user ids (used to hydrate friends).
CREATE OR REPLACE FUNCTION public.get_users_by_ids(p_ids uuid[])
RETURNS TABLE (id uuid, email text, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT u.id, u.email, (u.raw_user_meta_data ->> 'name') AS name
  FROM auth.users u
  WHERE u.id = ANY (p_ids);
$$;

-- Lock down: only the service_role (used by the backend) may execute these.
-- Prevents authenticated/anon clients from enumerating users.
REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_users_by_ids(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_users_by_ids(uuid[]) TO service_role;

COMMIT;

