import supabase from "../database.js";

class Category {
  static async findOneByLabel(userId, label) {
    const { data, error } = await supabase
      .from("category")
      .select("*")
      .eq("user_id", userId)
      .eq("label", label)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export default Category;
