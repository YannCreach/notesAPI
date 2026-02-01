BEGIN;

-- Drop legacy global unique constraints on place.slug/googleid/yelpid (if present)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'place_slug_key') THEN
    ALTER TABLE "place" DROP CONSTRAINT "place_slug_key";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'place_googleid_key') THEN
    ALTER TABLE "place" DROP CONSTRAINT "place_googleid_key";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'place_yelpid_key') THEN
    ALTER TABLE "place" DROP CONSTRAINT "place_yelpid_key";
  END IF;
END $$;

-- Add composite unique constraints per user (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'place_user_slug_key') THEN
    ALTER TABLE "place" ADD CONSTRAINT place_user_slug_key UNIQUE ("user_id", "slug");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'place_user_googleid_key') THEN
    ALTER TABLE "place" ADD CONSTRAINT place_user_googleid_key UNIQUE ("user_id", "googleid");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'place_user_yelpid_key') THEN
    ALTER TABLE "place" ADD CONSTRAINT place_user_yelpid_key UNIQUE ("user_id", "yelpid");
  END IF;
END $$;

-- Deduplicate and add unique constraints on N:N tables (place_has_tag, note_has_tag)

-- Clean duplicates for place_has_tag (keep lowest id)
DELETE FROM "place_has_tag" p
USING (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY place_id, tag_id ORDER BY id) AS rn
    FROM "place_has_tag"
  ) t WHERE t.rn > 1
) dup
WHERE p.id = dup.id;

-- Add unique constraint if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'place_has_tag_place_id_tag_id_key') THEN
    ALTER TABLE "place_has_tag" ADD CONSTRAINT place_has_tag_place_id_tag_id_key UNIQUE ("place_id", "tag_id");
  END IF;
END $$;

-- Clean duplicates for note_has_tag (keep lowest id)
DELETE FROM "note_has_tag" n
USING (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY note_id, tag_id ORDER BY id) AS rn
    FROM "note_has_tag"
  ) t WHERE t.rn > 1
) dup
WHERE n.id = dup.id;

-- Add unique constraint if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'note_has_tag_note_id_tag_id_key') THEN
    ALTER TABLE "note_has_tag" ADD CONSTRAINT note_has_tag_note_id_tag_id_key UNIQUE ("note_id", "tag_id");
  END IF;
END $$;

COMMIT;
