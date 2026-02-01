import assert from "assert";
import entityDefinition from "./entityDefinition.js";
const entities = [
  "cart",
  "color",
  "kanban",
  "list",
  "role",
  "status",
  "tag",
  "utilisateur",
];
// const models = require('../models');

//   const getModelFromEntity = (entity) => {
//     const modelName = entity[0].toUpperCase() + entity.slice(1, -1);
//     return models[modelName];
//   },

const factoController = {
  getAll: async (req, res) => {
    const entity = req.params.entity.toLowerCase();
    assert.ok(entities.includes(entity), "enter a valid entity");
    const { sequelizeObject, includes } = entityDefinition.switcher(entity);

    try {
      const getAllByEntity = await sequelizeObject.findAll({
        include: includes,
      });
      res.json(getAllByEntity);
    } catch (error) {
      console.trace(error);
      res.status(500).json(error.toString());
    }
  },

  getOne: async (req, res) => {
    const entity = req.params.entity.toLowerCase();
    assert.ok(entities.includes(entity), "enter a valid entity");
    const id = req.params.id;
    assert.ok(Number(id), "enter a valid id");
    const { sequelizeObject, includes } = entityDefinition.switcher(entity);

    try {
      const getOneByEntity = await sequelizeObject.findByPk(id, {
        include: includes,
      });
      res.json(getOneByEntity);
    } catch (error) {
      console.trace(error);
      res.status(500).json(error.toString());
    }
  },

  update: async (req, res) => {
    const entity = req.params.entity.toLowerCase();
    assert.ok(entities.includes(entity), "enter a valid entity");
    const id = req.params.id;
    assert.ok(Number(id), "enter a valid id");
    const { sequelizeObject, includes } = entityDefinition.switcher(entity);

    try {
      await sequelizeObject.update(req.body, { where: { id } });
      res.json(await sequelizeObject.findByPk(id, { include: includes }));
    } catch (error) {
      console.trace(error);
      res.status(500).json(error.toString());
    }
  },

  create: async (req, res) => {
    const entity = req.params.entity.toLowerCase();
    assert.ok(entities.includes(entity), "enter a valid entity");
    const { sequelizeObject, mandatory } = entityDefinition.switcher(entity);

    for (const columnName of mandatory) {
      assert.ok(columnName in req.body, `${columnName} is mandatory`);
      assert.ok(req.body[columnName], `${columnName} can't be null`);
    }

    try {
      const newEntity = await sequelizeObject.create(req.body);
      res.json(newEntity);
    } catch (error) {
      console.trace(error);
      res.status(500).json(error.toString());
    }
  },

  delete: async (req, res) => {
    const entity = req.params.entity.toLowerCase();
    assert.ok(entities.includes(entity), "enter a valid entity");
    const id = req.params.id;
    assert.ok(Number(id), "enter a valid id");
    const { sequelizeObject } = entityDefinition.switcher(entity);

    try {
      const result = await sequelizeObject.destroy({ where: { id } });
      if (result) {
        res.json({ status: `[${entity}][${id}] correctly deleted` });
      } else {
        res.json({ status: `[${entity}][${id}] doesn't exists` });
      }
    } catch (error) {
      console.trace(error);
      res.status(500).json(error.toString());
    }
  },
};

export default factoController;
