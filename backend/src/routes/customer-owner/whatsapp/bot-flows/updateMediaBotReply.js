const RESPONSE_CODES = require("../../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const uploadMediaToMeta = require("../../../../services/Meta/uploadMediaToMeta");

router.put("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;
        let {
            replyId,
            name,
            mediaType,
            caption,
        } = req.body;

        replyId = Number(replyId);

        if (!req.file) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Media file is required",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        const reply = await prisma.botReply.findFirst({
            where: {
                id: replyId,
                isDeleted: false,
                bot: {
                    userId
                }
            },
            include: {
                media: true
            }
        });

        if (!reply || reply.replyType !== "MEDIA") {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Media bot reply not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            });
        }

        await prisma.botReply.update({
            where: { id: replyId },
            data: {
                ...(name && { name }),
                ...(caption !== undefined && { bodyText: caption })
            }
        });

        const mediaId = await uploadMediaToMeta({
            filePath: req.file.path,
            mimeType: req.file.mimetype,
            phoneNumberId: process.env.PHONE_NUMBER_ID,
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN
        });

        if (mediaId) {
            await prisma.botReplyMedia.update({
                where: { replyId },
                data: {
                    ...(mediaType && { mediaType }),
                    ...(mediaId && { metaMediaId: mediaId })
                }
            });
        }

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Media bot reply updated successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                replyId
            }
        });

    } catch (error) {
        console.log("Update Media Bot Reply Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Failed to update Media bot reply",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;