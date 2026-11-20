const { z } = require("zod");

const chatRefSchema = z
  .object({
    conversationId: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
  })
  .refine((value) => Boolean(value.conversationId || value.phone), {
    message: "Each chat requires conversationId or phone",
  });

const deleteConversationsSchema = z.object({
  chats: z.array(chatRefSchema).min(1, "Select at least one chat"),
});

module.exports = { deleteConversationsSchema };
