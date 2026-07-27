const RESPONSE_CODES = require("../../../../config/responseCode");

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;
        const { id } = req.body;

        const bot = await prisma.bot.findFirst({
            where: {
                id: id,
                userId,
                isDeleted: false,
            },
            include: {
                replies: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: "asc" },
                    include: {
                        media: true,
                        buttons: {
                            orderBy: { order: "asc" },
                        },
                        ctaButton: true,
                        listMessage: {
                            include: {
                                sections: {
                                    orderBy: { order: "asc" },
                                    include: {
                                        rows: {
                                            orderBy: { order: "asc" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!bot) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Bot not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            });
        }

        // 🔁 Normalize replies for frontend
        const replies = bot.replies.map(reply => {
            const base = {
                id: reply.id,
                name: reply.name,
                replyType: reply.replyType,
                triggerType: reply.triggerType,
                triggerValue: reply.triggerValue,
                bodyText: reply.bodyText,
                footerText: reply.footerText,
                interactiveType: reply.interactiveType,
                isActive: reply.isActive,
            };

            if (reply.replyType === "MEDIA") {
                base.media = reply.media
                    ? {
                        mediaType: reply.media.mediaType,
                        metaMediaId: reply.media.metaMediaId,
                        fileUrl: reply.media.fileUrl,
                        mimeType: reply.media.mimeType,
                    }
                    : null;
            }

            if (reply.interactiveType === "REPLY_BUTTONS") {
                base.buttons = reply.buttons.map(btn => ({
                    id: btn.id,
                    label: btn.label,
                    payload: btn.payload,
                    order: btn.order,
                }));
            }

            if (reply.interactiveType === "CTA_URL") {
                base.cta = reply.ctaButton
                    ? {
                        text: reply.ctaButton.displayText,
                        url: reply.ctaButton.url,
                    }
                    : null;
            }

            if (reply.interactiveType === "LIST") {
                base.list = reply.listMessage
                    ? {
                        buttonLabel: reply.listMessage.buttonLabel,
                        sections: reply.listMessage.sections.map(section => ({
                            title: section.title,
                            order: section.order,
                            rows: section.rows.map(row => ({
                                title: row.title,
                                description: row.description,
                                rowId: row.rowId,
                                order: row.order,
                            })),
                        })),
                    }
                    : null;
            }

            return base;
        });



        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Bot fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                bot: {
                    id: bot.id,
                    name: bot.name,
                    botType: bot.botType,
                    triggerType: bot.triggerType,
                    triggerValue: bot.triggerValue,
                    isActive: bot.isActive,
                    createdAt: bot.createdAt,
                },
                replies,
            },
        });

    } catch (error) {
        console.log("Get bot by id error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Failed to fetch bot",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;