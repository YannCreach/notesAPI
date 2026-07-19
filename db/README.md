# db/ — artefacts SQL historiques

⚠️ **Ce dossier n'est plus la source de vérité du schéma.**

Les évolutions de schéma passent désormais par les **migrations versionnées**
Supabase dans [`../supabase/migrations/`](../supabase/migrations/). Voir
[`../MIGRATIONS.md`](../MIGRATIONS.md) pour le workflow.

Contenu conservé pour référence :

| Fichier | Rôle |
| --- | --- |
| `create_db.sql` | Schéma complet initial (consolidé dans la baseline). **Ne pas rejouer sur la prod** — contient des `DROP`. |
| `social_tables.sql`, `security_rpcs.sql`, `rls_fix_tag_visibility.sql`, `place_add_quickcom.sql` | Migrations passées, désormais fondues dans la baseline. |
| `seed_db.sql` | Jeu de données de démo (toujours valable). |
