const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const uploadMediaToMeta = require("../../../../services/Meta/uploadMediaToMeta");

const RESPONSE_CODES = require("../../../../config/responseCode");

router.post("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;

        const {
            botName,
            triggerType,
            triggerValue,
            replyText,
            mediaType,
            isActive = true,
        } = req.body;

        if (!req.file) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Media file is required",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        const existingBot = await prisma.bot.findFirst({
            where: {
                userId,
                name: botName,
                isDeleted: false
            }
        });

        if (existingBot) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Bot with this name already exists",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        if (["DEFAULT", "WELCOME"].includes(triggerType)) {
            const existingTriggerBot = await prisma.bot.findFirst({
                where: {
                    userId,
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

        const mediaId = await uploadMediaToMeta({
            filePath: req.file.path,
            mimeType: req.file.mimetype,
            phoneNumberId: process.env.PHONE_NUMBER_ID,
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN
        });

        const result = await prisma.$transaction(async (tx) => {

            // Create Bot
            const bot = await tx.bot.create({
                data: {
                    userId,
                    name: botName,
                    botType: "SIMPLE",
                    triggerType,
                    triggerValue: triggerValue || null,
                    isActive
                }
            });

            // Create Bot Reply
            const reply = await tx.botReply.create({
                data: {
                    botId: bot.id,
                    name: `${botName} Media Reply`,
                    replyType: "MEDIA",
                    triggerType,
                    triggerValue: triggerValue || null,
                    bodyText: replyText || null,
                    isActive
                }
            });

            // Save Media Id
            const media = await tx.botReplyMedia.create({
                data: {
                    replyId: reply.id,
                    mediaType,
                    metaMediaId: mediaId || null
                }
            });

            return { bot, reply, media };
        });

        res.status(RESPONSE_CODES.POST).json({
            status: 1,
            message: "Media bot created successfully",
            statusCode: RESPONSE_CODES.POST,
            data: result
        });

    } catch (error) {
        console.log("Create Media Bot Reply Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
})

module.exports = router;