import Note from "../models/note.js";

class NotesService {
  static async updateFavorite(userId, noteId, favorite) {
    return await Note.updateFavorite(noteId, userId, favorite);
  }

  static async getAllByPlace(placeId) {
    return await Note.findAllByPlace(placeId);
  }

  static async getAllByPlacePaginated(userId, placeId, opts) {
    return await Note.findAllByPlacePaginated(placeId, userId, opts);
  }

  static async getById(id) {
    return await Note.findByPk(id);
  }

  static async countByPlaceIds(userId, placeIds) {
    return await Note.countByPlaceIds(userId, placeIds);
  }

  static async addTags(userId, noteId, tags) {
    return await Note.addTags({ userId, noteId, tags });
  }

  static async getTags(noteId) {
    return await Note.getTags(noteId);
  }

  static async removeTags(userId, noteId, tags) {
    return await Note.removeTags({ userId, noteId, tags });
  }
}

export default NotesService;
