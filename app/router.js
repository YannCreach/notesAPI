const express = require("express");
const path = require("path");
const noteController = require("./controllers/noteController");
const userController = require("./controllers/userController");
const placeController = require("./controllers/placeController");
// const uploadController = require('./controllers/uploadController');
// const { checkJwt } = require("../src/authz/check-jwt");

const router = express.Router();

// Users
router.patch("/user", userController.updateColorscheme);
// router.post('/user', userController.registerUser);
// router.patch('/user', userController.updateUser);
// router.delete('/user', userController.deleteUser);

// router.get("/location", placeController.getLocationAutoComplete);
router.get("/googleautocomplete", placeController.getLocationAutoComplete);
router.get("/yelpautocomplete", placeController.getLocationAutoComplete);
router.get("/existingautocomplete", placeController.getLocationExisting);
router.get("/getplacedetails", placeController.getPlaceDetails);


// Places
router.get("/places", placeController.getAllPlaces);
router.get("/place", placeController.getPlaceById);
router.get("/placefromapi", placeController.placeFromApiById);

router.get("/searchcoords", placeController.placeFromApiByCoords);
router.get("/latestplaces", placeController.getLatestPlaces);
router.get("/latestplacesbycategory", placeController.getLatestPlacesByCategory);
router.get("/category", placeController.getOneCategory);
router.get("/placesbycategory", placeController.getPlacesByCategory);
router.post("/place", placeController.createPlace);
router.patch("/place", placeController.updatePlace);
router.delete("/place", placeController.deletePlace);

// Categories
router.get("/categories", placeController.getAllCategories);

// Tags
router.get("/tags", placeController.getAllTags);

// Notes
router.get("/notes", noteController.getAllNotes);
router.get("/note", noteController.getNoteById);
// router.post('/note', noteController.createNote);
router.patch("/note", noteController.updateNote);
// router.delete('/note', noteController.deleteNote);

router.get("/", (req, res) => {
  let filePath = path.join(__dirname, "../index.html");
  res.sendFile(filePath);
});

// Upload
// router.post('/upload', authMiddleware.checkToken, controllerUpload.uploadImage);


module.exports = router;