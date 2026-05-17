import { AppError } from "../utils/errors.js";
export const validate = (schema) => {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.issues
                .map((issue) => issue.message)
                .join(", ");
            throw new AppError(400, errors);
        }
        next();
    };
};
