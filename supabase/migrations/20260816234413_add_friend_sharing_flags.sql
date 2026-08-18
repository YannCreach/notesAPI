-- Réglages par ami : ce que je vois de lui, ce qu'il voit de moi.
--
-- La table `friends` porte une ligne par sens de la relation. Celle dont
-- `user_id` est le vôtre vous appartient — c'est là que vivent ces deux
-- drapeaux, comme le surnom ajouté par `db/friends_nickname.sql`. Ils ne se
-- ressemblent que de loin :
--
--   show_places   afficher SES lieux sur MA carte. Simple préférence
--                 d'affichage : elle ne concerne que ma vue, lui n'a aucun
--                 moyen de savoir que je l'ai masqué, et son profil continue
--                 de me montrer ses lieux quand je l'ouvre exprès.
--
--   share_places  partager MES lieux avec LUI. Autorisation, celle-ci. C'est
--                 la ligne (moi → lui) que le serveur consulte quand LUI
--                 réclame mes lieux ou mes mémentos. Le drapeau est donc lu
--                 dans le sens inverse de celui qui l'écrit : je décide chez
--                 moi, il en subit l'effet chez lui.
--
-- Les deux à TRUE par défaut : une amitié déjà nouée ne doit pas se refermer
-- en silence au passage de la migration.

BEGIN;

ALTER TABLE "friends"
ADD COLUMN IF NOT EXISTS "show_places" BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS "share_places" BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;
