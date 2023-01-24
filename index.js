require('dotenv').config();
const express = require('express');
var cors = require('cors');
const router = require('./app/router');

const app = express();
app.use(cors())
//app.set('view engine', 'ejs');
//app.set('views', './app/views');
app.use(express.static('./assets'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // decode le req.body qui est recu en format json

app.use(router);

app.listen(3000, () => {
  console.log('Serveur en place sur http://localhost:3000');
});
