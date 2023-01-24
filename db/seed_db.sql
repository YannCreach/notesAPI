--
-- Base de données :  "okanban"
--

BEGIN;

-- On est obligé de supprimer la clé étrangère "bonne réponse" lors de l'ajout des données, car les tables "answer" et "question" sont liées dans les 2 sens
/*ALTER TABLE "answer"
  DROP CONSTRAINT answer_question_id_fkey;*/


INSERT INTO "role" ("id", "name") VALUES
(1, 'admin'),
(2, 'member');


INSERT INTO "utilisateur" ("id", "firstname", "lastname", "email", "password", "role_id") VALUES
(1, 'Yann', 'Creach', 'yc@test.com', 'test', 1),
(2, 'Jennifer', 'Creach', 'jc@test.com', 'test', 2);


INSERT INTO "color" ("id", "name") VALUES
(1, 'red'),
(2, 'orange'),
(3, 'yellow');


INSERT INTO "status" ("id", "name") VALUES
(1, 'pending'),
(2, 'finished'),
(3, 'postponed');


INSERT INTO "tag" ("id", "name") VALUES
(1, 'dev'),
(2, 'tech'),
(3, 'marketing');


INSERT INTO "kanban" ("id", "owner_id", "name", "description") VALUES
(1, 1, 'premier kanban', 'bon cest un premier jet, cest du vite fait'),
(2, 2, 'deuxieme kanban', 'real business here !');


INSERT INTO "list" ("id", "kanban_id", "name", "status_id", "description", "position", "pinned", "color_id") VALUES
(1, 1, 'kanban 1 list 1', 1, 'description k1l1', 1, 0, 1),
(2, 1, 'kanban 1 list 2', 2, 'description k1l2', 2, 1, 2),
(3, 2, 'kanban 2 list 1', 3, 'description k2l1', 2, 1, 3),
(4, 2, 'kanban 2 list 2', 2, 'description k2l2', 1, 0, 1);


INSERT INTO "cart" ("id", "name", "position", "deadline", "description", "attachment", "pinned", "list_id", "status_id", "color_id") VALUES
(1, 'mcd', 1, now(), 'description mcd', '', 0, 1, 1, 1),
(2, 'mld', 2, now(), 'description mld', '', 1, 1, 2, 2),
(3, 'mlp', 4, now(), 'description mlp', '', 0, 2, 2, 1),
(4, 'bdd', 3, now(), 'description bdd', '', 0, 2, 1, 3),
(5, 'mcd2', 1, now(), 'description mcd2', '', 0, 3, 1, 1),
(6, 'mld2', 2, now(), 'description mld2', '', 1, 3, 2, 2),
(7, 'mlp2', 4, now(), 'description mlp2', '', 0, 4, 2, 1),
(8, 'bdd2', 3, now(), 'description bdd2', '', 0, 4, 1, 3);


INSERT INTO "cart_has_collab" ("utilisateur_id", "cart_id") VALUES
(1, 1),
(1, 3),
(2, 3),
(2, 4),
(2, 5);

INSERT INTO "cart_has_tag" ("cart_id", "tag_id") VALUES
(1, 1),
(2, 2),
(2, 3),
(3, 3),
(5, 3);


INSERT INTO "kanban_has_collab" ("kanban_id", "utilisateur_id") VALUES
(1, 1),
(1, 2);


INSERT INTO "list_has_tag" ("list_id", "tag_id") VALUES
(1, 1),
(2, 2),
(2, 3),
(3, 3),
(4, 3);



/* FOREIGN KEYS */
ALTER TABLE "utilisateur" ADD FOREIGN KEY ("role_id") REFERENCES "role" ("id") ON DELETE CASCADE;
ALTER TABLE "cart_has_collab" ADD FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur" ("id") ON DELETE CASCADE;
ALTER TABLE "cart_has_collab" ADD FOREIGN KEY ("cart_id") REFERENCES "cart" ("id") ON DELETE CASCADE;
ALTER TABLE "cart_has_tag" ADD FOREIGN KEY ("tag_id") REFERENCES "tag" ("id") ON DELETE CASCADE;
ALTER TABLE "cart_has_tag" ADD FOREIGN KEY ("cart_id") REFERENCES "cart" ("id") ON DELETE CASCADE;
ALTER TABLE "kanban" ADD FOREIGN KEY ("owner_id") REFERENCES "utilisateur" ("id") ON DELETE CASCADE;
ALTER TABLE "kanban_has_collab" ADD FOREIGN KEY ("kanban_id") REFERENCES "kanban" ("id") ON DELETE CASCADE;
ALTER TABLE "kanban_has_collab" ADD FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur" ("id") ON DELETE CASCADE;
ALTER TABLE "list" ADD FOREIGN KEY ("kanban_id") REFERENCES "kanban" ("id") ON DELETE CASCADE;
ALTER TABLE "list" ADD FOREIGN KEY ("status_id") REFERENCES "status" ("id") ON DELETE CASCADE;
ALTER TABLE "list" ADD FOREIGN KEY ("color_id") REFERENCES "color" ("id") ON DELETE CASCADE;
ALTER TABLE "list_has_tag" ADD FOREIGN KEY ("list_id") REFERENCES "list" ("id") ON DELETE CASCADE;
ALTER TABLE "list_has_tag" ADD FOREIGN KEY ("tag_id") REFERENCES "tag" ("id") ON DELETE CASCADE;
ALTER TABLE "utilisateur" ADD FOREIGN KEY ("role_id") REFERENCES "role" ("id") ON DELETE CASCADE;

COMMIT;

BEGIN;

--
-- PostGres avec le type serial n'incrémente pas automatiquement de façon implicite la séquence rattaché à la colonne !
-- Il faut donc mettre à jour la valeur courante de chacune des séquences en séléctionnant l'id maximum de chaque table
--
SELECT setval('cart_id_seq', (SELECT MAX(id) from "cart"));
SELECT setval('cart_has_collab_id_seq', (SELECT MAX(id) from "cart_has_collab"));
SELECT setval('cart_has_tag_id_seq', (SELECT MAX(id) from "cart_has_tag"));
SELECT setval('color_id_seq', (SELECT MAX(id) from "color"));
SELECT setval('kanban_id_seq', (SELECT MAX(id) from "kanban"));
SELECT setval('kanban_has_collab_id_seq', (SELECT MAX(id) from "kanban_has_collab"));
SELECT setval('list_id_seq', (SELECT MAX(id) from "list"));
SELECT setval('list_has_tag_id_seq', (SELECT MAX(id) from "list_has_tag"));
SELECT setval('role_id_seq', (SELECT MAX(id) from "role"));
SELECT setval('status_id_seq', (SELECT MAX(id) from "status"));
SELECT setval('tag_id_seq', (SELECT MAX(id) from "tag"));
SELECT setval('utilisateur_id_seq', (SELECT MAX(id) from "utilisateur"));

COMMIT;
