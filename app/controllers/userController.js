const { User } = require('../models');
const assert = require('assert');


class userController {

  static async loginUser(req, res) {
    assert.ok('id' in req.body, 'A user ID is required');
    try {
      const { id } = req.body;
      const user = await User.findByPk(id);
      if (user) {
        res.status(200).json({ user });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
    }
  }

  static async registerUser(req, res) {
    try {
      const { name, email } = req.body;
      const user = await User.create({ name, email });
      res.status(201).json({ user });
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;
      const [updated] = await User.update({ name, email }, { where: { id } });
      if (updated) {
        const updatedUser = await User.findByPk(id);
        res.status(200).json({ user: updatedUser });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deleted = await User.destroy({ where: { id } });
      if (deleted) {
        res.status(204).json();
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = userController;
