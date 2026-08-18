-- Lieu privé.
--
-- Un lieu marqué privé — et tous ses mementos avec lui — n'est jamais servi aux
-- amis : ni sur leur carte (`/friendsplaces`), ni depuis le profil de son
-- propriétaire (`/friendplaces`), ni via `/friendnotes` sur une copie qu'ils
-- auraient faite avant qu'il ne le devienne.
--
-- Le filtre vit côté serveur, dans `app/models/social.js`, et nulle part
-- ailleurs. L'appareil transporte le drapeau mais ne décide de rien : c'est
-- l'API qui refuse de servir la ligne. Le pendant local est
-- `notesMobile/src/db/migrations.js` (`placeAddPrivateSql`), et le moteur de
-- sync transporte la colonne — sinon le réglage ne survivrait pas au
-- changement d'appareil.
--
-- FALSE par défaut : rien de ce qui est déjà partagé ne se referme au passage
-- de la migration.

BEGIN;

ALTER TABLE "place"
ADD COLUMN IF NOT EXISTS "is_private" BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
