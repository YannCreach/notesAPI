import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import noteController from "./controllers/noteController.js";
import userController from "./controllers/userController.js";
import placeController from "./controllers/placeController.js";
import { validate } from "./middleware/validate.js";
import {
  GetPlaceByIdQuerySchema,
  CreatePlaceBodySchema,
  UpdatePlaceBodySchema,
  LocationExistingQuerySchema,
  LocationAutoCompleteQuerySchema,
  PlaceDetailsQuerySchema,
  PlaceCoordsQuerySchema,
  CategoryLabelQuerySchema,
  PaginationQuerySchema,
  LatestPlacesQuerySchema,
} from "./validators/places.schemas.js";
import {
  UpdateNoteBodySchema,
  NotesGetQuerySchema,
  NoteGetQuerySchema,
  UpdateNoteFavoriteBodySchema,
} from "./validators/notes.schemas.js";
import {
  AddNoteTagsBodySchema,
  RemoveNoteTagsBodySchema,
} from "./validators/notes.schemas.js";
import { UpdateColorschemeBodySchema } from "./validators/user.schemas.js";
// const uploadController = require('./controllers/uploadController');
// const { checkJwt } = require("../src/authz/check-jwt");

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Users
router.patch(
  "/user",
  validate(UpdateColorschemeBodySchema, "body"),
  userController.updateColorscheme,
);
// router.post('/user', userController.registerUser);
// router.patch('/user', userController.updateUser);
// router.delete('/user', userController.deleteUser);

// router.get("/location", placeController.getLocationAutoComplete);
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
router.get(
  "/existingautocomplete",
  validate(LocationExistingQuerySchema, "query"),
  placeController.getLocationExisting,
);
router.get(
  "/getplacedetails",
  validate(PlaceDetailsQuerySchema, "query"),
  placeController.getPlaceDetails,
);

// Places
router.get(
  "/places",
  validate(PaginationQuerySchema, "query"),
  placeController.getAllPlaces,
);
router.get(
  "/place/:id",
  validate(GetPlaceByIdQuerySchema, "params"),
  placeController.getPlaceById,
);
router.get(
  "/placefromapi",
  validate(PlaceDetailsQuerySchema, "query"),
  placeController.placeFromApiById,
);

router.get(
  "/searchcoords",
  validate(PlaceCoordsQuerySchema, "query"),
  placeController.placeFromApiByCoords,
);
router.get(
  "/latestplaces",
  validate(LatestPlacesQuerySchema, "query"),
  placeController.getLatestPlaces,
);
router.get(
  "/categories/:categorylabel/latestplaces",
  validate(CategoryLabelQuerySchema, "params"),
  validate(LatestPlacesQuerySchema, "query"),
  placeController.getLatestPlacesByCategory,
);
router.get(
  "/categories/:categorylabel",
  validate(CategoryLabelQuerySchema, "params"),
  placeController.getOneCategory,
);
router.get(
  "/categories/:categorylabel/places",
  validate(CategoryLabelQuerySchema, "params"),
  validate(PaginationQuerySchema, "query"),
  placeController.getPlacesByCategory,
);
router.post(
  "/place",
  validate(CreatePlaceBodySchema, "body"),
  placeController.createPlace,
);
router.patch(
  "/place/:id",
  validate(GetPlaceByIdQuerySchema, "params"),
  validate(UpdatePlaceBodySchema, "body"),
  placeController.updatePlace,
);
router.delete(
  "/place/:id",
  validate(GetPlaceByIdQuerySchema, "params"),
  placeController.deletePlace,
);

// Categories
router.get("/categories", placeController.getAllCategories);

// Tags
router.get(
  "/categories/:categorylabel/tags",
  validate(CategoryLabelQuerySchema, "params"),
  placeController.getAllTags,
);

// Notes
router.get(
  "/places/:id/notes",
  validate(GetPlaceByIdQuerySchema, "params"),
  validate(PaginationQuerySchema, "query"),
  noteController.getAllNotes,
);
router.get(
  "/notes/:id",
  validate(NoteGetQuerySchema, "params"),
  noteController.getNoteById,
);
router.patch(
  "/notes/:id",
  validate(NoteGetQuerySchema, "params"),
  validate(UpdateNoteFavoriteBodySchema, "body"),
  noteController.updateNote,
);

router.post(
  "/notes/:id/tags",
  validate(NoteGetQuerySchema, "params"),
  validate(AddNoteTagsBodySchema, "body"),
  noteController.addTags,
);

router.get(
  "/notes/:id/tags",
  validate(NoteGetQuerySchema, "params"),
  noteController.getTags,
);

router.delete(
  "/notes/:id/tags",
  validate(NoteGetQuerySchema, "params"),
  validate(RemoveNoteTagsBodySchema, "body"),
  noteController.removeTags,
);

router.get("/", (req, res) => {
  let filePath = path.join(__dirname, "../index.html");
  res.sendFile(filePath);
});

// Upload
// router.post('/upload', authMiddleware.checkToken, controllerUpload.uploadImage);

export default router;
