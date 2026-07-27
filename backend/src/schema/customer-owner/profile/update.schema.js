const { z } = require("zod");

const updateProfileSchema = z.object({
    firstName: z.string({
        required_error: "First Name is required"
    }).min(2, "First Name must be at least 2 characters"),
    lastName: z.string({
        required_error: "Last Name is required"
    }).min(2, "Last Name must be at least 2 characters"),
    email: z.string({
        required_error: "Email is required"
    }).email("Invalid email"),
    phone: z.string({
        required_error: "Phone is required"
    }).min(10, "Invalid phone number").max(10, "Invalid phone number")
});

module.exports = {updateProfileSchema};
