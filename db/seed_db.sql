BEGIN;

-- INSERT INTO public.user ("id", "username", "email", "password", "colorscheme") VALUES
-- (1, 'Yann', 'yann@notes.io', 'password', true),
-- (2, 'Jennifer', 'jenny@notes.io', 'password', false);

INSERT INTO "place" ("id", "yelpid", "user_id", "name", "adress", "city", "zip", "latitude", "longitude", "favorite", "opening", "comment", "category_id", "rating") VALUES
(1, 'le-ker-bleu-perros-guirec', 'auth0|63e218f517cae1bd6ff4d1bb', 'Le Ker Bleu', 'Adresse fictive kerbleu', 'Lannion', '22300', '21.23124', '32.34223', true, '8:00 - 19:00', 'Très bon et très original !', 2, 4),
(2, 'l-ambassade-rennes', 'auth0|63e218f517cae1bd6ff4d1bb', 'Ambassade', 'Adresse fictive Ambassade', 'Lannion', '22300', '21.23124', '32.34223', true, '8:00 - 19:00', 'Très bon et très original !', 2, 5),
(3, 'la-saint-georges-rennes', 'auth0|63e218f517cae1bd6ff4d1bb', 'La Saint Georges', 'Adresse fictive StGeorges', 'Lannion', '22300', '21.23124', '32.34223', true, '8:00 - 19:00', 'Très bon et très original !', 2, 3),
(4, 'oh-my-biche-rennes', 'auth0|63e218f517cae1bd6ff4d1bb', 'Oh My Biche', 'Adresse fictive omb', 'Lannion', '22300', '21.23124', '32.34223', true, '13:00 - 00:00', 'Très bon et très original !', 7, 5);

INSERT INTO "note" ("id", "user_id", "place_id", "name", "price", "favorite", "comment") VALUES
(1, 'auth0|63e218f517cae1bd6ff4d1bb', 1, '280', '6,50€', true, 'ultra light'),
(2, 'auth0|63e218f517cae1bd6ff4d1bb', 1, 'McWrap', '5,50€', true, 'trop bon'),
(3, 'auth0|63e218f517cae1bd6ff4d1bb', 3, 'BoxMaster', '3,50€', true, 'ultra light'),
(4, 'auth0|63e218f517cae1bd6ff4d1bb', 3, 'BoxMaster Maxx', '6,50€', false, 'ultra light aussi');

INSERT INTO "category" ("id", "label") VALUES
(1, 'Cinema'),
(2, 'Restaurant'),
(3, 'Hotel'),
(4, 'Boulangerie'),
(5, 'Musique'),
(6, 'Nature'),
(7, 'Bar'),
(8, 'Poissonnerie'),
(9, 'Primeur'),
(10, 'Coiffeur'),
(11, 'Divers');

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
