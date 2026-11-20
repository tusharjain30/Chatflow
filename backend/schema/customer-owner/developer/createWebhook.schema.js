const { z } = require("zod");

const WEBHOOK_EVENTS = [
  "Message.Received",
  "Message.Sent",
  "Message.Status.Update",
  "Contact.Created",
  "Contact.Updated",
  "Contact.Deleted",
  "Group.Created",
  "Group.Updated",
  "Group.Deleted",
  "Autoreply.Created",
  "Autoreply.Updated",
  "Autoreply.Deleted",
];

const createWebhookSchema = z.object({
  url: z.string().url("Enter a valid webhook URL"),
  events: z
    .array(z.enum(WEBHOOK_EVENTS))
    .min(1, "Select at least one event"),
});

module.exports = { createWebhookSchema, WEBHOOK_EVENTS };
