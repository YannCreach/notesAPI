import { Category } from "../models/index.js";
import Place from "../models/place.js";
import axios from "axios";
import { randomUUID } from "crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, s3Bucket } from "../s3.js";
const geoapifyApiKey = process.env.GEOAPIFY_API_KEY;
const googleApiKey = process.env.GOOGLE_API_KEY;

async function deleteS3FromUrl(url) {
  const bucketPrefix = `https://${s3Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
  if (!url || !url.startsWith(bucketPrefix)) return;
  const key = url.slice(bucketPrefix.length);
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: s3Bucket, Key: key }),
  );
}

class placeController {
  static async getLocationAutoComplete(req, res, next) {
    const { location, lat, lng, types } = req.query;
    const url = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
    const params = {
      input: location,
      types: types,
      fields: ["structured_formatting", "place_id"],
      language: "fr",
      key: googleApiKey,
    };
    if (lat && lng) {
      params.location = `${lat},${lng}`;
      params.radius = 5000;
    }

    try {
      const response = await axios.get(url, { params });
      console.log("Google Autocomplete API response:", response.data);

      const detailsUrl =
        "https://maps.googleapis.com/maps/api/place/details/json";
      const formattedPredictions = await Promise.all(
        response.data.predictions.map(async (prediction) => {
          const { main_text, secondary_text, main_text_matched_substrings } =
            prediction.structured_formatting;

          const detailsResponse = await axios.get(detailsUrl, {
            params: {
              place_id: prediction.place_id,
              fields: "geometry/location",
              key: googleApiKey,
            },
          });
          const location =
            detailsResponse.data.result?.geometry?.location ?? null;

          return {
            main_text,
            secondary_text,
            place_id: prediction.place_id,
            main_text_matched_substrings,
            location,
          };
        }),
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
    const { photo_reference, maxwidth } = req.body;
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

      const userId = req.auth.payload.sub;
      const contentType = response.headers["content-type"] || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : "jpg";
      const key = `place-photos/${randomUUID()}_${userId}.${ext}`;

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

  static async uploadPlaceCover(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const userId = req.auth.payload.sub;
      const ext = req.file.mimetype.includes("png") ? "png" : "jpg";
      const key = `place-covers/${randomUUID()}_${userId}.${ext}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        }),
      );

      const url = `https://${s3Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      res.status(200).json({ url });
    } catch (error) {
      return next(error);
    }
  }

  static async uploadMementoPhoto(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const userId = req.auth.payload.sub;
      const ext = req.file.mimetype.includes("png") ? "png" : "jpg";
      const key = `memento-photos/${randomUUID()}_${userId}.${ext}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        }),
      );

      const url = `https://${s3Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      res.status(200).json({ url });
    } catch (error) {
      return next(error);
    }
  }

  static async deleteResource(req, res, next) {
    try {
      const { url } = req.query;
      const userId = req.auth.payload.sub;

      const bucketPrefix = `https://${s3Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
      if (!url.startsWith(bucketPrefix)) {
        return res.status(400).json({ error: "Invalid resource URL" });
      }

      const key = url.slice(bucketPrefix.length);
      const filename = key.split("/").pop();
      const nameWithoutExt = filename.replace(/\.[^.]+$/, "");
      const ownerUserId = nameWithoutExt.split("_").slice(1).join("_");

      if (ownerUserId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3Bucket,
          Key: key,
        }),
      );

      res.status(200).json({ deleted: true });
    } catch (error) {
      return next(error);
    }
  }

  static async deleteMemento(req, res, next) {
    try {
      const userId = req.auth.payload.sub;
      const { id } = req.query;

      const memento = await Place.findMementoById(userId, id);
      if (!memento) {
        return res.status(404).json({ error: "Memento not found" });
      }

      await deleteS3FromUrl(memento.cover);
      await Place.deleteMemento(userId, id);

      res.status(200).json({ deleted: true });
    } catch (error) {
      return next(error);
    }
  }

  static async deletePlaceWithMementos(req, res, next) {
    try {
      const userId = req.auth.payload.sub;
      const { id } = req.query;

      const place = await Place.findPlaceWithMementos(userId, id);
      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }

      const s3Deletions = (place.place_note || [])
        .map((note) => deleteS3FromUrl(note.cover));
      s3Deletions.push(deleteS3FromUrl(place.cover));
      await Promise.all(s3Deletions);

      await Place.deletePlace(userId, id);

      res.status(200).json({ deleted: true });
    } catch (error) {
      return next(error);
    }
  }

  static async changeCategory(req, res, next) {
    try {
      const userId = req.auth.payload.sub;
      const { oldCatId, newCatId } = req.query;

      const updated = await Place.updateCategory(userId, oldCatId, newCatId);
      res.status(200).json({ updated: updated.length });
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
