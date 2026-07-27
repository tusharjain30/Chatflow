const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const uploadMediaToMeta = require("../../../../services/Meta/uploadMediaToMeta");

const RESPONSE_CODES = require("../../../../config/responseCode");

const generatePayload = (label) => {
    return label
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, "");
};

router.post("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;

        const {
            botName,
            triggerType,
            triggerValue,
            replyText,
            interactiveType,
            buttons,
            cta,
            list,
            mediaType,
            isActive = true,
        } = req.body;

        const existingBot = await prisma.bot.findFirst({
            where: {
                userId,
                name: botName,
                isDeleted: false
            }
        });

        if (existingBot) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Bot with this name already exists",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        if (["DEFAULT", "WELCOME"].includes(triggerType)) {
            const existingTriggerBot = await prisma.bot.findFirst({
                where: {
                    userId,
                    triggerType,
                    isActive: true,
                    isDeleted: false,
                },
            });

            if (existingTriggerBot) {
                return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                    status: 0,
                    message: `${triggerType} bot already exists`,
                    statusCode: RESPONSE_CODES.BAD_REQUEST,
                    data: {},
                });
            }
        }

        if (mediaType && !req.file) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Media file is required",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Create Bot
            const bot = await tx.bot.create({
                data: {
                    userId,
                    name: botName,
                    botType: "SIMPLE",
                    triggerType,
                    triggerValue: triggerValue || null,
                    isActive
                }
            });

            // Create Bot Reply
            const reply = await tx.botReply.create({
                data: {
                    botId: bot.id,
                    name: `${botName} Interactive Reply`,
                    replyType: "INTERACTIVE",
                    interactiveType,
                    triggerType,
                    triggerValue: triggerValue || null,
                    bodyText: replyText,
                    isActive
                }
            });

            if (mediaType) {
                const mediaId = await uploadMediaToMeta({
                    filePath: req.file.path,
                    mimeType: req.file.mimetype,
                    phoneNumberId: process.env.PHONE_NUMBER_ID,
                    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
                });

                await tx.botReplyMedia.create({
                    data: {
                        replyId: reply.id,
                        mediaType: mediaType,
                        metaMediaId: mediaId
                    }
                });
            }

            if (interactiveType === "REPLY_BUTTONS") {
                for (let i = 0; i < buttons.length; i++) {
                    await tx.botReplyButton.create({
                        data: {
                            replyId: reply.id,
                            label: buttons[i].label,
                            payload: generatePayload(buttons[i].label),
                            order: i + 1,
                        },
                    });
                }
            }

            if (interactiveType === "CTA_URL") {
                await tx.botReplyCTA.create({
                    data: {
                        replyId: reply.id,
                        displayText: cta.text,
                        url: cta.url
                    },
                });
            }

            if (interactiveType === "LIST") {
                const listMsg = await tx.botReplyList.create({
                    data: {
                        replyId: reply.id,
                        buttonLabel: list.buttonLabel
                    }
                });

                for (let s = 0; s < list.sections.length; s++) {
                    const section = await tx.botReplyListSection.create({
                        data: {
                            listId: listMsg.id,
                            title: list.sections[s].title,
                            order: s + 1
                        }
                    });

                    for (let r = 0; r < list.sections[s].rows.length; r++) {
                        await tx.botReplyListRow.create({
                            data: {
                                sectionId: section.id,
                                title: list.sections[s].rows[r].title,
                                description: list.sections[s].rows[r].description,
                                rowId: list.sections[s].rows[r].rowId,
                                order: r + 1
                            }
                        });
                    }
                }
            }

            return { bot, reply };
        });

        res.status(RESPONSE_CODES.POST).json({
            status: 1,
            message: "Advance interactive bot created successfully",
            statusCode: RESPONSE_CODES.POST,
            data: result
        });

    } catch (error) {
        console.log("Create Interactive Bot Reply Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;