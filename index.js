const express = require('express');
const app = express();
const { auth } = require('express-oauth2-jwt-bearer');
const router = require('./app/router');
const dotenv = require('dotenv');
var cors = require('cors');

dotenv.config();

const serverPort = process.env.SERVER_PORT;

const jwtCheck = auth({
  audience: 'https://www.yanncrea.ch/notesAPI',
  issuerBaseURL: 'https://dev-n0lb4ireiqf83cv2.eu.auth0.com/',
  tokenSigningAlg: 'RS256'
});

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use(jwtCheck);

app.get('/authorized', function (req, res) {
  res.send('Secured Resource');
});

app.use(router);

app.listen(serverPort);

console.log('Running on port ', serverPort);
