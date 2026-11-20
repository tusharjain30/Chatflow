const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const RESPONSE_CODES = require("../../../../config/responseCode");

function digitsOnly(value = "") {
  return String(value).replace(/\D/g, "");
}

router.post("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { chats } = req.body;

    const orFilters = [];

    for (const chat of chats) {
      if (chat.conversationId) {
        orFilters.push({ conversationId: chat.conversationId });
      }

      const phone = digitsOnly(chat.phone || "");
      if (phone) {
        orFilters.push({ to: { contains: phone } });
        orFilters.push({ from: { contains: phone } });
      }
    }

    if (orFilters.length === 0) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "No valid chats to delete",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const result = await prisma.messageLog.deleteMany({
      where: {
        accountId,
        OR: orFilters,
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message:
        result.count > 0
          ? "Chat(s) deleted successfully"
          : "No matching messages found",
      statusCode: RESPONSE_CODES.POST,
      data: {
        deletedMessages: result.count,
        requestedChats: chats.length,
      },
    });
  } catch (error) {
    console.log("Delete Conversations Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
