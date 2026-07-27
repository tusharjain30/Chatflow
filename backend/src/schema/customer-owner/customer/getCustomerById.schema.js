const { z } = require("zod");

const getCustomerByIdSchema = z.object({
    customerId: z.number({
        required_error: "Customer Id is required"
    })
});

module.exports = { getCustomerByIdSchema };