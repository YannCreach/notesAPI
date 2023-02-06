const express = require('express');
const path = require('path');
const noteController = require('./controllers/noteController')
// const userController = require('./controllers/userController');
const placeController = require('./controllers/placeController');
// const uploadController = require('./controllers/uploadController');
// const { checkJwt } = require("../src/authz/check-jwt");

const router = express.Router();



// Users
// router.get('/user', userController.loginUser);
// router.post('/user', userController.registerUser);
// router.patch('/user', userController.updateUser);
// router.delete('/user', userController.deleteUser);

// Places
router.get('/places', placeController.getAllPlaces);
router.get('/place', placeController.getPlaceById);
// router.post('/place', placeController.createPlace);
// router.patch('/place', placeController.updatePlace);
// router.delete('/place', placeController.deletePlace);

// Notes
router.get('/notes', noteController.getAllNotes);
router.get('/note', noteController.getNoteById);
// router.post('/note', noteController.createNote);
// router.patch('/note', noteController.updateNote);
// router.delete('/note', noteController.deleteNote);

router.get('/', (req, res) => {
	let filePath = path.join(__dirname, '../index.html');
	res.sendFile(filePath);
});

// Upload
// router.post('/upload', authMiddleware.checkToken, controllerUpload.uploadImage);


module.exports = router;
