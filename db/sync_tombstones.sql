-- =============================================================
-- Sync — tombstones et horodatage serveur
--
-- Deux manques du modèle de synchronisation côté mobile :
--
-- 1. Une suppression n'était jamais propagée : le client supprimait la ligne
--    distante en dur, donc les autres appareils, qui ne voient que
--    `updated_at > last_pull`, ne pouvaient pas savoir qu'elle avait disparu.
--    On la marque désormais (`deleted_at`), le client la répercute, et une
--    purge périodique nettoie les tombstones anciens.
--
-- 2. `updated_at` était écrit par le client, donc soumis à l'horloge du
--    téléphone : un appareil mal réglé gagnait tous les conflits et pouvait
--    faire sauter des lignes au pull. Un trigger le fixe côté serveur.
--
-- À exécuter sur la base Supabase.
-- =============================================================

BEGIN;

-- =============================================================
-- 1. TOMBSTONES
-- =============================================================

ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;
ALTER TABLE "place" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;
ALTER TABLE "note" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

-- Le pull filtre sur updated_at ; ces index servent aussi la purge.
CREATE INDEX IF NOT EXISTS idx_category_deleted_at ON "category"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_place_deleted_at ON "place"("deleted_at");
CREATE INDEX IF NOT EXISTS idx_note_deleted_at ON "note"("deleted_at");

CREATE INDEX IF NOT EXISTS idx_category_user_updated ON "category"("user_id", "updated_at");
CREATE INDEX IF NOT EXISTS idx_place_user_updated ON "place"("user_id", "updated_at");
CREATE INDEX IF NOT EXISTS idx_note_user_updated ON "note"("user_id", "updated_at");

-- Les contraintes d'unicité doivent ignorer les lignes supprimées, sinon un
-- utilisateur ne peut plus recréer une catégorie qu'il vient de supprimer.
ALTER TABLE "category" DROP CONSTRAINT IF EXISTS category_user_label_unique;
DROP INDEX IF EXISTS category_user_label_unique;
CREATE UNIQUE INDEX IF NOT EXISTS category_user_label_unique
  ON "category"("user_id", "label") WHERE "deleted_at" IS NULL;

ALTER TABLE "place" DROP CONSTRAINT IF EXISTS place_user_slug_key;
DROP INDEX IF EXISTS place_user_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS place_user_slug_key
  ON "place"("user_id", "slug") WHERE "deleted_at" IS NULL;

ALTER TABLE "place" DROP CONSTRAINT IF EXISTS place_user_googleid_key;
DROP INDEX IF EXISTS place_user_googleid_key;
CREATE UNIQUE INDEX IF NOT EXISTS place_user_googleid_key
  ON "place"("user_id", "googleid") WHERE "deleted_at" IS NULL;

-- =============================================================
-- 2. HORODATAGE SERVEUR
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_category_updated_at ON "category";
CREATE TRIGGER trg_category_updated_at
  BEFORE INSERT OR UPDATE ON "category"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_place_updated_at ON "place";
CREATE TRIGGER trg_place_updated_at
  BEFORE INSERT OR UPDATE ON "place"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_note_updated_at ON "note";
CREATE TRIGGER trg_note_updated_at
  BEFORE INSERT OR UPDATE ON "note"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Les lignes historiques sans updated_at reviendraient à chaque cycle de pull.
UPDATE "category" SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;
UPDATE "place" SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;
UPDATE "note" SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;

COMMIT;

-- =============================================================
-- 3. PURGE DES TOMBSTONES (à planifier, ex. pg_cron quotidien)
--
-- 90 jours : au-delà, un appareil resté hors ligne aussi longtemps repartira
-- de toute façon d'un pull complet.
-- =============================================================

CREATE OR REPLACE FUNCTION purge_deleted_rows(retention INTERVAL DEFAULT INTERVAL '90 days')
RETURNS void AS $$
BEGIN
  DELETE FROM "note" WHERE deleted_at IS NOT NULL AND deleted_at < now() - retention;
  DELETE FROM "place" WHERE deleted_at IS NOT NULL AND deleted_at < now() - retention;
  DELETE FROM "category" WHERE deleted_at IS NOT NULL AND deleted_at < now() - retention;
END;
$$ LANGUAGE plpgsql;
