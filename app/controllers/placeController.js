const { Place, Category, Tag } = require('../models');
// const assert = require('assert');
const axios = require('axios');
const { Op } = require('sequelize');
const yelpApiKey = process.env.YELP_API_KEY;
const googleApiKey = process.env.GOOGLE_API_KEY;

class placeController {

  static async getAllPlaces(req, res) {
    try {
      const places = await Place.findAll({
        include: ['place_category'],
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
          as: 'category_place',
          where: { user_id: req.auth.payload.sub },
          required: false
        }],
      });
      res.status(200).json({ categories });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getAllTags(req, res) {
    const { categorylabel } = req.headers;
    try {
      const places = await Tag.findAll({
        include: [
          {
            model: Place,
            as: 'tag_place',
            include: [
              {
                model: Category,
                as: 'place_category',
                where: { label: categorylabel }
              },
            ],
            where: {
              user_id: req.auth.payload.sub
            }
          }
        ],

      });
      console.dir(`places ${JSON.stringify(places)}`);
      res.status(200).json( places );
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getOneCategory(req, res) {
    const { categorylabel } = req.headers;
    try {
      const category = await Category.findOne({
        where: [{ label: categorylabel }],
      });
      res.status(200).json({ category });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getPlacesByCategory(req, res) {
    const { categorylabel } = req.headers;
    try {
      const places = await Place.findAll({
        include: [
          {
            model: Category,
            as: 'place_category',
            where: { label: categorylabel } // contrainte pour filtrer par catégorie
          }
        ],
        where: {
          user_id: req.auth.payload.sub,
        },
      });
      res.status(200).json({ places });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getLatestPlaces(req, res) {
    try {
      const places = await Place.findAll({
        include: ['place_category'],
        where: {
          user_id: req.auth.payload.sub,
        },
        order: [['created_at', 'DESC']],
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
        include: ['place_note', 'place_tag'],
        where: {
          id: placeid,
          user_id: req.auth.payload.sub,
        },
      });

      if (!place) {
        return res.status(404).json({ message: 'Place not found' });
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

      if (placeData.googleid) {
        const url = 'https://maps.googleapis.com/maps/api/place/details/json';
        const params = {
          place_id: placeData.googleid,
          key: googleApiKey
        };

        try {
          const googleData = await axios.get(url, {params});
          //console.log(googleData)
          placeData = { ...placeData, google:{...googleData.data.result} };
        }
        catch (err) {
          console.log(`Google data not found: ${err}`);
        }
      }

      if (placeData.google?.photos.length > 0) {
        const url = 'https://maps.googleapis.com/maps/api/place/photo';
        const params = {
          key: googleApiKey,
          maxwidth: 400,
          photoreference: placeData.google.photos[0].photo_reference
        };

        try {
          const googlePhoto = await axios.get(url, {params});
          // console.log(googlePhoto.request.res.responseUrl);
          placeData = {
            ...placeData,
            google: {
              ...placeData.google,
              google_cover: googlePhoto.request.res.responseUrl
            }
          };
        }
        catch (err) {
          console.log(`Google photo not found: ${err}`);
        }
      }
      //console.log(placeData);
      res.status(200).json(placeData);
    }
    catch (err) {
      console.log(`Error retrieving place data: ${err}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async placeFromApiByCoords(req, res) {
    try {
      const { lat, lng } = req.headers;
      const yelpData = await axios.get(
        // `https://api.yelp.com/v3/businesses/search?term=${location}&sort_by=best_match&limit=20`,
        `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lng}&sort_by=best_match&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${yelpApiKey}`,
            accept: 'application/json',
          },
        },
      );
      res.status(200).json(yelpData.data);
    }
    catch (err) {
      console.log(req.headers);
      console.log(`Yelp data not found: ${err}`);
    }
  }

  static async placeFromApiByName(req, res) {
    try {
      const { location, lat, lng } = req.headers;
      const yelpData = await axios.get(
        // `https://api.yelp.com/v3/businesses/search?term=${location}&sort_by=best_match&limit=20`,
        `https://api.yelp.com/v3/businesses/search?location=${location}&latitude=${lat}&longitude=${lng}&sort_by=distance&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${yelpApiKey}`,
            accept: 'application/json',
          },
        },
      );
      res.status(200).json(yelpData.data);
    }
    catch (err) {
      console.log(req.headers);
      console.log(`Yelp data not found: ${err}`);
    }
  }

  static async getLocationAutoComplete(req, res) {
    const { location, lat, lng } = req.headers;
    const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    const params = {
      input: location,
      types: 'restaurant',
      language: 'fr',
      location: `${lat},${lng}`,
      radius: 5000,
      key: googleApiKey
    };

    try {
      const response = await axios.get(url, {params});
      //console.log(response.data.predictions)
      res.status(200).json(response.data.predictions);
    } catch (error) {
      console.log(req.headers);
      console.log(`Google data not found: ${error}`);
    }
  }

  static async getLocationExisting(req, res) {
    const { location } = req.headers;
    try {
      const existingPlaces = await Place.findAll({
        where: {
          user_id: req.auth.payload.sub,
          [Op.or]: [
            { address: { [Op.iLike]: `%${location}%` } },
            { name: { [Op.iLike]: `%${location}%` } },
          ]
        },
        include: ['place_note'],
      });
      res.status(200).json({ existingPlaces });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getPlaceDetails(req, res) {
    const { place_id } = req.headers;
    const url = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = {
      place_id: place_id,
      key: googleApiKey
    };

    try {
      const response = await axios.get(url, {params});
      // console.log(response.data.result);
      res.status(200).json(response.data.result);
    } catch (error) {
      console.log(req.headers);
      console.log(`Google data not found: ${error}`);
    }
  }

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

  static async createPlace(req, res) {
    try {
      const { name, address, comment, cover, category_id, latitude, longitude, rating, slug, favorite, googleid } = req.body;

      const place = await Place.create({name, address,comment, cover, category_id, latitude, longitude, rating, slug, favorite, googleid,
        user_id: req.auth.payload.sub
      });

      res.status(201).json(place);
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
    }
  }


}

module.exports = placeController;
