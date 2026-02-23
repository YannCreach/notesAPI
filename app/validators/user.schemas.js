import { z } from "zod";

const ThemeSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === "clair") return "light";
  if (normalized === "sombre") return "dark";
  return normalized;
}, z.enum(["light", "dark"], { message: "theme must be light or dark" }));

const CurrencySchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.trim().toUpperCase();
}, z.string().regex(/^[A-Z]{3}$/, "currency must be ISO 4217 (e.g. EUR)"));

export const UpdateColorschemeBodySchema = z.object({
  colorscheme: z.string().min(1, "colorscheme is required"),
});

export const RegisterBodySchema = z.object({
  email: z.string().email("email must be valid"),
  password: z
    .string()
    .min(8, "password must be at least 8 characters")
    .max(72, "password must be at most 72 characters"),
});

export const UpdatePreferencesBodySchema = z
  .object({
    theme: ThemeSchema.optional(),
    currency: CurrencySchema.optional(),
    displayBulletPoints: z.boolean().optional(),
    display_bullet_points: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.theme !== undefined ||
      data.currency !== undefined ||
      data.displayBulletPoints !== undefined ||
      data.display_bullet_points !== undefined,
    {
      message:
        "theme, currency or displayBulletPoints/display_bullet_points is required",
    },
  )
  .transform((data) => {
    const displayBulletPoints =
      data.displayBulletPoints !== undefined
        ? data.displayBulletPoints
        : data.display_bullet_points;

    return {
      theme: data.theme,
      currency: data.currency,
      ...(displayBulletPoints !== undefined ? { displayBulletPoints } : {}),
    };
  });
