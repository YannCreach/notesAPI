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
