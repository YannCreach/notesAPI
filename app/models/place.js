const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');

class Place extends Model {}

Place.init({
  name: {
    type: DataTypes.STRING(255)
  },
  adress: {
    type: DataTypes.STRING(255)
  },                          
  lat: {
    type: DataTypes.DOUBLE
  },
  lng: {
    type: DataTypes.DOUBLE
  },
  cover: {
    type: DataTypes.STRING(255)
  },
  favorite: {
    type: DataTypes.BOOLEAN
  },
  opening: {
    type: DataTypes.STRING(255)
  },
  comment: {
    type: DataTypes.TEXT
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: '0',
  },
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rating: {
    type: DataTypes.INTEGER,
  },
}, {
  sequelize,
  tableName: 'place',
});

module.exports = Place;
