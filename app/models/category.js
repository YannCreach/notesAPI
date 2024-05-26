const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');

class Category extends Model {}

Category.init({
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  label: {
    type: DataTypes.STRING(255)
  },
  label_fr: {
    type: DataTypes.STRING(255)
  },
  label_en: {
    type: DataTypes.STRING(255)
  },
}, {
  sequelize,
  tableName: 'category',
});

module.exports = Category;
