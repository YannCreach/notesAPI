BEGIN;

-- Réactive RLS (sécurité par défaut)
ALTER TABLE IF EXISTS "place" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "place_has_tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "note_has_tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "category" ENABLE ROW LEVEL SECURITY;

-- Catégorie & Tag: lecture ouverte (optionnel)
DROP POLICY IF EXISTS allow_all_select_category ON "category";
CREATE POLICY allow_all_select_category ON "category" FOR SELECT USING (true);

DROP POLICY IF EXISTS allow_all_select_tag ON "tag";
CREATE POLICY allow_all_select_tag ON "tag" FOR SELECT USING (true);

-- Place: owner-based policies 100% basées sur Supabase Auth (auth.uid())
DROP POLICY IF EXISTS place_owner_select ON "place";
CREATE POLICY place_owner_select ON "place"
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS place_owner_insert ON "place";
CREATE POLICY place_owner_insert ON "place"
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS place_owner_update ON "place";
CREATE POLICY place_owner_update ON "place"
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS place_owner_delete ON "place";
CREATE POLICY place_owner_delete ON "place"
  FOR DELETE USING (user_id = auth.uid());

-- Note: owner-based policies 100% auth.uid()
DROP POLICY IF EXISTS note_owner_select ON "note";
CREATE POLICY note_owner_select ON "note"
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS note_owner_insert ON "note";
CREATE POLICY note_owner_insert ON "note"
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS note_owner_update ON "note";
CREATE POLICY note_owner_update ON "note"
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS note_owner_delete ON "note";
CREATE POLICY note_owner_delete ON "note"
  FOR DELETE USING (user_id = auth.uid());

-- place_has_tag: lecture libre, écritures réservées au propriétaire via sous-requêtes
DROP POLICY IF EXISTS place_tag_select_all ON "place_has_tag";
CREATE POLICY place_tag_select_all ON "place_has_tag" FOR SELECT USING (true);

DROP POLICY IF EXISTS place_tag_insert_owner ON "place_has_tag";
CREATE POLICY place_tag_insert_owner ON "place_has_tag"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "place" p
      WHERE p.id = place_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS place_tag_delete_owner ON "place_has_tag";
CREATE POLICY place_tag_delete_owner ON "place_has_tag"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "place" p
      WHERE p.id = place_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS place_tag_update_owner ON "place_has_tag";
CREATE POLICY place_tag_update_owner ON "place_has_tag"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "place" p
      WHERE p.id = place_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "place" p
      WHERE p.id = place_id
        AND p.user_id = auth.uid()
    )
  );

-- note_has_tag: lecture libre, écritures réservées au propriétaire de la note
DROP POLICY IF EXISTS note_tag_select_all ON "note_has_tag";
CREATE POLICY note_tag_select_all ON "note_has_tag" FOR SELECT USING (true);

DROP POLICY IF EXISTS note_tag_insert_owner ON "note_has_tag";
CREATE POLICY note_tag_insert_owner ON "note_has_tag"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "note" n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS note_tag_delete_owner ON "note_has_tag";
CREATE POLICY note_tag_delete_owner ON "note_has_tag"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "note" n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS note_tag_update_owner ON "note_has_tag";
CREATE POLICY note_tag_update_owner ON "note_has_tag"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "note" n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "note" n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  );

COMMIT;
