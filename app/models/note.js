const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');
const Place = require('./place');

class Note extends Model {}

Note.init({
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255)
  },
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  price: {
    type: DataTypes.STRING(50)
  },
  cover: {
    type: DataTypes.STRING(255)
  },
  option: {
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
