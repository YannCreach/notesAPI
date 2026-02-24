import { Category } from "../models/index.js";
import Place from "../models/place.js";
import axios from "axios";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, s3Bucket } from "../s3.js";
const geoapifyApiKey = process.env.GEOAPIFY_API_KEY;
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
      const response = await axios.get("https://api.geoapify.com/v2/places", {
        params: {
          categories: "catering,entertainment,tourism",
          filter: `circle:${lng},${lat},1000`,
          bias: `proximity:${lng},${lat}`,
          limit: 5,
          lang: "fr",
          apiKey: geoapifyApiKey,
        },
      });
      res.status(200).json(response.data);
    } catch (error) {
      return next(error);
    }
  }

  static async getPlacePhoto(req, res, next) {
    const { photo_reference, maxwidth } = req.query;
    const url = "https://maps.googleapis.com/maps/api/place/photo";
    const params = {
      photo_reference,
      maxwidth: maxwidth || 800,
      key: googleApiKey,
    };

    try {
      const response = await axios.get(url, {
        params,
        responseType: "stream",
      });
      res.set("Content-Type", response.headers["content-type"]);
      res.set("Cache-Control", "public, max-age=86400");
      response.data.pipe(res);
    } catch (error) {
      return next(error);
    }
  }

  static async uploadPlacePhoto(req, res, next) {
    const { photo_reference, place_id, maxwidth } = req.body;
    const googleUrl = "https://maps.googleapis.com/maps/api/place/photo";

    try {
      const response = await axios.get(googleUrl, {
        params: {
          photo_reference,
          maxwidth: maxwidth || 800,
          key: googleApiKey,
        },
        responseType: "arraybuffer",
      });

      const contentType = response.headers["content-type"] || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : "jpg";
      const key = `place-photos/${place_id}.${ext}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: key,
          Body: Buffer.from(response.data),
          ContentType: contentType,
        }),
      );

      const url = `https://${s3Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      res.status(200).json({ url });
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
        current_opening_hours: googleData.data.result.current_opening_hours,
        formatted_address: googleData.data.result.formatted_address,
        formatted_phone_number: googleData.data.result.formatted_phone_number,
        geometry: googleData.data.result.geometry,
        place_id: googleData.data.result.place_id,
        price_level: googleData.data.result.price_level,
        rating: googleData.data.result.rating,
        types: googleData.data.result.types,
        category_id: categoryInstance?.id ?? null,
        user_ratings_total: googleData.data.result.user_ratings_total,
        website: googleData.data.result.website,
        photos: googleData.data.result.photos,
      };

      res.status(200).json(formattedData);
    } catch (error) {
      return next(error);
    }
  }
}

export default placeController;
