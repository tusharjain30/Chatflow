const { z } = require("zod");

const deleteCustomerBodySchema = z
    .object({
        id: z
            .number({
                required_error: "Customer Id is required",
                invalid_type_error: "Id must be a number",
            }),
    });

module.exports = {
    deleteCustomerBodySchema,
};
