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
}

export default Place;
