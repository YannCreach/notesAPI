import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import placeController from "./controllers/placeController.js";
import { validate } from "./middleware/validate.js";
import {
  LocationAutoCompleteQuerySchema,
  LocationExistingQuerySchema,
  PlaceDetailsQuerySchema,
  PlaceCoordsQuerySchema,
} from "./validators/places.schemas.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Proxy Google Autocomplete
router.get(
  "/googleautocomplete",
  validate(LocationAutoCompleteQuerySchema, "query"),
  placeController.getLocationAutoComplete,
);
router.get(
  "/yelpautocomplete",
  validate(LocationAutoCompleteQuerySchema, "query"),
  placeController.getLocationAutoComplete,
);

// Recherche dans les lieux existants (DB)
router.get(
  "/existingautocomplete",
  validate(LocationExistingQuerySchema, "query"),
  placeController.getLocationExisting,
);

// Proxy Google Place Details
router.get(
  "/getplacedetails",
  validate(PlaceDetailsQuerySchema, "query"),
  placeController.getPlaceDetails,
);

// Proxy Yelp par coordonnées
router.get(
  "/searchcoords",
  validate(PlaceCoordsQuerySchema, "query"),
  placeController.placeFromApiByCoords,
);

// Proxy Google Place Details + lookup catégorie
router.get(
  "/placefromapi",
  validate(PlaceDetailsQuerySchema, "query"),
  placeController.placeFromApiById,
);

router.get("/", (req, res) => {
  let filePath = path.join(__dirname, "../assets/index.html");
  res.sendFile(filePath);
});

export default router;
