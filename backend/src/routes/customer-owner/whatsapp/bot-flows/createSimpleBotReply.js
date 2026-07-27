const RESPONSE_CODES = require("../../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;

        const { botId, name, replyText, parentNodeKey } = req.body;

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

        const isExistingBotName = await prisma.botReply.findFirst({
            where: {
                botId,
                name,
                isDeleted: false
            }
        });

        if (isExistingBotName) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Bot Reply with this name already exists",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        const parentNode = await prisma.botReply.findFirst({
            where: {
                botId,
                nodeKey: parentNodeKey,
                isDeleted: false
            }
        });

        if (!parentNode && parentNodeKey !== "START") {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Parent node does not exist",
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
                replyType: "SIMPLE",
                triggerType: "DEFAULT",
                bodyText: replyText,
                isActive: true,
                isDeleted: false
            }
        });

        res.status(RESPONSE_CODES.POST).json({
            status: 1,
            message: "Simple bot reply created successfully",
            statusCode: RESPONSE_CODES.POST,
            data: {
                replyId: reply.id,
                nodeKey: reply.nodeKey
            }
        });

    } catch (error) {
        console.log("Create Simple Bot Reply Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Failed to create simple bot reply",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;