import { z } from "zod";

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
