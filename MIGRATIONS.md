# Migrations Supabase — notesAPI

Le schéma Postgres (prod) évolue **uniquement** par migrations versionnées dans
`supabase/migrations/`. La CLI tient une table `schema_migrations` sur la base :
elle sait ce qui est appliqué, ne rejoue jamais une migration, et ne pousse que
les incréments manquants.

> C'est le pendant Postgres de ce que fait déjà le SQLite local
> ([notesMobile/src/db/migrations.js](../notesMobile/src/db/migrations.js), table `migrations`).

Project ref : `najywmppmhwxskklenzu` (public — sous-domaine de l'API).
CLI : `npx supabase ...` (dépendance de dev, pas d'install globale requise).

---

## 1. Onboarding — À FAIRE UNE SEULE FOIS

La prod a **déjà** le schéma de la baseline (`*_baseline_schema.sql`). Il ne faut
donc pas la *rejouer* dessus, juste dire à Supabase qu'elle est déjà appliquée.

```bash
cd notesAPI

# a) Se connecter (ouvre le navigateur, ou export SUPABASE_ACCESS_TOKEN=...)
npx supabase login

# b) Lier le projet local à la base distante (demande le mot de passe DB —
#    Dashboard > Project Settings > Database > Database password)
npx supabase link --project-ref najywmppmhwxskklenzu

# c) Marquer la baseline comme DÉJÀ appliquée sur la prod (ne l'exécute pas)
#    Remplace <VERSION> par l'horodatage du fichier baseline (le prefixe du nom).
npx supabase migration repair --status applied <VERSION>

# d) Vérifier : la baseline doit apparaitre "Applied" des deux cotes
npx supabase migration list
```

> Alternative (si tu préfères repartir de la réalité) : `npx supabase db pull`
> introspecte la base distante, régénère une baseline exacte et la marque
> appliquée. Supprime alors le fichier baseline consolidé pour éviter le doublon.

---

## 2. Cycle courant — à chaque changement de schéma

```bash
# 1. Créer une migration vide horodatée
npx supabase migration new add_place_priority

# 2. Éditer le fichier cree dans supabase/migrations/ (SQL additif de preference)
#    ex: ALTER TABLE "place" ADD COLUMN "priority" INTEGER DEFAULT 0;

# 3. TESTER sur la base de staging d'abord (voir §3), puis :
npx supabase db push        # applique uniquement les migrations non encore appliquees
```

⚠️ **Couplage local ↔ remote** : `syncLocalToRemote` mappe le SQLite local vers
Supabase. Tout champ ajouté ici doit l'être **aussi** côté mobile
(`src/db/migrations.js` + `src/storage/local.js`), sinon la synchro casse.

---

## 3. Staging — tester sans risque

Crée un **second projet Supabase gratuit** = bac à sable. Applique-y chaque
migration avant la prod :

```bash
npx supabase link --project-ref <REF_STAGING>
npx supabase db push          # rejoue TOUTE l'historique sur une base vierge
# valide l'app contre staging, puis re-link sur la prod pour le push final
```

---

## 4. Règles d'or

- **Additif d'abord.** Ajouter colonne/table/champ nullable ne perd jamais de
  données. Pour renommer/supprimer/changer un type : **expand-contract** — ajoute
  le nouveau, copie les données (`UPDATE`), bascule le code, supprime l'ancien
  seulement quand plus rien ne le lit. Chaque étape est réversible.
- **Backup avant tout changement destructif.** Supabase free tier n'a pas de PITR
  fiable : `pg_dump "$SUPABASE_DB_URL" > backup_$(date +%F).sql` avant un `db push`
  qui touche à l'existant. Pour de vrais utilisateurs, le plan Pro (PITR) se
  justifie.
- **Ne jamais rejouer `db/create_db.sql` sur la prod** — il contient des `DROP`.
  C'est désormais un artefact historique ; la source de vérité est
  `supabase/migrations/`.

---

## Rapport avec `db/*.sql`

Les anciens fichiers de `db/` (create_db, social_tables, security_rpcs,
rls_fix_tag_visibility, place_add_quickcom) sont **consolidés dans la baseline**
et conservés à titre de référence. `db/seed_db.sql` reste le jeu de données de
démo. Toute **nouvelle** évolution passe par `supabase/migrations/`, plus par `db/`.
