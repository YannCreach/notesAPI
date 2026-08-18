import { z } from "zod";

export const AddFriendBodySchema = z.object({
  email: z.string().email(),
});

// Jeton Expo : `ExponentPushToken[…]`. Le valider ici évite de relayer au
// service de push n'importe quelle chaîne envoyée par un client.
export const PushTokenBodySchema = z.object({
  token: z.string().regex(/^Expo(nent)?PushToken\[[^\]]+\]$/, "invalid_expo_push_token"),
  platform: z.enum(["ios", "android", "web"]),
});

export const PushTokenDeleteBodySchema = z.object({
  token: z.string().min(1),
});

export const RequestIdQuerySchema = z.object({
  id: z.string().min(1),
});

export const FriendIdQuerySchema = z.object({
  id: z.string().min(1),
});

// Surnom : borné, et une chaîne vide vaut effacement (traité côté contrôleur).
export const FriendNicknameBodySchema = z.object({
  nickname: z.string().max(60).nullable().optional(),
});

// Réglages par ami. Les deux sont optionnels et le client n'envoie que celui
// qu'il vient de basculer ; en exiger au moins un évite un PATCH vide qui
// répondrait 200 sans rien avoir changé.
export const FriendSettingsBodySchema = z
  .object({
    show_places: z.boolean().optional(),
    share_places: z.boolean().optional(),
  })
  .refine(
    (body) =>
      body.show_places !== undefined || body.share_places !== undefined,
    { message: "missing_fields" },
  );

export const FriendPlacesQuerySchema = z.object({
  userId: z.string().min(1),
});

export const FriendNotesQuerySchema = z.object({
  placeId: z.string().min(1),
  userId: z.string().min(1),
});
