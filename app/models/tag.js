import supabase from "../database.js";

class Tag {
  static async findAll() {
    const { data, error } = await supabase
      .from("tag")
      .select("*")
      .order("label", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async findByCategoryForUser(categoryLabel, userId) {
    // 1) Places pour cet utilisateur et cette catégorie
    const { data: places, error: e1 } = await supabase
      .from("place")
      .select("id, category:category!inner(label)")
      .eq("user_id", userId)
      .eq("category.label", categoryLabel);
    if (e1) throw new Error(e1.message);
    const placeIds = (places || []).map((p) => p.id);
    if (!placeIds.length) return [];

    // 2) place_has_tag pour les places trouvées
    const { data: links, error: e2 } = await supabase
      .from("place_has_tag")
      .select("tag_id")
      .in("place_id", placeIds);
    if (e2) throw new Error(e2.message);
    const tagIds = [...new Set((links || []).map((l) => l.tag_id))];
    if (!tagIds.length) return [];

    // 3) Tags
    const { data: tags, error: e3 } = await supabase
      .from("tag")
      .select("*")
      .in("id", tagIds)
      .order("label", { ascending: true });
    if (e3) throw new Error(e3.message);
    return tags || [];
  }
}

export default Tag;
