-- =============================================================
-- NotesAPI — Données de seed (développement/test)
-- Les catégories sont per-user et gérées par lazy init côté API
-- =============================================================

BEGIN;
INSERT INTO "place_tag" ("id", "label") VALUES
(1, 'Top'),
(2, 'Bof'),
(3, 'Nul')
ON CONFLICT ("id") DO UPDATE
SET "label" = EXCLUDED."label";
COMMIT;

BEGIN;
INSERT INTO "note_tag" ("id", "label") VALUES
(1, 'Top'),
(2, 'Bof'),
(3, 'Nul')
ON CONFLICT ("id") DO UPDATE
SET "label" = EXCLUDED."label";
COMMIT;
