const RESPONSE_CODES = require("../../../../config/responseCode");

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;

        const {
            page = 1,
            limit = 10,
            search,
            botType,
            triggerType,
            isActive,
        } = req.validatedQuery;

        const skip = (page - 1) * limit;

        const where = {
            userId,
            isDeleted: false,
            ...(typeof isActive === "boolean" && { isActive }),
            ...(botType && { botType }),
            ...(triggerType && { triggerType }),
            ...(search && {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            }),
        };

        const [bots, total] = await Promise.all([
            prisma.bot.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    replies: {
                        where: {
                            isDeleted: false,
                        },
                        orderBy: { createdAt: "asc" },
                        take: 1,
                        select: {
                            id: true,
                            replyType: true,
                            interactiveType: true,
                        },
                    },
                },
            }),
            prisma.bot.count({ where }),
        ]);

        const list = bots.map((bot) => ({
            botId: bot.id,
            name: bot.name,
            botType: bot.botType,
            triggerType: bot.triggerType,
            triggerValue: bot.triggerValue,
            isActive: bot.isActive,
            createdAt: bot.createdAt,

            // UI NEEDS THIS
            replyId: bot.replies[0]?.id || null,
            replyType: bot.replies[0]?.replyType || null,
            interactiveType: bot.replies[0]?.interactiveType || null,
        }));


        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Bots fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                list,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });

    } catch (error) {
        console.log("Get bot list error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Failed to fetch bots",
            statucCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;