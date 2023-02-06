BEGIN;

INSERT INTO public.user ("id", "username", "email", "password", "colorscheme") VALUES
(1, 'Yann', 'yann@notes.io', 'password', true),
(2, 'Jennifer', 'jenny@notes.io', 'password', false);

INSERT INTO "place" ("id", "user_id", "name", "adress", "coordinates", "favorite", "opening", "comment", "category_id") VALUES
(1, 1,'Mc Donalds', 'lannion', '21.23124 - 32.34223', true, '8:00 - 19:00', 'Très bon et très original !', 1),
(2, 1,'Basilico', 'Perros', '21.23124 - 32.34223', true, '8:00 - 19:00', 'Très bon et très original !', 1),
(3, 1,'KFC', 'Plerin', '21.23124 - 32.34223', true, '8:00 - 19:00', 'Très bon et très original !', 1),
(4, 1,'Atmosphere', 'Lannion', '21.23124 - 32.34223', true, '13:00 - 00:00', 'Très bon et très original !', 2);

INSERT INTO "note" ("id", "place_id", "name", "price", "favorite", "comment") VALUES
(1, 1, '280', '6,50€', true, 'ultra light'),
(2, 1, 'McWrap', '5,50€', true, 'trop bon'),
(3, 3, 'BoxMaster', '3,50€', true, 'ultra light'),
(4, 3, 'BoxMaster Maxx', '6,50€', false, 'ultra light aussi');

INSERT INTO "category" ("id", "label") VALUES
(1, 'Place'),
(2, 'Bar'),
(3, 'Cinema');

INSERT INTO "tag" ("id", "label") VALUES
(1, 'Top'), 
(2, 'Bof'),
(3, 'Nul');

INSERT INTO "place_has_tag" ("place_id", "tag_id") VALUES
(1, 1),
(1, 2),
(2, 3),
(3, 1),
(3, 2),
(3, 3);

INSERT INTO "note_has_tag" ("note_id", "tag_id") VALUES
(1, 1),
(1, 2),
(2, 3),
(3, 1),
(3, 2),
(3, 3);

COMMIT;
