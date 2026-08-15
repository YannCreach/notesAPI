-- Surnom local d'un ami.
--
-- La table `friends` porte une ligne par sens de la relation : celle dont
-- `user_id` est le vôtre vous appartient. Le surnom y vit donc naturellement —
-- il ne change que votre vue, jamais le nom que l'autre s'est donné, et l'autre
-- n'a aucun moyen de savoir comment vous l'avez enregistré.
--
-- `NULL` = pas de surnom : l'app retombe sur le nom du compte, puis sur l'email.

BEGIN;

ALTER TABLE "friends"
ADD COLUMN IF NOT EXISTS "nickname" TEXT;

COMMIT;
