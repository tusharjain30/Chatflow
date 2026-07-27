const RESPONSE_CODES = require("../../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const uploadMediaToMeta = require("../../../../services/Meta/uploadMediaToMeta");

router.post("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;

        let {
            botId,
            name,
            parentNodeKey,
            mediaType,
            caption
        } = req.body;

        botId = Number(botId);

        if (!req.file) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Media file is required",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        const bot = await prisma.bot.findFirst({
            where: {
                id: botId,
                userId,
                botType: "FLOW",
                isDeleted: false
            }
        });

        if (!bot) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Bot flow not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            });
        }

        if (parentNodeKey !== "START") {
            const parentNode = await prisma.botReply.findFirst({
                where: {
                    botId,
                    nodeKey: parentNodeKey,
                    isDeleted: false
                }
            });

            if (!parentNode) {
                return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                    status: 0,
                    message: "Parent node does not exist",
                    statusCode: RESPONSE_CODES.BAD_REQUEST,
                    data: {}
                });
            }
        }

        const existingName = await prisma.botReply.findFirst({
            where: {
                botId,
                name,
                isDeleted: false
            }
        });

        if (existingName) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Bot reply with this name already exists",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        const nodeKey = `NODE_${Date.now()}`;

        const reply = await prisma.botReply.create({
            data: {
                botId,
                name,
                nodeKey,
                parentNodeKey,
                replyType: "MEDIA",
                triggerType: "DEFAULT",
                bodyText: caption || null,
                isActive: true,
                isDeleted: false
            }
        });

        const mediaId = await uploadMediaToMeta({
            filePath: req.file.path,
            mimeType: req.file.mimetype,
            phoneNumberId: process.env.PHONE_NUMBER_ID,
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN
        });

        await prisma.botReplyMedia.create({
            data: {
                replyId: reply.id,
                mediaType,
                metaMediaId: mediaId
            }
        });

        res.status(RESPONSE_CODES.POST).json({
            status: 1,
            message: "Media bot reply created successfully",
            statusCode: RESPONSE_CODES.POST,
            data: {
                replyId: reply.id,
                nodeKey: reply.nodeKey
            }
        });


    } catch (error) {
        console.log("Create Media Bot Reply Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Failed to create media bot reply",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;