const { z } = require("zod");

const updateResellerCustomerSchema = z.object({
  accountId: z.string().uuid("Valid account id is required"),
  companyName: z.string().min(2, "Company name is required"),
  ownerFirstName: z.string().min(2, "Owner first name is required"),
  ownerLastName: z.string().min(1, "Owner last name is required"),
  ownerEmail: z.string().email("Valid owner email is required"),
  ownerPhone: z.string().min(8, "Valid owner phone is required"),
});

module.exports = { updateResellerCustomerSchema };
