import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import placeController from "./controllers/placeController.js";
import socialController from "./controllers/socialController.js";
import { validate } from "./middleware/validate.js";
import {
  LocationAutoCompleteQuerySchema,
  LocationExistingQuerySchema,
  PlaceDetailsQuerySchema,
  UploadPlacePhotoSchema,
} from "./validators/places.schemas.js";
import {
  AddFriendBodySchema,
  RequestIdQuerySchema,
  FriendIdQuerySchema,
  FriendPlacesQuerySchema,
  FriendNotesQuerySchema,
} from "./validators/social.schemas.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Proxy Google Autocomplete
router.get(
  "/googleautocomplete",
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

// Proxy Google Place Details + lookup catégorie
router.get(
  "/placefromapi",
  validate(PlaceDetailsQuerySchema, "query"),
  placeController.placeFromApiById,
);

// Upload photo Google → S3
router.post(
  "/uploadplacephoto",
  validate(UploadPlacePhotoSchema, "body"),
  placeController.uploadPlacePhoto,
);

// Upload cover place → S3
router.post(
  "/uploadplacecover",
  upload.single("photo"),
  placeController.uploadPlaceCover,
);

// Upload photo memento → S3
router.post(
  "/uploadmementophoto",
  upload.single("photo"),
  placeController.uploadMementoPhoto,
);

// Changement de catégorie en masse
router.patch("/changecat", placeController.changeCategory);

// Suppression d'un memento (Supabase + S3)
router.delete("/deletememento", placeController.deleteMemento);

// Suppression d'une place avec ses mementos (Supabase + S3)
router.delete("/deleteplace", placeController.deletePlaceWithMementos);

// Suppression d'une ressource S3
router.delete("/deleteresource", placeController.deleteResource);

// --- Social ---
router.post(
  "/addfriend",
  validate(AddFriendBodySchema, "body"),
  socialController.addFriend,
);
router.get("/friends", socialController.getFriends);
router.get("/friendrequests", socialController.getFriendRequests);
router.patch(
  "/acceptfriend",
  validate(RequestIdQuerySchema, "query"),
  socialController.acceptFriend,
);
router.delete(
  "/declinefriend",
  validate(RequestIdQuerySchema, "query"),
  socialController.declineFriend,
);
router.delete(
  "/removefriend",
  validate(FriendIdQuerySchema, "query"),
  socialController.removeFriend,
);
router.get(
  "/friendplaces",
  validate(FriendPlacesQuerySchema, "query"),
  socialController.getFriendPlaces,
);
router.get(
  "/friendnotes",
  validate(FriendNotesQuerySchema, "query"),
  socialController.getFriendNotes,
);

router.get("/", (req, res) => {
  let filePath = path.join(__dirname, "../assets/index.html");
  res.sendFile(filePath);
});

export default router;
