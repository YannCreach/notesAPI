const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');
const Role = require('./role');

class Utilisateur extends Model {}

Utilisateur.init({
  firstname: {
    type: DataTypes.TEXT
  },
  lastname: {
    type: DataTypes.TEXT
  },
  email: {
    type: DataTypes.TEXT
  },
  password: {
    type: DataTypes.TEXT
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: '2',
    references: {
      model: Role,
      key: 'id',
    }
  },
}, {
  sequelize,
  tableName: 'utilisateur',
});

module.exports = Utilisateur;
