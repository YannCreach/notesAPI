const { Note } = require('../models');

class noteController {

  static async getAllNotes(req, res) {
    // assert.ok('user_id' in req.body, 'A user ID is required');
    try {
      const notes = await Note.findAll({
        where: {
          place_id: req.body.place_id
        }
      });
      res.status(200).json({ notes });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getNoteById(req, res) {
    // assert.ok('id' in req.body, 'A user ID is required');
    try {
      const { id } = req.body;
      const note = await Note.findByPk(id);
      if (note) {
        res.status(200).json({ note });
      } else {
        res.status(404).json({ message: 'Note not found' });
      }
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
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

  static async updateNote(req, res) {
    try {
      // console.log(req.headers);
      const { noteid, favorite } = req.headers;
      const updated = await Note.update({ favorite }, { where: {
        id: noteid,
        user_id: req.auth.payload.sub,
      }, });

      if (updated) {
        const updatedNote = await Note.findByPk(noteid);
        res.status(200).json({ note: updatedNote });
      } else {
        res.status(404).json({ message: 'Note not found' });
      }
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
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

module.exports = noteController;
