const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const uploadMediaToMeta = require("../../../../services/Meta/uploadMediaToMeta");

const RESPONSE_CODES = require("../../../../config/responseCode");

const generatePayload = (label) =>
    label
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, "");

router.put("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;
        const {
            replyId,
            replyType,
            replyText,
            triggerType,
            triggerValue,
            interactiveType,
            buttons,
            cta,
            list,
            mediaType,
            isActive = true,
        } = req.body;

        const reply = await prisma.botReply.findFirst({
            where: {
                id: replyId,
                isDeleted: false,
                bot: { userId },
            },
            include: {
                media: true,
                buttons: true,
                ctaButton: true,
                listMessage: {
                    include: {
                        sections: {
                            include: { rows: true },
                        },
                    },
                },
            },
        });

        if (!reply) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Bot reply not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {},
            });
        }

        await prisma.$transaction(async (tx) => {
            // COMMON UPDATE (ALL TYPES)
            await tx.botReply.update({
                where: { id: replyId },
                data: {
                    bodyText: replyText ?? reply.bodyText,
                    triggerType,
                    triggerValue: triggerValue || null,
                    isActive,
                    interactiveType:
                        replyType === "INTERACTIVE" ? interactiveType : null,
                },
            });

            // SIMPLE → nothing more
            if (replyType === "SIMPLE") return;

            // MEDIA
            if (replyType === "MEDIA") {
                let metaMediaId = reply.media?.metaMediaId;

                if (req.file) {
                    metaMediaId = await uploadMediaToMeta({
                        filePath: req.file.path,
                        mimeType: req.file.mimetype,
                        phoneNumberId: process.env.PHONE_NUMBER_ID,
                        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
                    });
                }

                if (reply.media) {
                    await tx.botReplyMedia.update({
                        where: { replyId },
                        data: {
                            mediaType,
                            metaMediaId,
                        },
                    });
                } else {
                    await tx.botReplyMedia.create({
                        data: {
                            replyId,
                            mediaType,
                            metaMediaId,
                        },
                    });
                }
            }

            // INTERACTIVE
            if (replyType === "INTERACTIVE") {
                // Clear old interactive data
                await tx.botReplyButton.deleteMany({ where: { replyId } });
                await tx.botReplyCTA.deleteMany({ where: { replyId } });

                await tx.botReplyListRow.deleteMany({
                    where: { section: { list: { replyId } } },
                });
                await tx.botReplyListSection.deleteMany({
                    where: { list: { replyId } },
                });
                await tx.botReplyList.deleteMany({
                    where: { replyId },
                });

                // Recreate based on interactiveType
                if (interactiveType === "REPLY_BUTTONS") {
                    for (let i = 0; i < buttons.length; i++) {
                        await tx.botReplyButton.create({
                            data: {
                                replyId,
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
                            replyId,
                            displayText: cta.text,
                            url: cta.url,
                        },
                    });
                }

                if (interactiveType === "LIST") {
                    const listMsg = await tx.botReplyList.create({
                        data: {
                            replyId,
                            buttonLabel: list.buttonLabel,
                        },
                    });

                    for (let s = 0; s < list.sections.length; s++) {
                        const section = await tx.botReplyListSection.create({
                            data: {
                                listId: listMsg.id,
                                title: list.sections[s].title,
                                order: s + 1,
                            },
                        });

                        for (let r = 0; r < list.sections[s].rows.length; r++) {
                            await tx.botReplyListRow.create({
                                data: {
                                    sectionId: section.id,
                                    title: list.sections[s].rows[r].title,
                                    description: list.sections[s].rows[r].description,
                                    rowId: list.sections[s].rows[r].rowId,
                                    order: r + 1,
                                },
                            });
                        }
                    }
                }

                // Optional media inside interactive
                if (mediaType && req.file) {
                    const metaMediaId = await uploadMediaToMeta({
                        filePath: req.file.path,
                        mimeType: req.file.mimetype,
                        phoneNumberId: process.env.PHONE_NUMBER_ID,
                        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
                    });

                    if (reply.media) {
                        await tx.botReplyMedia.update({
                            where: { replyId },
                            data: { mediaType, metaMediaId },
                        });
                    } else {
                        await tx.botReplyMedia.create({
                            data: { replyId, mediaType, metaMediaId },
                        });
                    }
                }
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Bot reply updated successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {},
        });

    } catch (error) {
        console.log("Update Bot Reply Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;