const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');

class Tag extends Model {}

Tag.init({
  label: {
    type: DataTypes.STRING(255)
  },
}, {
  sequelize,
  tableName: 'tag',
});

module.exports = Tag;
