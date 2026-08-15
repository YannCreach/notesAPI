-- Jetons de notification push, un par appareil.
--
-- Un même compte peut en avoir plusieurs (téléphone, tablette) et un même
-- appareil peut changer de compte : la clé est donc le jeton, pas l'utilisateur.
-- Réinstaller l'app produit un nouveau jeton ; les anciens meurent de leur belle
-- mort quand Expo répond `DeviceNotRegistered` (voir services/push.js).

CREATE TABLE IF NOT EXISTS "push_token" (
  "token" TEXT PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "platform" TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_token_user_id_idx ON "push_token" ("user_id");

ALTER TABLE "push_token" ENABLE ROW LEVEL SECURITY;

-- L'app n'écrit jamais directement : elle passe par l'API, qui utilise la clé
-- service_role. Ces policies servent au cas où on lirait un jour en direct, et
-- surtout à garantir qu'un client ne peut pas énumérer les jetons des autres.
DROP POLICY IF EXISTS push_token_select_own ON "push_token";
CREATE POLICY push_token_select_own ON "push_token"
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS push_token_delete_own ON "push_token";
CREATE POLICY push_token_delete_own ON "push_token"
  FOR DELETE USING (auth.uid() = user_id);
