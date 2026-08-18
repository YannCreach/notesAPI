# Feature Social — Contrat API

## Contexte

L'app mobile (React Native / Expo) a une nouvelle feature **Social** permettant aux utilisateurs connectés (auth Supabase) d'ajouter des amis par email, de gérer les demandes d'amitié, et de consulter les lieux et mémentos de leurs amis en lecture seule.

Le front **et** le backend sont désormais implémentés (voir `app/controllers/socialController.js`, `app/models/social.js`, `db/social_tables.sql`). Ce document reste la référence du contrat.

**Notes d'implémentation (sécurité) :**

- Le lookup d'un utilisateur par email et la récupération des amis passent par les RPC `get_user_id_by_email` / `get_users_by_ids` (`service_role` uniquement) — **pas** de `admin.listUsers()` (voir `db/security_rpcs.sql`).
- `POST /addfriend` est **rate-limité** à 20 req/heure/utilisateur (anti-spam email → réponse `429 rate_limited`).
- Les emails de notification/invitation échappent le HTML du nom/email de l'expéditeur (anti-injection HTML).

## Authentification

Tous les endpoints nécessitent un header `Authorization: Bearer <supabase_access_token>`. Le token est un JWT Supabase. L'API doit extraire le `user_id` depuis ce token (via `supabase.auth.getUser(token)` ou en décodant le JWT).

Le client axios est configuré dans `src/api/client.js` :

- Base URL configurable via `EXPO_PUBLIC_API_URL` (défaut: `http://localhost:3001`)
- L'intercepteur ajoute automatiquement le Bearer token Supabase
- L'intercepteur de réponse s'attend à ce que les erreurs aient le format `{ error: { code: string, message: string } }`

## Format des erreurs

Toutes les erreurs doivent retourner :

```json
{
  "error": {
    "code": "error_code_snake_case",
    "message": "Message lisible"
  }
}
```

Codes HTTP attendus :

- `200` — succès
- `400` — paramètre manquant / invalide
- `401` — non authentifié
- `404` — ressource non trouvée
- `409` — conflit (demande déjà envoyée, déjà amis, etc.)
- `429` — trop de requêtes (rate limiting, ex. `/addfriend`)

---

## Tables à créer (Supabase / PostgreSQL)

### `friend_requests`

| Colonne        | Type          | Description                           |
| -------------- | ------------- | ------------------------------------- |
| `id`           | uuid / serial | PK                                    |
| `from_user_id` | uuid          | FK → auth.users.id (celui qui envoie) |
| `to_user_id`   | uuid          | FK → auth.users.id (celui qui reçoit) |
| `from_email`   | text          | Email de l'envoyeur (pour affichage)  |
| `from_name`    | text          | Nom de l'envoyeur (peut être null)    |
| `created_at`   | timestamptz   | Date de création                      |

Contrainte unique : `(from_user_id, to_user_id)` — pas de doublon de demande.

### `friends`

| Colonne        | Type          | Description                                     |
| -------------- | ------------- | ----------------------------------------------- |
| `id`           | uuid / serial | PK                                              |
| `user_id`      | uuid          | FK → auth.users.id                              |
| `friend_id`    | uuid          | FK → auth.users.id                              |
| `nickname`     | text          | Surnom local (null = pas de surnom)             |
| `show_places`  | boolean       | Afficher **ses** lieux sur **ma** carte         |
| `share_places` | boolean       | Partager **mes** lieux avec **lui**             |
| `created_at`   | timestamptz   | Date d'ajout                                    |

Contrainte unique : `(user_id, friend_id)`. La relation est bidirectionnelle : quand A accepte B, créer **deux** lignes `(A, B)` et `(B, A)`.

Les trois colonnes de réglage vivent sur la ligne dont `user_id` est le vôtre — celle que vous possédez. `nickname` et `show_places` ne concernent que votre vue. `share_places` est d'une autre nature : c'est une **autorisation**, et elle se lit donc dans le sens inverse de celui qui l'écrit. Quand B réclame les lieux de A, le serveur consulte la ligne `(A → B)`, écrite par A. Les deux booléens sont `NOT NULL DEFAULT TRUE` (migration `20260816234413_add_friend_sharing_flags.sql`) : une amitié déjà nouée ne se referme pas au passage de la migration.

---

## Lieux privés

La table `place` porte `is_private BOOLEAN NOT NULL DEFAULT FALSE` (migration `20260818125513_add_place_is_private.sql`). Un lieu privé — et tous ses mémentos avec lui — n'est **jamais** servi à un ami :

- `/friendsplaces` et `/friendplaces` l'excluent de leurs résultats ;
- `/friendnotes` répond `404 place_not_found`, et non `403`. Un refus explicite confirmerait que le lieu existe, ce qui est précisément ce qu'on cache. C'est aussi ce qui coupe les mémentos qu'un ami lisait sur une **copie** faite avant que le lieu ne devienne privé : sa copie reste la sienne, votre contenu s'en retire.

Le filtre est appliqué dans `app/models/social.js`, jamais dans l'app : le client transporte le drapeau via la synchro, il ne décide pas de ce que le serveur accepte de montrer. À ne pas confondre avec `friends.share_places`, qui coupe le partage avec **une personne** ; `is_private` retire **un lieu** à tout le monde.

## Endpoints

### 1. `POST /addfriend`

Envoie une demande d'ami par email.

**Body :**

```json
{
  "email": "ami@example.com"
}
```

**Logique :**

1. Récupérer le `user_id` courant depuis le token
2. Vérifier que `email` n'est pas l'email de l'utilisateur courant
3. Chercher le destinataire dans `auth.users` par email
4. **Cas A — Le compte existe :**
   - Vérifier qu'une demande identique n'existe pas déjà (`friend_requests`)
   - Vérifier qu'ils ne sont pas déjà amis (`friends`)
   - Créer l'entrée dans `friend_requests`
   - **Envoyer un email de notification** au destinataire : "{Nom} ({email}) vous a ajouté en ami sur Note To Myself. Ouvrez l'app pour accepter la demande."
5. **Cas B — Aucun compte avec cet email :**
   - **Envoyer un email d'invitation** à cette adresse : "{Nom} ({email}) vous a invité sur Note To Myself. Téléchargez l'app et créez un compte pour consulter ses lieux et mementos."
   - Stocker la demande en attente (optionnel : table `pending_invitations` avec `from_user_id`, `to_email`, `created_at`) pour la traiter quand la personne créera un compte
6. **Dans les deux cas** : retourner un succès 200. Le front affiche un message générique "Une demande a été envoyée à {email}." sans révéler si le compte existe ou non (protection de la vie privée).

**IMPORTANT** : Cet endpoint doit **toujours retourner 200** tant que l'email est valide et n'est pas celui de l'utilisateur courant. Ne jamais retourner d'erreur `user_not_found` — cela révélerait si un email est inscrit ou non.

**Réponse succès (200) :**

```json
{
  "message": "Friend request sent"
}
```

**Erreurs possibles :**

- `400` — `{ "error": { "code": "missing_email", "message": "Email is required" } }`
- `400` — `{ "error": { "code": "cannot_add_self", "message": "Cannot add yourself" } }`
- `409` — `{ "error": { "code": "already_friends", "message": "Already friends" } }`
- `409` — `{ "error": { "code": "request_exists", "message": "Friend request already sent" } }`

**Table optionnelle `pending_invitations`** (pour les invitations vers des emails sans compte) :

| Colonne        | Type          | Description                                |
| -------------- | ------------- | ------------------------------------------ |
| `id`           | uuid / serial | PK                                         |
| `from_user_id` | uuid          | FK → auth.users.id (celui qui invite)      |
| `to_email`     | text          | Email du destinataire (pas encore inscrit) |
| `created_at`   | timestamptz   | Date de création                           |

Quand un nouvel utilisateur crée un compte, vérifier s'il a des entrées dans `pending_invitations` et les convertir automatiquement en `friend_requests`.

---

### 2. `GET /friends`

Retourne la liste des amis de l'utilisateur courant.

**Paramètres :** aucun

**Logique :**

1. Récupérer le `user_id` courant depuis le token
2. Chercher dans `friends` toutes les lignes où `user_id = current_user`
3. Pour chaque `friend_id`, récupérer l'email et le nom (depuis `auth.users` ou une table `profiles`)

**Réponse succès (200) :**

```json
[
  {
    "id": "uuid-du-friend",
    "email": "ami@example.com",
    "name": "Jean Dupont",
    "nickname": "Jeannot",
    "show_places": true,
    "share_places": true,
    "created_at": "2025-12-01T10:30:00Z"
  }
]
```

`nickname` est le surnom que **vous** lui avez donné (null s'il n'y en a pas) ; `name` reste le nom de son compte. `show_places` et `share_places` sont vos deux réglages pour cet ami, écrits par `PATCH /friendsettings` : ils voyagent avec la liste pour que l'écran Social n'ait pas à faire un appel de plus par ligne.

Le champ `id` doit être l'`id` de l'utilisateur ami (son `user_id` dans auth.users), car le front l'utilise directement comme `userId` dans les appels suivants (`/friendplaces?userId=...`, `/friendnotes?...&userId=...`).

`name` peut être `null` si le profil n'a pas de nom.

Retourne un tableau vide `[]` si aucun ami.

---

### 3. `GET /friendrequests`

Retourne les demandes d'ami **reçues** par l'utilisateur courant (en attente).

**Paramètres :** aucun

**Logique :**

1. Récupérer le `user_id` courant depuis le token
2. Chercher dans `friend_requests` toutes les lignes où `to_user_id = current_user`

**Réponse succès (200) :**

```json
[
  {
    "id": "uuid-de-la-demande",
    "from_email": "didier@fai.com",
    "from_name": "Didier Martin",
    "created_at": "2025-12-01T10:30:00Z"
  }
]
```

Le champ `id` est l'id de la ligne dans `friend_requests` (utilisé par `/acceptfriend` et `/declinefriend`).

`from_name` peut être `null`.

Retourne un tableau vide `[]` si aucune demande.

**Contexte d'utilisation :** Ce endpoint est appelé :

- Au chargement de l'écran Social (pour afficher la section "Demandes reçues")
- Au login dans App.js (pour afficher la modale de demandes d'ami au démarrage)

---

### 4. `PATCH /acceptfriend?id=<request_id>`

Accepte une demande d'ami.

**Query params :**

- `id` — l'id de la `friend_request` à accepter

**Logique :**

1. Récupérer le `user_id` courant depuis le token
2. Trouver la `friend_request` avec cet `id` où `to_user_id = current_user`
3. Si non trouvée → erreur 404
4. Créer les deux entrées dans `friends` : `(current_user, from_user_id)` et `(from_user_id, current_user)`
5. Supprimer la `friend_request`

**Réponse succès (200) :**

```json
{
  "message": "Friend request accepted"
}
```

**Erreurs possibles :**

- `400` — `{ "error": { "code": "missing_id", "message": "Request id is required" } }`
- `404` — `{ "error": { "code": "request_not_found", "message": "Friend request not found" } }`

---

### 5. `DELETE /declinefriend?id=<request_id>`

Décline (supprime) une demande d'ami.

**Query params :**

- `id` — l'id de la `friend_request` à décliner

**Logique :**

1. Récupérer le `user_id` courant depuis le token
2. Trouver la `friend_request` avec cet `id` où `to_user_id = current_user`
3. Si non trouvée → erreur 404
4. Supprimer la `friend_request`

**Réponse succès (200) :**

```json
{
  "message": "Friend request declined"
}
```

**Erreurs possibles :**

- `400` — `{ "error": { "code": "missing_id", "message": "Request id is required" } }`
- `404` — `{ "error": { "code": "request_not_found", "message": "Friend request not found" } }`

---

### 6. `DELETE /removefriend?id=<friend_user_id>`

Retire un ami (rompt la relation d'amitié).

**Query params :**

- `id` — l'`id` de l'utilisateur ami à retirer (son `user_id` dans auth.users, PAS l'id de la table friends)

**Logique :**

1. Récupérer le `user_id` courant depuis le token
2. Supprimer les deux entrées dans `friends` : `(current_user, id)` et `(id, current_user)`
3. Si aucune ligne trouvée → erreur 404

**Réponse succès (200) :**

```json
{
  "message": "Friend removed"
}
```

**Erreurs possibles :**

- `400` — `{ "error": { "code": "missing_id", "message": "Friend id is required" } }`
- `404` — `{ "error": { "code": "friend_not_found", "message": "Friend not found" } }`

---

### 7. `GET /friendplaces?userId=<friend_user_id>`

Retourne les lieux d'un ami.

**Query params :**

- `userId` — l'`id` de l'utilisateur ami

**Logique :**

1. Récupérer le `user_id` courant depuis le token
2. Vérifier que `userId` est bien un ami de `current_user` (ligne dans `friends`)
3. Si non ami → erreur 403 `not_friends`
4. Vérifier sur **sa** ligne (`userId → current_user`) qu'il n'a pas coupé `share_places` → sinon 403 `not_shared`
5. Retourner toutes les `places` de cet utilisateur (`places.user_id = userId`)

**Réponse succès (200) :**

```json
[
  {
    "id": 123,
    "name": "Le Café du Coin",
    "address": "12 rue de la Paix, Paris",
    "city": "Paris",
    "rating": 4.5,
    "cover": "https://...",
    "favorite": true,
    "notes_count": 3,
    "latitude": 48.8566,
    "longitude": 2.3522,
    "category_id": 5,
    "category_label": "Restaurant",
    "category_icon": "utensils",
    "created_at": "2025-06-15T14:00:00Z"
  }
]
```

Le format de chaque place doit être **identique** au format retourné par les endpoints existants de places de l'app (même structure de champs). Le front réutilise le composant `PlaceTile` qui attend ces champs.

Champs importants :

- `id` — id de la place (number ou string)
- `name` — nom du lieu
- `address` — adresse complète
- `city` — ville (optionnel, extrait de l'adresse si non disponible)
- `rating` — note (number, optionnel)
- `cover` — URL de l'image de couverture (optionnel)
- `favorite` — boolean
- `notes_count` — nombre de mémentos (integer)
- `latitude`, `longitude` — coordonnées GPS (optionnel)
- `category_id` — id de la catégorie **chez l'ami** (inexploitable par le front)
- `category_label`, `category_icon` — la catégorie de l'ami, jointe au lieu

Les `category_id` sont propres à chaque compte : celui d'un ami ne désigne rien chez vous et pointerait par hasard sur une de vos catégories. Le libellé et l'icône voyagent donc avec le lieu, et le front les affiche tels quels sans rien résoudre.

Retourne un tableau vide `[]` si l'ami n'a pas de lieux.

---

### 8. `GET /friendsplaces`

Retourne les lieux géolocalisés de **tous** vos amis, pour les pins de la carte d'accueil.

**Aucun paramètre** : la liste d'amis est lue côté serveur depuis le JWT. Le client ne peut donc pas demander les lieux de quelqu'un dont il n'est pas l'ami — contrairement à `/friendplaces`, qui doit le vérifier à chaque appel.

**Logique :**

1. Récupérer le `user_id` courant depuis le token
2. Lire ses amis (`friends.user_id = current_user`) — sans ami, répondre `[]`
3. Ne garder que les amis dont **les deux** réglages sont d'accord : `show_places` sur ma ligne (je ne l'ai pas masqué) **et** `share_places` sur la sienne (il me montre bien ses lieux). Plus personne ne reste, répondre `[]` sans interroger les lieux
4. Une seule requête `place` avec `user_id IN (amis retenus)`, en écartant les lignes sans `latitude`/`longitude` (elles ne peuvent pas être posées sur la carte)
5. Joindre le surnom local (`friends.nickname`) puis le nom du compte pour renseigner `owner_name`

**Réponse succès (200) :**

```json
[
  {
    "id": 123,
    "name": "Le Café du Coin",
    "address": "12 rue de la Paix, Paris",
    "city": "Paris",
    "rating": 4.5,
    "cover": "https://...",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "user_id": "uuid-ami",
    "owner_id": "uuid-ami",
    "owner_name": "Marie",
    "category_label": "Restaurant",
    "category_icon": "utensils"
  }
]
```

`owner_name` suit la même règle d'affichage que la liste d'amis : le surnom que vous lui avez donné, sinon le nom du compte, sinon son email. Il voyage avec le lieu pour que la carte n'ait pas à faire un appel par pin.

`category_label` et `category_icon` sont la catégorie **de l'ami**, jointe au lieu : son `category_id` ne désigne rien chez vous. C'est cette icône que porte le pin.

Retourne un tableau vide `[]` si aucun ami, ou si aucun de leurs lieux n'a de coordonnées.

---

### 9. `GET /friendnotes?placeId=<place_id>&userId=<friend_user_id>`

Retourne les mémentos (notes) d'un lieu d'un ami.

**Query params :**

- `placeId` — l'id de la place
- `userId` — l'id de l'utilisateur ami (propriétaire de la place)

**Logique :**

1. Récupérer le `user_id` courant depuis le token
2. Vérifier que `userId` est bien un ami de `current_user`
3. Vérifier sur sa ligne qu'il n'a pas coupé `share_places` → sinon 403 `not_shared`
4. Vérifier que la place `placeId` appartient bien à `userId`
5. Retourner toutes les `notes` (mémentos) de cette place, chacune étiquetée de son propriétaire

**Réponse succès (200) :**

```json
[
  {
    "id": 456,
    "place_id": 123,
    "name": "Café crème",
    "comment": "Excellent, terrasse agréable",
    "price": "4.50",
    "rating": 4,
    "cover": "https://...",
    "favorite": false,
    "owner_id": "uuid-ami",
    "owner_name": "Marie",
    "created_at": "2025-07-01T09:30:00Z",
    "updated_at": "2025-07-01T09:30:00Z"
  }
]
```

`owner_name` (surnom local, sinon nom du compte, sinon email) est nécessaire sur un **lieu copié** : ces mémentos y sont mêlés à ceux de l'appelant et doivent dire de qui ils sont. Voir « Copier le lieu d'un ami » plus bas.

Le format de chaque note doit être **identique** au format retourné par les endpoints existants de notes de l'app.

Champs importants :

- `id` — id de la note
- `place_id` — id de la place parente
- `name` — titre du mémento
- `comment` — commentaire (optionnel)
- `price` — prix (string, optionnel)
- `rating` — note 0-5 (number, optionnel)
- `cover` — URL de la photo (optionnel)
- `favorite` — boolean
- `created_at`, `updated_at` — timestamps

Retourne un tableau vide `[]` si la place n'a pas de mémentos.

---

### 10. Réglages par ami

Trois réglages, tous portés par **votre** ligne d'amitié. Deux routes les écrivent.

#### `PATCH /friendnickname?id=<friend_user_id>`

**Body :** `{ "nickname": "Jeannot" }` — une chaîne vide ou `null` efface le surnom.

**Réponse (200) :** `{ "id": "<friend_user_id>", "nickname": "Jeannot" }`

Le surnom ne change que votre vue. L'ami n'a aucun moyen de savoir comment vous l'avez enregistré.

#### `PATCH /friendsettings?id=<friend_user_id>`

**Body :** au moins l'une des deux clés, jamais les deux obligatoirement.

```json
{ "show_places": true, "share_places": false }
```

- `show_places` — afficher **ses** lieux sur **ma** carte. Préférence d'affichage : elle ne filtre que `/friendsplaces`. Ouvrir son profil exprès (`/friendplaces`) continue de montrer ses lieux — masquer n'est pas se couper de lui.
- `share_places` — partager **mes** lieux avec **lui**. Autorisation : le serveur la lit sur ma ligne quand *lui* réclame mes données, et refuse `/friendplaces` comme `/friendnotes` en `403 not_shared`.

Le client n'envoie que le drapeau qu'il vient de basculer : un écran chargé avec une valeur périmée ne peut donc pas réécrire l'autre au passage.

**Réponse (200) :** l'état complet après écriture.

```json
{ "id": "<friend_user_id>", "show_places": true, "share_places": false }
```

**Erreurs possibles :**

- `400` — `validation_error` (corps vide : rien à changer)
- `404` — `{ "error": { "code": "not_found", "message": "Friendship not found" } }`

**Effet côté ami :** aucune notification, aucun indice. Quand le partage est coupé, ses appels renvoient `403` et le front retombe sur ses états vides — même comportement silencieux qu'une rupture d'amitié, et pour la même raison : lui annoncer le réglage reviendrait à le divulguer.

## Résumé des endpoints

| Méthode  | Route                                 | Description                        |
| -------- | ------------------------------------- | ---------------------------------- |
| `POST`   | `/addfriend`                          | Envoyer une demande d'ami          |
| `GET`    | `/friends`                            | Liste des amis                     |
| `GET`    | `/friendrequests`                     | Demandes d'ami reçues (en attente) |
| `PATCH`  | `/acceptfriend?id=<request_id>`       | Accepter une demande               |
| `DELETE` | `/declinefriend?id=<request_id>`      | Décliner une demande               |
| `DELETE` | `/removefriend?id=<friend_user_id>`   | Retirer un ami                     |
| `PATCH`  | `/friendnickname?id=<friend_user_id>` | Renommer un ami (surnom local)     |
| `PATCH`  | `/friendsettings?id=<friend_user_id>` | Afficher ses lieux / partager les miens |
| `GET`    | `/friendplaces?userId=<user_id>`      | Lieux d'un ami                     |
| `GET`    | `/friendsplaces`                      | Lieux de tous les amis (carte)     |
| `GET`    | `/friendnotes?placeId=...&userId=...` | Mémentos d'un lieu d'un ami        |

## Flux utilisateur

### Ajout d'ami

1. User A saisit l'email de User B → `POST /addfriend { email }`
2. User B reçoit un email de notification
3. User B ouvre l'app → `GET /friendrequests` retourne la demande de A
4. L'app affiche une modale au login avec la demande
5. User B accepte → `PATCH /acceptfriend?id=xxx`
6. Les deux sont maintenant amis

### Consultation des lieux d'un ami

0. Sur l'accueil, la carte charge `GET /friendsplaces` : les lieux des amis apparaissent en violet, à côté des vôtres en vert, et se masquent depuis le menu filtre. Un tap ouvre la fiche en lecture seule.
1. User A va sur l'écran Social → `GET /friends` + `GET /friendrequests`
2. Tap sur un ami → écran FriendProfile → `GET /friendplaces?userId=xxx`
3. Tap sur un lieu → PlaceDetails en mode lecture seule → `GET /friendnotes?placeId=xxx&userId=xxx`
4. Aucune action d'écriture n'est possible (pas d'edit, delete, favorite, création de mémento)

### Copier le lieu d'un ami

1. Sur la fiche en lecture seule, « Ajouter » ouvre le formulaire d'ajout prérempli (nom, adresse, coordonnées, photo, et votre catégorie de même libellé si vous en avez une)
2. À l'enregistrement, le lieu créé porte `origin_place_id` (l'id du lieu chez l'ami) et `origin_user_id` (son compte) — colonnes ajoutées par [db/place_origin.sql](db/place_origin.sql), et transportées par le moteur de sync
3. **Aucun mémento n'est copié** : ils restent à lui. À chaque ouverture du lieu, l'app appelle `GET /friendnotes?placeId=<origin_place_id>&userId=<origin_user_id>` et les mêle aux vôtres, en lecture seule et différenciés par la couleur et le nom
4. Si l'amitié cesse, l'endpoint répond `403` et ses mémentos disparaissent — le lieu, lui, reste le vôtre
5. Le pin de l'ami s'efface de la carte au profit du vôtre

### Recherche globale

1. User tape dans la barre de recherche
2. Le front appelle `GET /friends` puis `GET /friendplaces?userId=...` pour chaque ami
3. Les lieux des amis matchant la query sont affichés dans une section "Lieux d'amis" avec le nom de l'ami en badge

## Notes d'implémentation

- La relation d'amitié est **bidirectionnelle** : quand A accepte B, les deux peuvent voir les lieux de l'autre
- Les données des amis sont en **lecture seule** : le front n'envoie jamais de requêtes de modification sur les données d'un ami
- L'email de notification (`POST /addfriend`) est envoyé côté serveur, le front ne s'en occupe pas
- Le front gère le cas où les endpoints ne sont pas encore implémentés (catch silencieux, affichage d'états vides)
