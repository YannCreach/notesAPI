// const express = require('express');
// var cors = require('cors');
// const helmet = require("helmet");
// const { clientOrigins, serverPort } = require("./src/config/env.dev");
// const router = require('./app/router');
// const app = express();

// app.use(express.urlencoded({ extended: true }));
// app.use(helmet());
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// app.use(router);

// app.use(function (err, req, res, next) {
//   console.log(err);
//   res.status(500).send(err.message);
// });

// app.listen(serverPort, () => {
//   console.log(`NotesAPI running on ${serverPort}`);
// });

const express = require('express');
const app = express();
const { auth } = require('express-oauth2-jwt-bearer');
const router = require('./app/router');
const dotenv = require('dotenv');
var cors = require('cors');
const placeController = require('./app/controllers/placeController');

dotenv.config();
const audience = process.env.AUTH0_AUDIENCE;
const domain = process.env.AUTH0_DOMAIN;
const serverPort = process.env.SERVER_PORT;
const clientOriginUrl = process.env.CLIENT_ORIGIN_URL;

const jwtCheck = auth({
  audience: 'https://www.yanncrea.ch/notesAPI',
  issuerBaseURL: 'https://dev-n0lb4ireiqf83cv2.eu.auth0.com/',
  tokenSigningAlg: 'RS256'
});

app.use(cors({ origin: "*" }));
app.use(express.json());

// enforce on all endpoints
app.use(jwtCheck);


app.get('/authorized', function (req, res) {
    res.send('Secured Resource');
});

app.get('/places', placeController.getAllPlaces);

// app.use(router);

app.listen(serverPort);

console.log('Running on port ', serverPort);