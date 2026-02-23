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

export const UpdateNoteFavoriteBodySchema = z
  .object({
    favorite: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
    rating: z
      .preprocess((value) => {
        if (value === undefined || value === null || value === "") return value;
        if (typeof value === "string") {
          const trimmed = value.trim();
          // Support for comma decimal separator (e.g., "3,5")
          const normalized = trimmed.replace(",", ".");
          const num = Number(normalized);
          return Number.isNaN(num) ? value : num;
        }
        return value;
      }, z.number().min(0).max(5))
      .optional(),
    cover: z.string().nullable().optional(),
    // Legacy compat: accepted but ignored
    option: z.string().optional(),
  })
  .refine(
    (data) =>
      data.favorite !== undefined ||
      data.rating !== undefined ||
      data.cover !== undefined ||
      data.option !== undefined,
    {
      message: "favorite, rating, cover or option is required",
    },
  );

export const CreateNoteBodySchema = z.object({
  name: z.string().min(1, "name is required"),
  // Legacy compat: accepted but ignored
  option: z.string().optional(),
  price: z.string().optional(),
  cover: z.string().nullable().optional(),
  rating: z
    .preprocess((value) => {
      if (value === undefined || value === null || value === "") return value;
      if (typeof value === "string") {
        const trimmed = value.trim();
        const normalized = trimmed.replace(",", ".");
        const num = Number(normalized);
        return Number.isNaN(num) ? value : num;
      }
      return value;
    }, z.number().min(0).max(5))
    .optional(),
  favorite: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
  comment: z.string().optional(),
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
