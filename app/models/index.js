const Place = require('./place');
const Note = require('./note');
const Category = require('./category');
const Tag = require('./tag');


// 1:N oneToMany on utilise la méthode hasMany
// N:1 ManyToOne on utilise la méthode belongsTo
// 1:1 oneToOne on utilise la méthode belongsTo
// N:N manyToMany on utilise la méthode belongsToMany
// To create a One-To-One relationship, the hasOne and belongsTo associations are used together;
// To create a One-To-Many relationship, the hasMany and belongsTo associations are used together;
// To create a Many-To-Many relationship, two belongsToMany calls are used together.


Place.hasMany(Note, { // a place has Many notes
  foreignKey: 'place_id',
  as: 'place_note'
});
Note.belongsTo(Place, { // a note has One place
  foreignKey: 'place_id',
  as: 'note_place'
});


// Place.belongsToMany(Tag, { // a place has Many tags
//   as: 'place_tag',
//   through: 'place_has_tag',
//   foreignKey: 'place_id',
//   otherKey: 'tag_id',
//   timestamps: false
// });
// Tag.belongsToMany(Place, { // a tag has many places
//   as: 'tag_place',
//   through: 'place_has_tag',
//   otherKey: 'tag_id',
//   foreignKey: 'place_id',
//   timestamps: false
// });
Place.belongsToMany(Tag, { through: 'place_has_tag' });
Tag.belongsToMany(Place, { through: 'place_has_tag' });

Place.belongsTo(Category, { // a place has One category
  foreignKey: 'category_id',
  as: 'place_category'
});
Category.hasMany(Place, { // a category has many place
  foreignKey: 'category_id',
  as: 'category_place'
});


// Note.belongsToMany(Tag, { // a note has Many tags
//   as: 'note_tag',
//   through: 'note_has_tag',
//   foreignKey: 'note_id',
//   otherKey: 'tag_id',
//   timestamps: false
// });
// Tag.belongsToMany(Note, { // a tag has many note
//   as: 'tag_note',
//   through: 'note_has_tag',
//   otherKey: 'tag_id',
//   foreignKey: 'note_id',
//   timestamps: false
// });

Note.belongsToMany(Tag, { through: 'note_has_tag' });
Tag.belongsToMany(Note, { through: 'note_has_tag' });

module.exports = { Place, Note, Category, Tag };
