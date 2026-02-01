import { z } from "zod";

export const UpdateNoteBodySchema = z.object({
  noteid: z.union([z.string(), z.number()]),
  favorite: z.union([z.boolean(), z.enum(["true", "false"])]),
});

export const NotesGetQuerySchema = z.object({
  place_id: z.union([z.string(), z.number()]),
});

export const NoteGetQuerySchema = z.object({
  id: z.union([z.string(), z.number()]),
});

export const UpdateNoteFavoriteBodySchema = z.object({
  favorite: z.union([z.boolean(), z.enum(["true", "false"])]),
});

export const AddNoteTagsBodySchema = z.object({
  tags: z
    .array(
      z.object({
        label: z.string().min(1),
      }),
    )
    .min(1),
});

export const RemoveNoteTagsBodySchema = z.object({
  tags: z
    .array(
      z.object({
        label: z.string().min(1),
      }),
    )
    .min(1),
});
