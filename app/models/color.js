const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');

class Color extends Model {}

Color.init({
  name: {
    type: DataTypes.TEXT
  },
}, {
  sequelize,
  tableName: 'color',
});

module.exports = Color;
