const { DataTypes, Model } = require('sequelize');
const sequelize = require('../database');
// const Role = require('./role');

class User extends Model {}

User.init({
  username: {
    type: DataTypes.STRING(50)
  },
  email: {
    type: DataTypes.STRING(255)
  },                          
  password: {
    type: DataTypes.STRING(255)
  },
  picture: {
    type: DataTypes.STRING(255)
  },
  premium: {
    type: DataTypes.BOOLEAN
  },
  colorscheme: {
    type: DataTypes.BOOLEAN
  },
  // colorscheme: {
  //   type: DataTypes.INTEGER,
  //   allowNull: false,
  //   defaultValue: '2',
  //   references: {
  //     model: Role,
  //     key: 'id',
  //   }
  // },
}, {
  sequelize,
  tableName: 'user',
});

module.exports = User;
