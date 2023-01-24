# RESTAPI

Est une API qui est RESTful

Une API RESTful doit remplir les critères suivant : 
    - Une archi client-server [X]
    - Des communications client-server dite stateless [X]
      - c-a-d : les informations du client ne sont jamais stockées entre les requêtes GET (ou autre), qui doivent être traitées séparament et de manière totalement indépendente
    - Une interface uniforme entre les composants qui permet un transfert standardisé des informations
      - Implications : 
        - les ressources demandées doivent être identifiables et séparées des réprésentations envoyés au client
        - les ressources puissent être manipulées par le client au moyen de la répresentation reçu qui contient suffisamment d'informations
        - les messages renvoyés au clients contient assez de détails pour décrire la manière dont celui-ci doit traiter les informations
        - l'API possède un hypertexte/hypermedia qui permet au client d'utiliser des hyperlien pour connaitre toutes les autres actions disponible après avoir accédé à une ressource
      - Un système à couches, invisible pour le client, mais qui permet de hiérachiser les différents types de serveurs (sécurité, load-balancing, etc.) [X]

# Routes

Un standardisation des requetes 
[ ] 
`/entites`
    - GET : Récupération tous
    - POST : Creation d'un element

`/entites/:id`
    - GET : Récupération d'une liste
    - PATCH ou PUT : Mise à jour d'une liste
    - DELTE : Suppression d'une liste


| URL | GET | POST | PATCH | DELETE |
|---|---|---|---|---|
| `/lists` | récupérer toutes les listes |Créer une liste| **NE PAS FAIRE** Mettre à jour toutes les listes | **NE PAS FAIRE** Supprimer toutes les listes |
| `/lists/:id` | récupérer **UNE** liste via son ID |**NE PAS FAIRE** Créer une liste en fixant son id d'avance|Mettre à jour une liste via son ID|Supprimer une liste |
| `/cartes` | récupérer toutes les cartes |Créer une carte| **NE PAS FAIRE** Mettre à jour toutes les cartes | **NE PAS FAIRE** Supprimer toutes les cartes |
| `/cartes/:id` | récupérer **UNE** carte via son ID |**NE PAS FAIRE** Créer une carte en fixant son id d'avance|Mettre à jour une carte via son ID|Supprimer une carte |
| `/tags` | récupérer toutes les tags |Créer une tag| **NE PAS FAIRE** Mettre à jour toutes les tags | **NE PAS FAIRE** Supprimer toutes les tags |
| `/tags/:id` | récupérer **UNE** tag via son ID |**NE PAS FAIRE** Créer une tag en fixant son id d'avance|Mettre à jour une tag via son ID|Supprimer une tag |