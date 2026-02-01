import supabase from "../database.js";

class Category {
  static async findAll() {
    const { data, error } = await supabase
      .from("category")
      .select("*")
      .order("label", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async findOneByLabel(label) {
    const { data, error } = await supabase
      .from("category")
      .select("*")
      .eq("label", label)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export default Category;
