import { z } from "zod";

export const AddFriendBodySchema = z.object({
  email: z.string().email(),
});

export const RequestIdQuerySchema = z.object({
  id: z.string().min(1),
});

export const FriendIdQuerySchema = z.object({
  id: z.string().min(1),
});

export const FriendPlacesQuerySchema = z.object({
  userId: z.string().min(1),
});

export const FriendNotesQuerySchema = z.object({
  placeId: z.string().min(1),
  userId: z.string().min(1),
});
