const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const RESPONSE_CODES = require("../../../../config/responseCode");
const prisma = new PrismaClient();

router.put("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;

        const { botId, title, startTriggerSubject, isActive } = req.body;

        //  VERIFY BOT OWNERSHIP
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

        //  DUPLICATE TRIGGER CHECK
        const trigger = startTriggerSubject.toLowerCase();

        const duplicate = await prisma.bot.findFirst({
            where: {
                userId,
                triggerType: "KEYWORD",
                triggerValue: trigger,
                id: { not: botId },
                isDeleted: false
            }
        });

        if (duplicate) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Another bot already uses this trigger",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            })
        }

        // UPDATE BOT META
        await prisma.bot.update({
            where: { id: botId },
            data: {
                name: title,
                triggerValue: trigger,
                isActive: typeof isActive === "boolean" ? isActive : bot.isActive,
                updatedAt: new Date()
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Bot flow updated successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {}
        });

    } catch (error) {
        console.log("Edit Bot Flow Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Failed to update bot flow",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
})

module.exports = router;