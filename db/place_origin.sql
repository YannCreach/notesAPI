-- =============================================================
-- Lieu copié depuis un ami
--
-- Quand on copie le lieu d'un ami, on garde son origine : son id de lieu et
-- son id de compte. C'est ce qui permet, à l'affichage, d'aller chercher ses
-- mementos (`/friendnotes`) à côté des siens.
--
-- Pas de clé étrangère vers `place` : le jour où l'ami supprime son lieu, la
-- copie doit survivre — elle est à vous. Le lien devient simplement muet, et
-- l'API ne renvoie plus rien pour lui.
--
-- Idempotent : peut être rejoué.
-- =============================================================

BEGIN;

ALTER TABLE "place" ADD COLUMN IF NOT EXISTS "origin_place_id" INTEGER;
ALTER TABLE "place" ADD COLUMN IF NOT EXISTS "origin_user_id" VARCHAR(255);

-- Sert le « ai-je déjà copié ce lieu ? » au chargement de la carte.
CREATE INDEX IF NOT EXISTS idx_place_origin ON "place" ("origin_user_id", "origin_place_id");

COMMIT;
