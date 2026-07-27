const { z } = require("zod");

const userRegisterSchema = z.object({

  companyName: z.string({
    required_error: "Company name is required"
  })
    .trim()
    .min(2, "Company name must be at least 2 characters"),

  firstName: z.string({
    required_error: "First Name is required"
  })
    .trim()
    .min(2, "First Name must be at least 2 characters"),

  lastName: z.string({
    required_error: "Last Name is required"
  })
    .trim()
    .min(2, "Last Name must be at least 2 characters"),

  userName: z.string({
    required_error: "Username is required",
  })
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9._]+$/,
      "Username can contain only letters, numbers, dot (.) and underscore (_)"
    ),

  email: z.string({
    required_error: "Email is required"
  })
    .trim()
    .email("Invalid email")
    .transform((val) => val.toLowerCase()),

  phone: z.string({
    required_error: "Phone number is required"
  })
    .regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),

  password: z.string({
    required_error: "Password is required"
  })
    .min(8, "Password must be at least 8 characters"),

  confirmPassword: z.string({
    required_error: "Confirm password is required"
  }),

  termsAccepted: z.literal(true, {
    errorMap: () => ({
      message: "You must accept Terms of Service and Privacy Policy"
    })
  })

}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

module.exports = { userRegisterSchema };