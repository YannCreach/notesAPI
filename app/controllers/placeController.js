const { Place } = require('../models');
const assert = require('assert');


class placeController {

  static async getAllPlaces(req, res) {
    // assert.ok('user_id' in req.body, 'A user ID is required');
    try {
      const places = await Place.findAll({
        where: {
          user_id: req.headers.userid
        }
      });
      res.status(200).json({ places });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  
  static async getPlaceById(req, res) {
    // assert.ok('id' in req.body, 'A user ID is required');
    try {
      const { id } = req.body;
      const place = await Place.findByPk(id);
      if (place) {
        res.status(200).json({ place });
      } else {
        res.status(404).json({ message: 'Place not found' });
      }
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
    }
  }

  // static async createPlace(req, res) {
  //   try {
  //     const { name, email } = req.body;
  //     const user = await Place.create({ name, email });
  //     res.status(201).json({ user });
  //   } catch (error) {
  //     console.trace(error);
  //     res.status(500).json({ message: error.message });
  //   }
  // }

  // static async updatePlace(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const { name, email } = req.body;
  //     const [updated] = await Place.update({ name, email }, { where: { id } });
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

  // static async deletePlace(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const deleted = await Place.destroy({ where: { id } });
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

module.exports = placeController;
