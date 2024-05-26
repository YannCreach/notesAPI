const { Cart, Color, Kanban, List, Role, Status, Tag, Utilisateur } = require('../models');
let sequelizeObject, includes, mandatory;

const entityDefinition = {

  switcher(entityName) {

    switch (entityName) {
    case 'cart':
      sequelizeObject = Cart;
      includes = ['tag', 'cart_color', 'cart_status'];
      mandatory = ['name', 'list_id'];
      break;

    case 'color':
      sequelizeObject = Color;
      includes = ['color_list', 'color_cart'];
      mandatory = ['name'];
      break;

    case 'kanban':
      sequelizeObject = Kanban;
      includes = ['kanban_owner'];
      mandatory = ['owner_id', 'name'];
      break;


    case 'list':
      sequelizeObject = List;
      includes = ['tag', 'list_color', 'list_status', 'list_cart', {model: Cart, as: 'list_cart', include: ['tag', 'cart_color', 'cart_status']}];
      mandatory = ['kanban_id', 'name'];
      break;

    case 'role':
      sequelizeObject = Role;
      includes = ['kanban_owner'];
      mandatory = ['name'];
      break;

    case 'status':
      sequelizeObject = Status;
      includes = ['status_list', 'status_cart'];
      mandatory = ['name'];
      break;

    case 'tag':
      sequelizeObject = Tag;
      includes = ['list', 'cart'];
      mandatory = ['name'];
      break;

    case 'utilisateur':
      sequelizeObject = Utilisateur;
      includes = ['utilisateur_role', 'utilisateur_kanban'];
      mandatory = ['firstname', 'lastname', 'email', 'password'];
      break;

    }

    return {sequelizeObject, includes, mandatory};

  },


};

module.exports = entityDefinition;
