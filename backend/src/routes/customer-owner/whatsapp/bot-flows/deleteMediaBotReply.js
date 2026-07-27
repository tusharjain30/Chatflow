const RESPONSE_CODES = require("../../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.delete("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;
        const { replyId } = req.body;

        const reply = await prisma.botReply.findFirst({
            where: {
                id: replyId,
                isDeleted: false,
                replyType: "MEDIA",
                bot: {
                    userId
                }
            }
        });

        if (!reply) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Media bot reply not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            });
        }

        const hasChildren = await prisma.botReply.findFirst({
            where: {
                parentNodeKey: reply.nodeKey,
                isDeleted: false
            }
        });

        if (hasChildren) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Cannot delete reply with child nodes. Delete child replies first.",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        await prisma.$transaction([
            prisma.botReply.update({
                where: { id: replyId },
                data: {
                    isDeleted: true,
                    isActive: false
                }
            }),
            prisma.botReplyMedia.delete({
                where: { replyId }
            })
        ]);

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Media bot reply deleted successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {}
        });

    } catch (error) {
        console.log("Delete Media Bot Reply Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Failed to delete Media bot reply",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;