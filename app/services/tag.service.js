import Tag from "../models/tag.js";

class TagService {
  static async getAll() {
    return await Tag.findAll();
  }

  static async findByCategoryForUser(categoryLabel, userId) {
    return await Tag.findByCategoryForUser(categoryLabel, userId);
  }
}

export default TagService;
