const express = require('express');
const app = express();
const router = require('./app/router');
const dotenv = require('dotenv');
var cors = require('cors');
var serverPort = process.env.SERVER_PORT

dotenv.config();

app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use(router);

app.listen(serverPort);

console.log('NotesAPI running on port ', serverPort);