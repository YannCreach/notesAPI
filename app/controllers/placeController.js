import { Category } from "../models/index.js";
import Place from "../models/place.js";
import axios from "axios";
const yelpApiKey = process.env.YELP_API_KEY;
const googleApiKey = process.env.GOOGLE_API_KEY;

class placeController {
  static async getLocationAutoComplete(req, res, next) {
    const { location, lat, lng, types } = req.query;
    const url = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
    const params = {
      input: location,
      types: types,
      fields: ["structured_formatting", "place_id"],
      language: "fr",
      location: `${lat},${lng}`,
      radius: 5000,
      key: googleApiKey,
    };

    try {
      const response = await axios.get(url, { params });
      const formattedPredictions = response.data.predictions.map(
        (prediction) => {
          const { main_text, secondary_text, main_text_matched_substrings } =
            prediction.structured_formatting;
          return {
            main_text,
            secondary_text,
            place_id: prediction.place_id,
            main_text_matched_substrings,
          };
        },
      );
      res.status(200).json(formattedPredictions);
    } catch (error) {
      return next(error);
    }
  }

  static async getLocationExisting(req, res, next) {
    const { location } = req.query;
    try {
      const existingPlaces = await Place.findExistingByLocation(
        req.auth.payload.sub,
        location,
      );
      res.status(200).json({ existingPlaces });
    } catch (error) {
      return next(error);
    }
  }

  static async getPlaceDetails(req, res, next) {
    const { place_id } = req.query;
    const url = "https://maps.googleapis.com/maps/api/place/details/json";
    const params = {
      place_id: place_id,
      key: googleApiKey,
    };

    try {
      const response = await axios.get(url, { params });
      res.status(200).json(response.data.result);
    } catch (error) {
      return next(error);
    }
  }

  static async placeFromApiByCoords(req, res, next) {
    try {
      const { lat, lng } = req.query;
      const yelpData = await axios.get(
        `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lng}&sort_by=best_match&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${yelpApiKey}`,
            accept: "application/json",
          },
        },
      );
      res.status(200).json(yelpData.data);
    } catch (error) {
      return next(error);
    }
  }

  static async placeFromApiById(req, res, next) {
    const place_id = req.query.place_id;
    const url = "https://maps.googleapis.com/maps/api/place/details/json";
    const params = {
      place_id: place_id,
      key: googleApiKey,
      language: "fr",
    };

    try {
      const googleData = await axios.get(url, { params });

      const categoryName = googleData.data.result.types[0];
      const formattedCategoryName =
        categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
      const categoryInstance = await Category.findOneByLabel(
        req.auth.payload.sub,
        formattedCategoryName,
      );

      const formattedData = {
        name: googleData.data.result.name,
        current_opening_hours: googleData.data.result.opening_hours,
        formatted_address: googleData.data.result.formatted_address,
        formatted_phone_number: googleData.data.result.formatted_phone_number,
        geometry: googleData.data.result.geometry,
        place_id: googleData.data.result.place_id,
        price_level: googleData.data.result.price_level,
        rating: googleData.data.result.rating,
        types: googleData.data.result.types,
        category_id: categoryInstance.id,
        user_ratings_total: googleData.data.result.user_ratings_total,
        website: googleData.data.result.website,
        google_cover: googleData.data.result.google_cover,
      };

      res.status(200).json(formattedData);
    } catch (error) {
      return next(error);
    }
  }
}

export default placeController;
