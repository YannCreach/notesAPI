# Migrations Supabase — notesAPI

Le schéma Postgres évolue par **fichiers de migration versionnés** dans
`supabase/migrations/` (horodatés, ordonnés, revus en diff, tracés par git).
C'est le pendant du SQLite local
([notesMobile/src/db/migrations.js](../notesMobile/src/db/migrations.js)).

## ⚠️ Contrainte de ce projet : la CLI ne peut pas piloter la base distante

`supabase db push` / `link` / `migration repair` **échouent** ici avec :

```
permission denied to alter role "cli_login_postgres"
```

Supabase restreint les privilèges du rôle `postgres` sur les projets récents ;
la CLI ne peut donc pas créer son rôle de login temporaire. Ce **n'est pas
contournable** proprement. → On applique les migrations via l'**éditeur SQL du
dashboard**, qui tourne avec un rôle privilégié.

La CLI reste utile pour **créer** les fichiers (ça, c'est 100 % local et marche).

---

## Cycle courant — à chaque changement de schéma

```bash
# 1. Créer une migration vide horodatée (local, aucune connexion requise)
npx supabase migration new add_place_priority
```

```sql
-- 2. Éditer le fichier créé dans supabase/migrations/ — SQL additif de préférence
ALTER TABLE "place" ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 0;
```

3. **Appliquer** : copier ce SQL dans **Supabase Studio → SQL Editor → Run**
   (d'abord sur staging si tu en as un — voir plus bas — puis sur la prod).

4. **Committer** le fichier. Règle d'or de traçabilité : **appliquer puis
   committer**, pour que l'invariant tienne — *tout fichier présent dans
   `supabase/migrations/` sur `master` est déjà appliqué en prod*.

⚠️ **Couplage local ↔ remote** : `syncLocalToRemote` mappe le SQLite local vers
Supabase. Tout champ ajouté ici doit l'être **aussi** côté mobile
(`src/db/migrations.js` + `src/storage/local.js`), sinon la synchro casse.

---

## Baseline

`supabase/migrations/*_baseline_schema.sql` reflète le schéma **déjà en prod**
(create_db + social_tables + security_rpcs). Aucune action à faire dessus : c'est
le point de départ de l'historique, pas une migration à rejouer.

---

## Staging (recommandé)

Un **second projet Supabase gratuit** = bac à sable. Pour l'amorcer, exécute la
baseline puis chaque migration dans son SQL Editor. Ensuite, teste-y toute
nouvelle migration avant de la passer en prod.

---

## Règles d'or

- **Additif d'abord.** Ajouter colonne/table/champ nullable ne perd jamais de
  données. Pour renommer/supprimer/changer un type : **expand-contract** — ajoute
  le nouveau, copie (`UPDATE`), bascule le code, supprime l'ancien seulement quand
  plus rien ne le lit. Chaque étape est réversible.
- **`IF NOT EXISTS` / `IF EXISTS`** dans les migrations : si tu réappliques par
  erreur dans le SQL Editor, c'est un no-op au lieu d'une erreur.
- **Backup avant tout changement destructif.** Le free tier n'a pas de PITR
  fiable : `pg_dump "$SUPABASE_DB_URL" > backup_$(date +%F).sql` avant d'appliquer
  un DROP/ALTER sur l'existant. Pour de vrais utilisateurs, le plan Pro (PITR) se
  justifie.
- **Ne jamais rejouer `db/create_db.sql` sur la prod** — il contient des `DROP`.

---

## Si l'accès CLI est débloqué un jour

Si tu migres vers un setup où la CLI peut se connecter (rôle privilégié, ou
Supabase lève la restriction), le flux redevient : `supabase link --project-ref
najywmppmhwxskklenzu`, `migration repair --status applied <version_baseline>`
(marquer la baseline comme appliquée), puis `supabase db push` pour l'auto-apply.

---

## Rapport avec `db/*.sql`

Anciens fichiers consolidés dans la baseline, conservés en référence
(voir `db/README.md`). `db/seed_db.sql` reste le jeu de démo. Toute **nouvelle**
évolution passe par `supabase/migrations/`.
