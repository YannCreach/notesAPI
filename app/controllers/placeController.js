const { Place, Category } = require('../models');
// const assert = require('assert');
const axios = require('axios');
const yelpApiKey = process.env.YELP_API_KEY;

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
  
  // static async getPlaceById(req, res) {
  //   let placeData = {};
  //   try {
  //     const { placeid } = req.headers;
  //     const place = await Place.findOne({
  //       include: ["place_note", "place_tag"],
  //       where: { 
  //         id: placeid,
  //         user_id: req.auth.payload.sub,
  //       },
  //     });
  //     placeData = place.dataValues;

  //     if (placeData.yelpid){
  //       try {
  //         const yelpData = await axios.get(
  //           `https://api.yelp.com/v3/businesses/${placeData.yelpid}`,
  //           {
  //             headers: {
  //               authorization: `Bearer ${yelpApiKey}`,
  //               accept: 'application/json',
  //             },
  //           },
  //         );
  //         placeData = {...placeData, ...yelpData.data};
  //         res.status(200).json({ placeData });
  //       }
  //       catch (err) {
  //         console.log(`Yelp data not found: ${err}`);
  //       }
  //     } else {
  //       res.status(200).json({ placeData });
  //     }

  //   } catch (err) {
  //     console.log(`Place data not found: ${err}`);
  //     res.status(500).json({ message: err.message });
  //   }
  // }

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
  
      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }
  
      
      let placeData = {...place.dataValues};
      
      if (placeData.yelpid) {
        try {
          const yelpData = await axios.get(
            `https://api.yelp.com/v3/businesses/${placeData.yelpid}`,
            {
              headers: {
                Authorization: `Bearer ${yelpApiKey}`,
                Accept: 'application/json',
              },
            },
          );
          placeData = { ...placeData, yelp:{...yelpData.data} };
          
        }
        catch (err) {
          console.log(`Yelp data not found: ${err}`);
        }
      }
      //console.log(placeData);
      res.status(200).json(placeData);
    }
    catch (err) {
      console.log(`Error retrieving place data: ${err}`);
      res.status(500).json({ message: "Internal server error" });
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
