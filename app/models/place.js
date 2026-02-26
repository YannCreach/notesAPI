import supabase from "../database.js";

class Place {
  static async findExistingByLocation(userId, location) {
    const pattern = `%${location}%`;
    const { data, error } = await supabase
      .from("place")
      .select(
        "id,name,address,city,latitude,longitude,cover,rating,favorite,comment,slug,googleid,yelpid,category_id,created_at,updated_at, place_note:note(id,name,price,cover,rating,favorite,comment,created_at,updated_at)",
      )
      .eq("user_id", userId)
      .or(`address.ilike.${pattern},name.ilike.${pattern}`);
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async findMementoById(userId, mementoId) {
    const { data, error } = await supabase
      .from("note")
      .select("id, cover, place_id")
      .eq("user_id", userId)
      .eq("id", mementoId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteMemento(userId, mementoId) {
    const { error } = await supabase
      .from("note")
      .delete()
      .eq("user_id", userId)
      .eq("id", mementoId);
    if (error) throw new Error(error.message);
  }

  static async findPlaceWithMementos(userId, placeId) {
    const { data, error } = await supabase
      .from("place")
      .select("id, cover, place_note:note(id, cover)")
      .eq("user_id", userId)
      .eq("id", placeId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateCategory(userId, oldCatId, newCatId) {
    const { data, error } = await supabase
      .from("place")
      .update({ category_id: newCatId })
      .eq("user_id", userId)
      .eq("category_id", oldCatId)
      .select("id");
    if (error) throw new Error(error.message);
    return data;
  }

  static async deletePlace(userId, placeId) {
    const { error: notesError } = await supabase
      .from("note")
      .delete()
      .eq("user_id", userId)
      .eq("place_id", placeId);
    if (notesError) throw new Error(notesError.message);

    const { error } = await supabase
      .from("place")
      .delete()
      .eq("user_id", userId)
      .eq("id", placeId);
    if (error) throw new Error(error.message);
  }
}

export default Place;
