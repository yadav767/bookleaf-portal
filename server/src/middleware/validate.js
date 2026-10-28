import AppError from "../utils/AppError.js";

// validate(schema) checks req.body against a zod schema and replaces it with the clean data
export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return next(new AppError("Please check the form and try again", 400, details));
    }
    req.body = result.data;
    next();
  };
}
