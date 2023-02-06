const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');
const User = require('./user');

class Place extends Model {}

Place.init({
  name: {
    type: DataTypes.STRING(255)
  },
  adress: {
    type: DataTypes.STRING(255)
  },                          
  coordinates: {
    type: DataTypes.STRING(50)
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
    references: {
      model: User,
      key: 'id',
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    }
  },
}, {
  sequelize,
  tableName: 'place',
});

module.exports = Place;
