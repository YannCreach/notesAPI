-- =============================================================
-- Ajout de la colonne `quickcom` sur `place`
--
-- Note rapide en texte libre, editable depuis PlaceDetails cote mobile
-- et synchronisee par syncLocalToRemote / syncEngine.
--
-- `create_db.sql` porte deja cette colonne, mais il ne s'applique qu'a une
-- base vierge : cette migration existe pour les bases deja en service.
-- Idempotente — rejouable sans risque.
--
-- Pendant local (SQLite) : `placeAddQuickcomSql` dans src/db/migrations.js
-- cote notesMobile.
--
-- À exécuter sur la base Supabase.
-- =============================================================

ALTER TABLE "place" ADD COLUMN IF NOT EXISTS "quickcom" TEXT;
