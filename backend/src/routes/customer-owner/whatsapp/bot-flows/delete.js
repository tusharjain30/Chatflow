const RESPONSE_CODES = require("../../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.delete("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;
        const { botId } = req.body;

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

        await prisma.$transaction(async (tx) => {

            // Disable bot
            await tx.bot.update({
                where: { id: botId },
                data: {
                    isActive: false,
                    isDeleted: true,
                    updatedAt: new Date()
                }
            });

            // Soft delete bot replies (nodes)
            await tx.botReply.updateMany({
                where: { botId },
                data: {
                    isActive: false,
                    isDeleted: true
                }
            });

            await tx.botSession.updateMany({
                where: {
                    botId,
                    isActive: true
                },
                data: {
                    isActive: false,
                    expiresAt: new Date()
                }
            });

            // Unpublish all flows (optional but safe)
            await tx.botFlow.updateMany({
                where: { botId },
                data: {
                    isPublished: false,
                    updatedAt: new Date()
                }
            });
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Bot flow deleted successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {}
        });

    } catch (error) {
        console.log("Delete Bot Flow Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;