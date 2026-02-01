import { ZodError } from "zod";

export function validate(schema, source = "query") {
  return (req, res, next) => {
    try {
      const payload =
        source === "body"
          ? req.body
          : source === "headers"
            ? req.headers
            : source === "params"
              ? req.params
              : req.query;
      const result = schema.safeParse(payload);
      if (!result.success) {
        const firstIssue = result.error.issues?.[0];
        return res.status(400).json({
          error: {
            code: "validation_error",
            message: firstIssue?.message || "Invalid request payload",
            details: result.error.issues,
          },
        });
      }
      req.validated = result.data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res
          .status(400)
          .json({
            error: {
              code: "validation_error",
              message: "Invalid request payload",
              details: err.errors,
            },
          });
      }
      return res
        .status(500)
        .json({ error: { code: "internal_error", message: err.message } });
    }
  };
}
