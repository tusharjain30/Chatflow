const RESPONSE_CODES = require("../../../../config/responseCode");

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.patch("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;
        const { id, isActive } = req.body;

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

        if (bot.isActive === isActive) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: `Bot is already ${isActive ? "active" : "inactive"}`,
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {},
            });
        }

        // Ensure single DEFAULT / WELCOME active bot
        if (
            isActive &&
            ["DEFAULT", "WELCOME"].includes(bot.triggerType)
        ) {
            const existing = await prisma.bot.findFirst({
                where: {
                    userId,
                    triggerType: bot.triggerType,
                    isActive: true,
                    isDeleted: false,
                    NOT: { id },
                },
            });

            if (existing) {
                return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                    status: 0,
                    message: `${bot.triggerType} bot already active`,
                    statusCode: RESPONSE_CODES.BAD_REQUEST,
                    data: {},
                });
            }
        }

        await prisma.$transaction(async (tx) => {
            // Update bot
            await tx.bot.update({
                where: { id },
                data: { isActive },
            });

            // Update all replies
            await tx.botReply.updateMany({
                where: { id, isDeleted: false },
                data: { isActive },
            });

            // Close sessions if deactivating
            if (!isActive) {
                await tx.botSession.updateMany({
                    where: { id, isActive: true },
                    data: { isActive: false },
                });
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: `Bot ${isActive ? "activated" : "deactivated"} successfully`,
            statusCode: RESPONSE_CODES.GET,
            data: {},
        });

    } catch (error) {
        console.log("Update Bot Status Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;