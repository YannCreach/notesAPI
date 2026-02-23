import supabase, { supabaseAdmin } from "../database.js";

class Category {
  static async findAll(userId) {
    const { data, error } = await supabase
      .from("category")
      .select("*")
      .eq("user_id", userId)
      .order("order_index", { ascending: true })
      .order("label", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

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

  static async create(payload) {
    const { data, error } = await supabaseAdmin
      .from("category")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async createMany(categories) {
    if (!Array.isArray(categories) || categories.length === 0) return [];
    const { data, error } = await supabaseAdmin
      .from("category")
      .insert(categories)
      .select("*");
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async updateOrder(userId, order = []) {
    if (!Array.isArray(order) || order.length === 0) return [];
    const updates = order.map((item) => ({
      id: item.id,
      user_id: userId,
      order_index: item.order_index,
    }));
    const { data, error } = await supabaseAdmin
      .from("category")
      .upsert(updates, { onConflict: "id" })
      .select("*")
      .eq("user_id", userId)
      .order("order_index", { ascending: true })
      .order("label", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async delete(userId, id) {
    const { data, error } = await supabaseAdmin
      .from("category")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export default Category;
