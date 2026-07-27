const { ZodError } = require("zod");

const RESPONSE_CODES = require("../config/responseCode");

const validator = (schema, property = "body") => {
    return (req, res, next) => {
        try {

            if (property === "body" &&
                Object.keys(req.body || {}).length === 0 &&
                !req.file &&
                !req.files
            ) {
                return res.status(400).json({
                    status: 0,
                    message: "Request body cannot be empty",
                    statusCode: 400,
                    data: {}
                });
            }

            const data =
                property === "query" || property === "params"
                    ? { ...req[property] }
                    : req[property];

            const parsed = schema.parse(data || {});
        
            if (property === "query") {
                req.validatedQuery = parsed;
            } else if (property === "params") {
                req.validatedParams = parsed;
            } else {
                req[property] = parsed;
            }

            next();
        } catch (err) {
            if (err instanceof ZodError || err?.name === "ZodError") {

                const firstError = err?.issues?.[0];

                return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                    status: 0,
                    message: firstError?.message || "Invalid input",
                    statusCode: RESPONSE_CODES.BAD_REQUEST,
                    data: {}
                });
            }

            return res.status(RESPONSE_CODES.ERROR).json({
                status: 0,
                message: err.message || "Validation error",
                statusCode: RESPONSE_CODES.ERROR,
                data: {}
            });
        }
    };
};

module.exports = validator;
