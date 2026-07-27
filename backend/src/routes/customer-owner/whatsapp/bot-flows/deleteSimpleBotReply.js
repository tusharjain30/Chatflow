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
                replyType: "SIMPLE",
                isDeleted: false,
                bot: {
                    userId,
                    isDeleted: false
                }
            }
        });

        if (!reply) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Simple bot reply not found",
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

        await prisma.botReply.update({
            where: { id: replyId },
            data: {
                isDeleted: true,
                isActive: false
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Simple bot reply deleted successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                replyId
            }
        });


    } catch (error) {
        console.log("Delete Simple Bot Reply Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Failed to update simple bot reply",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;