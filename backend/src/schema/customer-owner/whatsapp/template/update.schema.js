const { z } = require("zod");

const locationDetailsSchema = z.object({
  placeName: z.string().optional(),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
}).optional();

const variableSamplesSchema = z.record(z.string()).optional();

const headerSchema = z.object({
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT", "LOCATION"]),
  text: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "TEXT" && !data.text) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["text"],
      message: "Header text is required for TEXT header",
    });
  }
});

const urlButton = z.object({
  type: z.literal("URL"),
  text: z.string().min(1),
  url: z.string().url(),
});

const quickReplyButton = z.object({
  type: z.literal("QUICK_REPLY"),
  text: z.string().min(1),
});

const callButton = z.object({
  type: z.literal("CALL"),
  text: z.string().min(1),
  phoneNumber: z.string().min(10),
});

const buttonsSchema = z.array(
  z.discriminatedUnion("type", [urlButton, quickReplyButton, callButton])
).max(3).optional();

const footerSchema = z.object({
  text: z.string().min(1),
}).optional();

const updateTemplateSchema = z.object({
  templateId: z.string({ required_error: "Template Id is required" }).uuid("Invalid template id"),
  name: z.string().min(3),
  category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
  language: z.string().default("en_US"),
  body: z.string().min(5),
  header: headerSchema.optional(),
  footer: footerSchema,
  buttons: buttonsSchema,
  variableSamples: variableSamplesSchema,
  locationDetails: locationDetailsSchema,
});

module.exports = { updateTemplateSchema };
