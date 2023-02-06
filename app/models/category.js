const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');

class Category extends Model {}

Category.init({
  label: {
    type: DataTypes.STRING(255)
  },
}, {
  sequelize,
  tableName: 'category',
});

module.exports = Category;
