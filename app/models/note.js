const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');
const Place = require('./place');

class Note extends Model {}

Note.init({
  name: {
    type: DataTypes.STRING(255)
  },
  price: {
    type: DataTypes.STRING(50)
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
  place_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Place,
      key: 'id',
    }
  },
}, {
  sequelize,
  tableName: 'note',
});

module.exports = Note;
