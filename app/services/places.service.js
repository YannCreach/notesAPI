import Place from "../models/place.js";

class PlacesService {
  static async getAllByUser(userId) {
    return await Place.findAllByUser(userId);
  }

  static async getAllByUserPaginated(userId, opts) {
    return await Place.findAllByUserPaginated(userId, opts);
  }

  static async getPlaceById(userId, placeId) {
    return await Place.findByIdForUser(placeId, userId);
  }

  static async updateFavorite(userId, placeId, favorite) {
    return await Place.updateFavorite(placeId, userId, favorite);
  }

  static async createPlace(userId, payload) {
    return await Place.create({ userId, payload });
  }

  static async findExisting(userId, location) {
    return await Place.findExistingByLocation(userId, location);
  }

  static async getAllByCategoryLabel(userId, categoryLabel) {
    return await Place.findAllByCategoryLabel(userId, categoryLabel);
  }

  static async getAllByCategoryLabelPaginated(userId, categoryLabel, opts) {
    return await Place.findAllByCategoryLabelPaginated(
      userId,
      categoryLabel,
      opts,
    );
  }

  static async getLatestByUser(userId, limit = 9) {
    return await Place.findLatestByUser(userId, limit);
  }

  static async deletePlace(userId, placeId) {
    return await Place.delete(placeId, userId);
  }
}

export default PlacesService;
