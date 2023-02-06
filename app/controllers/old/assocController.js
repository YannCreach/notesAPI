const assert = require('assert');
const entityDefinition = require('./entityDefinition');
const entities = ['cart', 'color', 'kanban', 'list', 'role', 'status', 'tag', 'utilisateur'];
const { Cart, List, Tag } = require('../../models');

const tagAssocController = {

  createAssoc: async (req, res) => {
    const entity = req.params.entity.toLowerCase();
    assert.ok(entity, 'enter a valid entity');
    const assoc = req.params.assoc.toLowerCase();
    assert.ok(assoc, 'enter a valid entity');
    const entityId = req.params.entityId;
    assert.ok(Number(entityId), 'enter a valid entity id');
    const assocId = req.params.assocId;
    assert.ok(Number(assocId), 'enter a valid assoc id');

    const {includes} = entityDefinition.switcher(entity);
    let newAssoc;

    try {

      switch(assoc) {

      case ('tag'):
        const tag = await Tag.findByPk(assocId);

        if (entity === 'list'){
          const list = await List.findByPk(entityId, { include: includes });

          const existingTag = list.tag.find(tag => tag.id === assocId);

          if (existingTag) {
            return response.status(400).json({error: `[${assoc}][${assocId}] est déjà associé à [${entity}][${entityId}]`});
          }

          if (tag && list) {
            await list.addTag(tag);
            await list.save();
            res.json({ status: `[${assoc}][${assocId}] correctement associé à [${entity}][${entityId}]` });
          } else {
            res.status(404).json({ message: `[${assoc}][${assocId}] or [${entity}][${entityId}] not found` });
          }

        } else if (entity === 'cart') {
          const cart = await Cart.findByPk(entityId);

          if (tag && cart) {
            await Cart.addTag(tag);
            //await Cart.save();
            res.json({ status: 'ok' });
          } else {
            res.status(404).json({ message: `[${assoc}][${assocId}] or [${entity}][${entityId}] not found` });
          }
        }
        break;


      case ('color'):
        break;

      case ('status'):
        break;

      }

      res.json(newAssoc);

    } catch (error) {
      console.trace(error);
      res.status(500).json(error.toString());
    }
  },

  deleteAssoc: async (req, res) => {
    try {
      const assocId = req.params.id;
      assert.ok(Number(assocId), 'enter a valid assoc id');
      // todo create assoc model ?
      const assocToDelete = await Status.findByPk(assocId);
      await assocToDelete.destroy();

      res.json({ status: `assoc ${assocId} : correctly deleted` });

    } catch (error) {
      console.trace(error);
      res.status(500).json(error.toString());
    }
  }
};

module.exports = tagAssocController;
