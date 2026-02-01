import supabase, { supabaseAdmin } from "../database.js";

class Note {
  static async findAllByPlace(placeId) {
    const { data, error } = await supabase
      .from("note")
      .select("*")
      .eq("place_id", placeId);
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async findAllByPlacePaginated(
    placeId,
    userId,
    { page = 1, limit = 20, sort = "created_at", order = "desc" } = {},
  ) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from("note")
      .select(
        "id,name,option,price,cover,favorite,comment,created_at,updated_at",
        { count: "exact" },
      )
      .eq("place_id", placeId)
      .eq("user_id", userId)
      .order(sort, { ascending: order === "asc" })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { items: data || [], count: count ?? 0 };
  }

  static async findByPk(id) {
    const { data, error } = await supabase
      .from("note")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateFavorite(noteId, userId, favorite) {
    const { data, error } = await supabaseAdmin
      .from("note")
      .update({ favorite })
      .eq("id", noteId)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async addTags({ userId, noteId, tags = [] }) {
    const cleanTags = (tags || []).filter((t) => t?.label);
    if (cleanTags.length === 0) return { tags: [] };

    const { data: upsertedTags, error: eTagBatch } = await supabaseAdmin
      .from("tag")
      .upsert(
        cleanTags.map((t) => ({ label: t.label })),
        {
          onConflict: "label",
        },
      )
      .select("*");
    if (eTagBatch) throw new Error(eTagBatch.message);

    const links = (upsertedTags || []).map((t) => ({
      note_id: noteId,
      tag_id: t.id,
    }));
    if (links.length) {
      const { error: eLinkBatch } = await supabaseAdmin
        .from("note_has_tag")
        .upsert(links, {
          onConflict: "note_id,tag_id",
          ignoreDuplicates: true,
        });
      if (eLinkBatch) throw new Error(eLinkBatch.message);
    }

    return { tags: upsertedTags || [] };
  }

  static async getTags(noteId) {
    const { data, error } = await supabase
      .from("note_has_tag")
      .select("tag(id,label)")
      .eq("note_id", noteId);
    if (error) throw new Error(error.message);
    const tags = (data || []).map((r) => r.tag).filter(Boolean);
    return tags;
  }

  static async removeTags({ userId, noteId, tags = [] }) {
    const labels = (tags || []).map((t) => t?.label).filter(Boolean);
    if (!labels.length) return { removed: 0 };
    // Ensure ownership by fetching the note under RLS
    const note = await this.findByPk(noteId);
    if (!note || note.user_id !== userId) {
      throw new Error("Forbidden");
    }

    const { data: tagRows, error: eSel } = await supabase
      .from("tag")
      .select("id,label")
      .in("label", labels);
    if (eSel) throw new Error(eSel.message);
    const tagIds = (tagRows || []).map((t) => t.id);
    if (!tagIds.length) return { removed: 0 };

    const { error: eDel } = await supabaseAdmin
      .from("note_has_tag")
      .delete()
      .eq("note_id", noteId)
      .in("tag_id", tagIds);
    if (eDel) throw new Error(eDel.message);
    return { removed: tagIds.length };
  }

  static async countByPlaceIds(userId, placeIds = []) {
    if (!Array.isArray(placeIds) || placeIds.length === 0) return {};
    const { data, error } = await supabase
      .from("note")
      .select("place_id")
      .eq("user_id", userId)
      .in("place_id", placeIds);
    if (error) throw new Error(error.message);
    const counts = {};
    for (const row of data || []) {
      const pid = row.place_id;
      counts[pid] = (counts[pid] || 0) + 1;
    }
    return counts;
  }
}

export default Note;
