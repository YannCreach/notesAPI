import { z } from "zod";

export const UpdateColorschemeBodySchema = z.object({
  colorscheme: z.string().min(1, "colorscheme is required"),
});
