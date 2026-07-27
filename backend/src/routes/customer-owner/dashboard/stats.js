const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { accountId } = req.auth;

        if (!accountId) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Account context missing",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        const [
            totalContacts,
            totalGroups,
            totalTemplates,
            totalBots,
            totalBotReplies,
            activeTeamMembers,
            messagesInQueue,
            messagesProcessed,
        ] = await Promise.all([
            prisma.contact.count({
                where: { accountId, isDeleted: false },
            }),

            prisma.contactGroup.count({
                where: { accountId, isDeleted: false },
            }),

            prisma.template.count({
                where: { accountId, isDeleted: false },
            }),

            prisma.bot.count({
                where: { accountId, isDeleted: false },
            }),

            prisma.botReply.count({
                where: {
                    bot: {
                        accountId,
                    },
                    isDeleted: false,
                },
            }),

            prisma.user.count({
                where: {
                    accountId,
                    isDeleted: false,
                    isActive: true,
                },
            }),

            prisma.messageLog.count({
                where: {
                    accountId,
                    status: "PENDING",
                    direction: "OUTBOUND",
                },
            }),

            prisma.messageLog.count({
                where: {
                    accountId,
                    status: {
                        in: ["SENT", "DELIVERED", "READ"],
                    },
                    direction: "OUTBOUND",
                },
            }),
        ]);

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Dashboard stats loaded",
            statusCode: RESPONSE_CODES.GET,
            data: {
                totalContacts,
                totalGroups,
                totalTemplates,
                totalBots,
                totalBotReplies,
                activeTeamMembers,
                messagesInQueue,
                messagesProcessed,
                // Total Campaigns --> pending
            },
        });
    } catch (err) {
        console.error("DASHBOARD STATS ERROR:", err);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;