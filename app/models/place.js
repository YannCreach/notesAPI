const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');

class Place extends Model {}

Place.init({
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255)
  },
  address: {
    type: DataTypes.STRING(255)
  },
  // street_number: {
  //   type: DataTypes.STRING(10)
  // },
  // route: {
  //   type: DataTypes.STRING(255)
  // },
  // city: {
  //   type: DataTypes.STRING(50)
  // },
  // zip: {
  //   type: DataTypes.INTEGER
  // },
  latitude: {
    type: DataTypes.DOUBLE
  },
  longitude: {
    type: DataTypes.DOUBLE
  },
  cover: {
    type: DataTypes.STRING(255)
  },
  favorite: {
    type: DataTypes.BOOLEAN
  },
  comment: {
    type: DataTypes.TEXT
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rating: {
    type: DataTypes.INTEGER,
  },
  slug: {
    type: DataTypes.STRING(255),
  },
  googleid: {
    type: DataTypes.STRING(50),
  },
  yelpid: {
    type: DataTypes.STRING(50),
  },
}, {
  sequelize,
  tableName: 'place',
});

module.exports = Place;
