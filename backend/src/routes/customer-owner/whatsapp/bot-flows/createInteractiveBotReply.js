const RESPONSE_CODES = require("../../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const uploadMediaToMeta = require("../../../../services/Meta/uploadMediaToMeta");

router.post("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;

        const {
            botId,
            name,
            nodeKey,
            parentNodeKey,
            interactiveType,
            header,
            bodyText,
            footerText
        } = req.body;

        let finalBodyText = bodyText || "";

        /* ---------- HEADER TEXT ---------- */
        if (header?.type === "TEXT" && header.text) {
            finalBodyText = `*${header.text}*\n\n${finalBodyText}`;
        }

        if (header?.type !== "TEXT" && !req.file) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Media file is required",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        };

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


        const existingName = await prisma.botReply.findFirst({
            where: {
                botId,
                name,
                isDeleted: false
            }
        });

        if (existingName) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Bot reply with this name already exists",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        };

        /* ---------- CREATE BOT REPLY ---------- */
        const reply = await prisma.botReply.create({
            data: {
                botId,
                name: name,
                nodeKey,
                parentNodeKey,

                replyType: "INTERACTIVE",
                interactiveType,

                bodyText: finalBodyText,
                footerText: footerText,

                buttons,
                cta,
                list
            }
        });

        /* ---------- HEADER MEDIA ---------- */
        if (["IMAGE", "VIDEO", "DOCUMENT"].includes(header?.type)) {
            const mediaId = await uploadMediaToMeta({
                filePath: req.file.path,
                mimeType: req.file.mimetype,
                phoneNumberId: process.env.PHONE_NUMBER_ID,
                accessToken: process.env.WHATSAPP_ACCESS_TOKEN
            });

            await prisma.botReplyMedia.create({
                data: {
                    replyId: reply.id,
                    mediaType: header.type,
                    metaMediaId: mediaId
                }
            });
        }

        /* ---------- REPLY BUTTONS ---------- */
        if (interactiveType === "REPLY_BUTTONS") {
            await prisma.botReplyButton.createMany({
                data: buttons.map(btn => ({
                    replyId: reply.id,
                    label: btn.label,
                    payload: btn.payload,
                    order: btn.order
                }))
            });
        };

        /* ---------- CTA BUTTON ---------- */
        if (interactiveType === "CTA_URL") {
            await prisma.botReplyCTA.create({
                data: {
                    replyId: reply.id,
                    displayText: cta.displayText,
                    url: cta.url
                }
            });
        };

        /* ---------- LIST MESSAGE ---------- */
        if (interactiveType === "LIST") {
            const botReplyList = await prisma.botReplyList.create({
                data: {
                    replyId: reply.id,
                    buttonLabel: list.buttonLabel
                }
            });

            for (const section of list.sections) {
                const sec = await prisma.botReplyListSection.create({
                    data: {
                        listId: botReplyList.id,
                        title: section.title,
                        order: section.order
                    }
                });

                await prisma.botReplyListRow.createMany({
                    data: section.rows.map(row => ({
                        sectionId: sec.id,
                        title: row.title,
                        description: row.description,
                        rowId: row.rowId,
                        order: row.order
                    }))
                });
            }
        };

        res.status(RESPONSE_CODES.POST).json({
            status: 1,
            message: "Interactive bot reply created successfully",
            statusCode: RESPONSE_CODES.POST,
            data: reply
        });

    } catch (error) {
        console.log("Create Bot Flow Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Failed to create bot flow",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;