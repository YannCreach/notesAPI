import supabase, { supabaseAdmin } from "../database.js";

class Place {
  static async findExistingByLocation(userId, location) {
    const pattern = `%${location}%`;
    const { data, error } = await supabase
      .from("place")
      .select(
        "id,name,address,latitude,longitude,cover,rating,favorite,comment,slug,googleid,yelpid,category_id,created_at,updated_at, place_note:note(*)",
      )
      .eq("user_id", userId)
      .or(`address.ilike.${pattern},name.ilike.${pattern}`);
    if (error) throw new Error(error.message);
    return data || [];
  }
  static async findAllByUser(userId) {
    const { data, error } = await supabase
      .from("place")
      .select(
        "id,name,address,latitude,longitude,cover,rating,favorite,slug,googleid,yelpid,category_id,created_at,updated_at, place_category:category(id,label,label_fr,label_en)",
      )
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async findAllByUserPaginated(
    userId,
    { page = 1, limit = 20, sort = "created_at", order = "desc" } = {},
  ) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from("place")
      .select(
        "id,name,address,latitude,longitude,cover,rating,favorite,slug,googleid,yelpid,category_id,created_at,updated_at, place_category:category(id,label,label_fr,label_en)",
        { count: "exact" },
      )
      .eq("user_id", userId)
      .order(sort, { ascending: order === "asc" })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { items: data || [], count: count ?? 0 };
  }

  static async findLatestByUser(userId, limit = 9) {
    const { data, error } = await supabase
      .from("place")
      .select(
        "id,name,address,latitude,longitude,cover,rating,favorite,slug,googleid,yelpid,category_id,created_at,updated_at, place_category:category(id,label,label_fr,label_en)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async findAllByCategoryLabel(userId, categoryLabel) {
    const { data, error } = await supabase
      .from("place")
      .select(
        "id,name,address,latitude,longitude,cover,rating,favorite,slug,googleid,yelpid,category_id,created_at,updated_at, place_category:category!inner(id,label,label_fr,label_en)",
      )
      .eq("user_id", userId)
      .eq("category.label", categoryLabel);
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async findAllByCategoryLabelPaginated(
    userId,
    categoryLabel,
    { page = 1, limit = 20, sort = "created_at", order = "desc" } = {},
  ) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from("place")
      .select(
        "id,name,address,latitude,longitude,cover,rating,favorite,slug,googleid,yelpid,category_id,created_at,updated_at, place_category:category!inner(id,label,label_fr,label_en)",
        { count: "exact" },
      )
      .eq("user_id", userId)
      .eq("category.label", categoryLabel)
      .order(sort, { ascending: order === "asc" })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { items: data || [], count: count ?? 0 };
  }

  static async findByIdForUser(placeId, userId) {
    const { data: place, error: e1 } = await supabase
      .from("place")
      .select(
        [
          // Place fields
          "id",
          "name",
          "address",
          "latitude",
          "longitude",
          "cover",
          "rating",
          "favorite",
          "comment",
          "slug",
          "googleid",
          "yelpid",
          "category_id",
          "created_at",
          "updated_at",
          // Category
          "place_category:category(*)",
          // Notes (projection minimale)
          "place_note:note(id,name,option,price,cover,favorite,comment,created_at,updated_at)",
          // Tags via table de jointure (sera aplati après)
          "_tags:place_has_tag(tag(id,label))",
        ].join(","),
      )
      .eq("id", placeId)
      .eq("user_id", userId)
      .single();
    if (e1) throw new Error(e1.message);

    const tags = Array.isArray(place?._tags)
      ? place._tags.map((t) => t.tag).filter(Boolean)
      : [];

    const { _tags, ...rest } = place || {};
    return { ...rest, tags };
  }

  static async updateFavorite(placeId, userId, favorite) {
    const { data, error } = await supabaseAdmin
      .from("place")
      .update({ favorite })
      .eq("id", placeId)
      .eq("user_id", userId)
      .select(
        "id,name,address,latitude,longitude,cover,rating,favorite,comment,slug,googleid,yelpid,category_id,created_at,updated_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async create({ userId, payload }) {
    const {
      name,
      address,
      comment,
      cover,
      category_id,
      latitude,
      longitude,
      rating,
      slug,
      favorite,
      googleid,
      yelpid,
      tags = [],
    } = payload;

    const { data: place, error } = await supabaseAdmin
      .from("place")
      .insert([
        {
          name,
          address,
          comment,
          cover,
          category_id,
          latitude,
          longitude,
          rating,
          slug,
          favorite,
          googleid,
          yelpid,
          user_id: userId,
        },
      ])
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Handle tags: upsert en lot + lien en lot
    const cleanTags = (tags || []).filter((t) => t?.label);
    let linkedTags = [];
    if (cleanTags.length) {
      const { data: upsertedTags, error: eTagBatch } = await supabaseAdmin
        .from("tag")
        .upsert(
          cleanTags.map((t) => ({ label: t.label })),
          { onConflict: "label" },
        )
        .select("*");
      if (eTagBatch) throw new Error(eTagBatch.message);

      const links = (upsertedTags || []).map((t) => ({
        place_id: place.id,
        tag_id: t.id,
      }));
      if (links.length) {
        const { error: eLinkBatch } = await supabaseAdmin
          .from("place_has_tag")
          .upsert(links, {
            onConflict: "place_id,tag_id",
            ignoreDuplicates: true,
          });
        if (eLinkBatch) throw new Error(eLinkBatch.message);
      }
      linkedTags = upsertedTags || [];
    }

    return { place, tags: linkedTags };
  }

  static async delete(placeId, userId) {
    const { error } = await supabaseAdmin
      .from("place")
      .delete()
      .eq("id", placeId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return true;
  }
}

export default Place;
