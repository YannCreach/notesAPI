const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');

class Status extends Model {}

Status.init({
  name: {
    type: DataTypes.TEXT
  },
}, {
  sequelize,
  tableName: 'status',
});

module.exports = Status;
