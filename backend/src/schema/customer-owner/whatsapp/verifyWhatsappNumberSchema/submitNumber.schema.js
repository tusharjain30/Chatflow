const { z } = require("zod");

const submitWhatsappNumberSchema = z.object({
    phone: z
        .string({ 
            required_error: "Phone number is required",
            invalid_type_error: "Phone number must be a string"
         })
        .min(10, "Invalid phone number")
        .max(10, "Invalid phone number")
});

module.exports = { submitWhatsappNumberSchema };
