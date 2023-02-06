const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.PG_URL, {
  define: {
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  }
});

module.exports = sequelize;
