const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');
const Utilisateur = require('./utilisateur');

class Kanban extends Model {}

Kanban.init({
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Utilisateur,
      key: 'id',
    }
  },
  name: {
    type: DataTypes.TEXT
  },
  description: {
    type: DataTypes.TEXT
  },
}, {
  sequelize,
  tableName: 'kanban',
});

module.exports = Kanban;
