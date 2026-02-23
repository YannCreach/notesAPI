import UserPreferences from "../models/userPreferences.js";

const DEFAULT_PREFERENCES = {
  theme: "light",
  currency: "EUR",
  displayBulletPoints: true,
};

class UserPreferencesService {
  static async getOrCreate(userId) {
    const existing = await UserPreferences.findByUserId(userId);
    if (existing) return existing;
    return await UserPreferences.createDefault(userId, DEFAULT_PREFERENCES);
  }

  static async update(userId, updates) {
    return await UserPreferences.upsert(userId, updates);
  }
}

export default UserPreferencesService;
