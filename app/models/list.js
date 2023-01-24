const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');
const Kanban = require('./kanban');
const Status = require('./status');
const Color = require('./color');

class List extends Model {}

List.init({
  kanban_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Kanban,
      key: 'id',
    }
  },
  name: {
    type: DataTypes.TEXT
  },
  status_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: '1',
    references: {
      model: Status,
      key: 'id',
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  position: {
    type: DataTypes.INTEGER
  },
  pinned: {
    type: DataTypes.INTEGER
  },
  color_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: '1',
    references: {
      model: Color,
      key: 'id',
    }
  },
}, {
  sequelize,
  tableName: 'list',
});

module.exports = List;
