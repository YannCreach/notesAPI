-- Indexation recommandée pour les accès fréquents
BEGIN;

-- Tables principales
CREATE INDEX IF NOT EXISTS idx_place_user ON "place"("user_id");
CREATE INDEX IF NOT EXISTS idx_place_category ON "place"("category_id");
CREATE INDEX IF NOT EXISTS idx_place_slug ON "place"("slug");
CREATE INDEX IF NOT EXISTS idx_place_googleid ON "place"("googleid");
CREATE INDEX IF NOT EXISTS idx_place_yelpid ON "place"("yelpid");

CREATE INDEX IF NOT EXISTS idx_note_place ON "note"("place_id");
CREATE INDEX IF NOT EXISTS idx_note_user ON "note"("user_id");

-- Tables de jointure
CREATE INDEX IF NOT EXISTS idx_pht_place ON "place_has_tag"("place_id");
CREATE INDEX IF NOT EXISTS idx_pht_tag ON "place_has_tag"("tag_id");

-- Tags
CREATE INDEX IF NOT EXISTS idx_tag_label ON "tag"("label");

-- Recherche texte (ilike) sur place.name et place.address
-- Active l'extension pg_trgm puis crée des index GIN pour accélérer les recherches ILIKE
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_place_name_trgm ON "place" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_place_address_trgm ON "place" USING gin ("address" gin_trgm_ops);

COMMIT;
