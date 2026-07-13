-- =============================================================
-- RLS fix — restrict cross-tenant visibility of tag associations
--
-- Before: place_has_tag / note_has_tag had `SELECT USING (true)`, letting any
-- authenticated user read every user's note/place → tag associations
-- (enumeration of foreign ids). This scopes reads to the owner.
--
-- Note: the label dictionaries `place_tag` / `note_tag` intentionally keep an
-- open SELECT — they hold only shared tag labels (needed for autocomplete)
-- and no user data or foreign ids.
--
-- À exécuter sur la base Supabase.
-- =============================================================

BEGIN;

-- place_has_tag: read only associations for places you own.
DROP POLICY IF EXISTS place_tag_select_all ON "place_has_tag";
DROP POLICY IF EXISTS place_tag_select_owner ON "place_has_tag";
CREATE POLICY place_tag_select_owner ON "place_has_tag"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "place" p
      WHERE p.id = place_id AND p.user_id = auth.uid()::text
    )
  );

-- note_has_tag: read only associations for notes you own.
DROP POLICY IF EXISTS note_tag_select_all ON "note_has_tag";
DROP POLICY IF EXISTS note_tag_select_owner ON "note_has_tag";
CREATE POLICY note_tag_select_owner ON "note_has_tag"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "note" n
      WHERE n.id = note_id AND n.user_id = auth.uid()::text
    )
  );

COMMIT;
