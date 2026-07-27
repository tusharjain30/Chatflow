const RESPONSE_CODES = require("../../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.put("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;
        const { replyId, name, replyText, isActive } = req.body;

        const reply = await prisma.botReply.findFirst({
            where: {
                id: replyId,
                isDeleted: false,
                replyType: "SIMPLE",
                bot: {
                    userId,
                    isDeleted: false
                }
            },
            include: {
                bot: true
            }
        });

        if (!reply) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Simple bot reply not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            });
        }

        const existingName = await prisma.botReply.findFirst({
            where: {
                botId: reply.botId,
                name,
                id: { not: replyId },
                isDeleted: false
            }
        });

        if (existingName) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Bot reply name already exists",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        const updatedReply = await prisma.botReply.update({
            where: { id: replyId },
            data: {
                name,
                bodyText: replyText,
                ...(typeof isActive === "boolean" && { isActive })
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Simple bot reply updated successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                replyId: updatedReply.id,
                nodeKey: updatedReply.nodeKey
            }
        });

    } catch (error) {
        console.log("Update Simple Bot Reply Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Failed to update simple bot reply",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;