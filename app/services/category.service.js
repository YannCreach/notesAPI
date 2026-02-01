import Category from "../models/category.js";

class CategoryService {
  static async getAll() {
    return await Category.findAll();
  }

  static async getOneByLabel(label) {
    return await Category.findOneByLabel(label);
  }
}

export default CategoryService;
