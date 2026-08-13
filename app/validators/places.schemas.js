import { z } from "zod";

export const LocationExistingQuerySchema = z.object({
  location: z.string().min(1),
});

// Jeton de session Google : un UUID produit par le client, renvoyé à
// l'identique sur chaque autocomplétion d'une même saisie puis sur le Place
// Details qui la clôt. Google facture alors la session, pas chaque frappe.
// Validé en UUID pour ne pas relayer n'importe quelle chaîne à Google.
const sessionToken = z.string().uuid().optional();

export const LocationAutoCompleteQuerySchema = z.object({
  location: z.string().min(1),
  lat: z.union([z.string(), z.number()]).optional(),
  lng: z.union([z.string(), z.number()]).optional(),
  types: z.string().optional(),
  sessiontoken: sessionToken,
});

export const PlaceDetailsQuerySchema = z.object({
  place_id: z.string().min(1),
  sessiontoken: sessionToken,
});

export const PlacePhotoQuerySchema = z.object({
  photo_reference: z.string().min(1),
  maxwidth: z.union([z.string(), z.number()]).optional(),
});

export const CoverQuerySchema = z.object({
  key: z.string().min(1).max(512),
});

export const UploadPlacePhotoSchema = z.object({
  photo_reference: z.string().min(1),
  place_id: z.string().min(1),
  maxwidth: z.number().optional(),
});

