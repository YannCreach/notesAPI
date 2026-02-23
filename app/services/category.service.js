import Category from "../models/category.js";

const DEFAULT_CATEGORIES = [
  { label: "Cinema", label_fr: "un Cinema", label_en: "a Cinema", icon: "clapperboard", order_index: 1 },
  { label: "Restaurant", label_fr: "un Restaurant", label_en: "a Restaurant", icon: "utensils", order_index: 2 },
  { label: "Hotel", label_fr: "un Hotel", label_en: "a Hotel", icon: "bed", order_index: 3 },
  { label: "Boulangerie", label_fr: "une Boulangerie", label_en: "a Bakery", icon: "bread-slice", order_index: 4 },
  { label: "Musique", label_fr: "une Musique", label_en: "a Music", icon: "music", order_index: 5 },
  { label: "Nature", label_fr: "un Espace naturel", label_en: "a Natural area", icon: "seedling", order_index: 6 },
  { label: "Bar", label_fr: "un Bar", label_en: "a Bar", icon: "beer-mug-empty", order_index: 7 },
  { label: "Poissonnerie", label_fr: "une Poissonnerie", label_en: "a Fish market", icon: "fish", order_index: 8 },
  { label: "Primeur", label_fr: "un Primeur", label_en: "a Greengrocer", icon: "carrot", order_index: 9 },
  { label: "Coiffeur", label_fr: "un Coiffeur", label_en: "a Hairdresser", icon: "scissors", order_index: 10 },
  { label: "Divers", label_fr: "un Divers", label_en: "a Misc", icon: "lightbulb", order_index: 11 },
];

class CategoryService {
  static async getAll(userId) {
    const categories = await Category.findAll(userId);
    if (categories.length === 0) {
      await CategoryService.#seedDefaults(userId);
      return await Category.findAll(userId);
    }
    return categories;
  }

  static async getOneByLabel(userId, label) {
    return await Category.findOneByLabel(userId, label);
  }

  static async create(userId, payload) {
    return await Category.create({ ...payload, user_id: userId });
  }

  static async updateOrder(userId, order) {
    return await Category.updateOrder(userId, order);
  }

  static async delete(userId, id) {
    return await Category.delete(userId, id);
  }

  static async #seedDefaults(userId) {
    const rows = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      user_id: userId,
    }));
    return await Category.createMany(rows);
  }
}

export default CategoryService;
