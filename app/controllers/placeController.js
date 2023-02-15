const { Place, Category } = require('../models');
const assert = require('assert');


class placeController {

  static async getAllPlaces(req, res) {
    try {
      const places = await Place.findAll({
        include: ["place_category"],
        where: {
          user_id: req.auth.payload.sub
        }
      });
      res.status(200).json({ places });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getAllCategories(req, res) {
    try {
      const categories = await Category.findAll({
        include: [{
          model: Place,
          as: "category_place",
          where: { user_id: req.auth.payload.sub },
          required: false
        }],
      });
      res.status(200).json({ categories });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getPlacesByCategory(req, res) {
    const { categoryid } = req.headers;
    try {
      const places = await Place.findAll({
        include: ["place_category"],
        where: {
          user_id: req.auth.payload.sub,
          category_id: categoryid },
      });
      res.status(200).json({ places });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getLatestPlaces(req, res) {
    try {
      const places = await Place.findAll({
        include: ["place_category"],
        where: {
          user_id: req.auth.payload.sub,
        },
        order: [["created_at", "DESC"]],
        limit: 9,
      });
      res.status(200).json({ places });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  
  static async getPlaceById(req, res) {
    try {
      const { placeid } = req.headers;
      const place = await Place.findOne({
        include: ["place_note", "place_tag"],
        where: { 
          id: placeid,
          user_id: req.auth.payload.sub,
        },
      });
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

  static async updatePlace(req, res) {
    try {
      console.log(req.headers);
      const { placeid, favorite } = req.headers;
      const updated = await Place.update({ favorite }, { where: { 
        id: placeid,
        user_id: req.auth.payload.sub,
      }, });
      
      if (updated) {
        const updatedPlace = await Place.findByPk(placeid);
        res.status(200).json({ place: updatedPlace });
      } else {
        res.status(404).json({ message: 'Place not found' });
      }
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
    }
  }

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
