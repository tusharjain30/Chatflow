const RESPONSE_CODES = require("../../../../config/responseCode");
const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const accountId = req.apiContext?.accountId || req.auth?.accountId;
    const userId = req.apiContext?.userId || req.auth?.userId;

    const {
      name,
      bodyText,
      triggerType,
      triggerValue,
      isActive = true,
    } = req.body;

    const existingBot = await prisma.bot.findFirst({
      where: {
        accountId,
        name,
        isDeleted: false,
      },
    });

    if (existingBot) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Bot with this name already exists",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    if (["DEFAULT", "WELCOME"].includes(triggerType)) {
      const existingTriggerBot = await prisma.bot.findFirst({
        where: {
          accountId,
          triggerType,
          isActive: true,
          isDeleted: false,
        },
      });

      if (existingTriggerBot) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
          status: 0,
          message: `${triggerType} bot already exists`,
          statusCode: RESPONSE_CODES.BAD_REQUEST,
          data: {},
        });
      }
    }

    const entryNodeKey = "start";

    const result = await prisma.$transaction(async (tx) => {
      const bot = await tx.bot.create({
        data: {
          accountId,
          createdByUserId: userId,
          name,
          botType: "SIMPLE",
          triggerType,
          triggerValue: triggerValue || null,
          entryNodeKey,
          isActive,
        },
      });

      const reply = await tx.botReply.create({
        data: {
          botId: bot.id,
          accountId,
          name: `${name} Reply`,
          nodeKey: entryNodeKey,
          isStart: true,
          isEnd: true,
          replyType: "SIMPLE",
          triggerType,
          triggerValue: triggerValue || null,
          bodyText,
          isActive,
        },
      });

      return { bot, reply };
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Simple bot created successfully",
      statusCode: RESPONSE_CODES.POST,
      data: result,
    });
  } catch (error) {
    console.log("Create Simple Bot Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
