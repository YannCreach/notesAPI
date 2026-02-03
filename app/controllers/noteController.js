import { Note } from "../models/index.js";
import NotesService from "../services/notes.service.js";

class noteController {
  static async getAllNotes(req, res, next) {
    // assert.ok('user_id' in req.body, 'A user ID is required');
    try {
      const placeId = req.params.id;
      const {
        page = 1,
        limit = 20,
        sort = "created_at",
        order = "desc",
      } = req.validated || req.query || {};
      const { items, count } = await NotesService.getAllByPlacePaginated(
        req.auth.payload.sub,
        placeId,
        { page: Number(page) || 1, limit: Number(limit) || 20, sort, order },
      );
      const totalPages = Math.ceil((count || 0) / (Number(limit) || 20));
      res.status(200).json({
        notes: items,
        meta: {
          page: Number(page) || 1,
          limit: Number(limit) || 20,
          total: count || 0,
          totalPages,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getNoteById(req, res, next) {
    // assert.ok('id' in req.body, 'A user ID is required');
    try {
      const id = req.params.id;
      const note = await NotesService.getById(id);
      if (note) {
        res.status(200).json({ note });
      } else {
        res.status(404).json({ message: "Note not found" });
      }
    } catch (error) {
      return next(error);
    }
  }

  // static async createNote(req, res) {
  //   try {
  //     const { name, email } = req.body;
  //     const user = await Note.create({ name, email });
  //     res.status(201).json({ user });
  //   } catch (error) {
  //     console.trace(error);
  //     res.status(500).json({ message: error.message });
  //   }
  // }

  static async updateNote(req, res, next) {
    try {
      const id = req.params?.id;
      const { favorite } = req.validated || req.body || {};
      const updatedNote = await NotesService.updateFavorite(
        req.auth.payload.sub,
        id,
        favorite === "true" || favorite === true,
      );
      if (updatedNote) {
        res.status(200).json({ note: updatedNote });
      } else {
        res.status(404).json({ message: "Note not found" });
      }
    } catch (error) {
      return next(error);
    }
  }

  static async addTags(req, res, next) {
    try {
      const noteId = req.params?.id;
      const tags = req.validated?.tags || [];
      const result = await NotesService.addTags(
        req.auth.payload.sub,
        Number(noteId),
        tags,
      );
      return res.status(200).json({ tags: result.tags || [] });
    } catch (error) {
      return next(error);
    }
  }

  static async getTags(req, res, next) {
    try {
      const noteId = req.params?.id;
      const tags = await NotesService.getTags(Number(noteId));
      return res.status(200).json({ tags: tags || [] });
    } catch (error) {
      return next(error);
    }
  }

  static async removeTags(req, res, next) {
    try {
      const noteId = req.params?.id;
      const tags = req.validated?.tags || [];
      const result = await NotesService.removeTags(
        req.auth.payload.sub,
        Number(noteId),
        tags,
      );
      return res.status(200).json({ removed: result.removed || 0 });
    } catch (error) {
      return next(error);
    }
  }

  // static async updateNote(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const { name, email } = req.body;
  //     const [updated] = await Note.update({ name, email }, { where: { id } });
  //     if (updated) {
  //       const updatedUser = await User.findByPk(id);
  //       res.status(200).json({ user: updatedUser });
  //     } else {
  //       res.status(404).json({ message: 'User not found' });
  //     }
  //   } catch (error) {
  //     console.trace(error);
  //     res.status(500).json({ message: error.message });
  //   }
  // }

  // static async deleteNote(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const deleted = await Note.destroy({ where: { id } });
  //     if (deleted) {
  //       res.status(204).json();
  //     } else {
  //       res.status(404).json({ message: 'User not found' });
  //     }
  //   } catch (error) {
  //     console.trace(error);
  //     res.status(500).json({ message: error.message });
  //   }
  // }
}

export default noteController;
