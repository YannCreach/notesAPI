BEGIN;

-- INSERT INTO public.user ("id", "username", "email", "password", "colorscheme") VALUES
-- (1, 'Yann', 'yann@notes.io', 'password', true),
-- (2, 'Jennifer', 'jenny@notes.io', 'password', false);

-- INSERT INTO "place" ("id", "slug", "yelpid", "googleid", "user_id", "name", "address", "city", "zip", "latitude", "longitude", "favorite", "comment", "category_id", "rating") VALUES
-- (1, 'le-ker-bleu-perros-guirec', 'le-ker-bleu-perros-guirec', 'ChIJ28qzC-MtEkgRAPJyi6lyUG4', 'auth0|63e218f517cae1bd6ff4d1bb', 'Le Ker Bleu', 'Adresse fictive kerbleu', 'Lannion', '22300', '21.23124', '32.34223', true, 'Très bon et très original !', 2, 4),
-- (2, 'l-ambassade-rennes','l-ambassade-rennes', null, 'auth0|63e218f517cae1bd6ff4d1bb', 'Ambassade', 'Adresse fictive Ambassade', 'Lannion', '22300', '21.23124', '32.34223', true, 'Très bon et très original !', 2, 5),
-- (3, 'la-saint-georges-rennes', 'la-saint-georges-rennes', null, 'auth0|63e218f517cae1bd6ff4d1bb', 'La Saint Georges', 'Adresse fictive StGeorges', 'Lannion', '22300', '21.23124', '32.34223', true, 'Très bon et très original !', 2, 3),
-- (4, 'oh-my-biche-rennes', 'oh-my-biche-rennes',null, 'auth0|63e218f517cae1bd6ff4d1bb', 'Oh My Biche', 'Adresse fictive omb', 'Lannion', '22300', '21.23124', '32.34223', true, 'Très bon et très original !', 7, 5);

-- INSERT INTO "note" ("id", "user_id", "place_id", "name", "option", "price", "favorite", "comment") VALUES
-- (1, 'auth0|63e218f517cae1bd6ff4d1bb', 1, '280', 'frites icetea', '6,50€', true, 'ultra light'),
-- (2, 'auth0|63e218f517cae1bd6ff4d1bb', 1, 'McWrap', 'frites icetea', '5,50€', true, 'trop bon'),
-- (3, 'auth0|63e218f517cae1bd6ff4d1bb', 3, 'BoxMaster', '', '3,50€', true, 'ultra light'),
-- (4, 'auth0|63e218f517cae1bd6ff4d1bb', 3, 'BoxMaster Maxx', 'a point', '6,50€', false, 'ultra light aussi');

INSERT INTO "category" ("id", "label", "label_fr", "label_en") VALUES
(1, 'Cinema', 'un Cinema', 'a Cinema'),
(2, 'Restaurant', 'un Restaurant', 'a Restaurant'),
(3, 'Hotel', 'un Hotel', 'a Hotel'),
(4, 'Boulangerie', 'une Boulangerie', 'a Bakery'),
(5, 'Musique', 'une Musique', 'a Music'),
(6, 'Nature', 'un Espace naturel', 'a Natural area'),
(7, 'Bar', 'un Bar', 'a Bar'),
(8, 'Poissonnerie', 'une Poissonnerie', 'a Fish market'),
(9, 'Primeur', 'un Primeur', 'a Greengrocer'),
(10, 'Coiffeur', 'un Coiffeur', 'a Hairdresser'),
(11, 'Divers', 'un Divers', 'a Misc');

-- INSERT INTO "tag" ("id", "label") VALUES
-- (1, 'Top'), 
-- (2, 'Bof'),
-- (3, 'Nul');

-- INSERT INTO "place_has_tag" ("place_id", "tag_id") VALUES
-- (1, 1),
-- (1, 2),
-- (2, 3),
-- (3, 1),
-- (3, 2),
-- (3, 3);

-- INSERT INTO "note_has_tag" ("note_id", "tag_id") VALUES
-- (1, 1),
-- (1, 2),
-- (2, 3),
-- (3, 1),
-- (3, 2),
-- (3, 3);

COMMIT;
