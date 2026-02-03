import { z } from "zod";

export const GetPlaceByIdQuerySchema = z.object({
  id: z.string().min(1, "id is required"),
});

export const CreatePlaceBodySchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  comment: z.string().optional(),
  cover: z.string().optional(),
  category_id: z.number().int(),
  latitude: z.number(),
  longitude: z.number(),
  rating: z.number().int().min(0).max(5).optional(),
  slug: z.string().min(1),
  favorite: z.boolean().optional(),
  googleid: z.string().nullable().optional(),
  yelpid: z.string().nullable().optional(),
  tags: z.array(z.object({ label: z.string().min(1) })).optional(),
});

export const UpdatePlaceBodySchema = z.object({
  favorite: z.union([z.boolean(), z.enum(["true", "false"])]),
});

export const LocationExistingQuerySchema = z.object({
  location: z.string().min(1),
});

export const LocationAutoCompleteQuerySchema = z.object({
  location: z.string().min(1),
  lat: z.union([z.string(), z.number()]).optional(),
  lng: z.union([z.string(), z.number()]).optional(),
  types: z.string().optional(),
});

export const PlaceDetailsQuerySchema = z.object({
  place_id: z.string().min(1),
});

export const PlaceCoordsQuerySchema = z.object({
  lat: z.union([z.string(), z.number()]),
  lng: z.union([z.string(), z.number()]),
});

export const CategoryLabelQuerySchema = z.object({
  categorylabel: z.string().min(1),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  sort: z.enum(["created_at", "updated_at"]).default("created_at").optional(),
  order: z.enum(["asc", "desc"]).default("desc").optional(),
});

export const LatestPlacesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(9).optional(),
});
