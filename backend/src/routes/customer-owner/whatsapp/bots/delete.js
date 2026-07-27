const RESPONSE_CODES = require("../../../../config/responseCode");

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.delete("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;
        const { id } = req.body;

        const bot = await prisma.bot.findFirst({
            where: {
                id,
                userId,
                isDeleted: false
            }
        });

        if (!bot) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Bot not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            })
        }

        await prisma.$transaction(async (tx) => {

            //  Soft delete bot
            await tx.bot.update({
                where: { id },
                data: {
                    isDeleted: true,
                    isActive: false,
                },
            });

            // Soft delete all replies
            await tx.botReply.updateMany({
                where: {
                    id,
                    isDeleted: false,
                },
                data: {
                    isDeleted: true,
                    isActive: false,
                },
            });

            // End active sessions
            await tx.botSession.updateMany({
                where: {
                    id,
                    isActive: true,
                },
                data: {
                    isActive: false,
                },
            });
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Bot deleted successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {}
        });

    } catch (error) {
        console.log("Delete bot error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;