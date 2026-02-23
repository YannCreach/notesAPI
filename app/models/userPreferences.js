import supabase, { supabaseAdmin } from "../database.js";

class UserPreferences {
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from("user_preferences")
      .select(
        "user_id,theme,currency,display_bullet_points,created_at,updated_at",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data || null;
  }

  static async createDefault(userId, defaults) {
    const payload = {
      user_id: userId,
      theme: defaults.theme,
      currency: defaults.currency,
      ...(defaults.displayBulletPoints !== undefined
        ? { display_bullet_points: defaults.displayBulletPoints }
        : {}),
      ...(defaults.display_bullet_points !== undefined
        ? { display_bullet_points: defaults.display_bullet_points }
        : {}),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin
      .from("user_preferences")
      .insert([payload])
      .select(
        "user_id,theme,currency,display_bullet_points,created_at,updated_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async upsert(userId, updates) {
    const payload = {
      user_id: userId,
      ...(updates.theme !== undefined ? { theme: updates.theme } : {}),
      ...(updates.currency !== undefined ? { currency: updates.currency } : {}),
      ...(updates.displayBulletPoints !== undefined
        ? { display_bullet_points: updates.displayBulletPoints }
        : {}),
      ...(updates.display_bullet_points !== undefined
        ? { display_bullet_points: updates.display_bullet_points }
        : {}),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin
      .from("user_preferences")
      .upsert([payload], { onConflict: "user_id" })
      .select(
        "user_id,theme,currency,display_bullet_points,created_at,updated_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export default UserPreferences;
