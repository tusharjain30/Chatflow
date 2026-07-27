const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.put("/", async (req, res) => {
    try {
        const { accountId } = req.auth;
        const { groupId, title, description } = req.body;

        // Check group exists
        const group = await prisma.contactGroup.findFirst({
            where: {
                id: groupId,
                accountId,
                isDeleted: false,
            },
        });

        if (!group) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Group not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            });
        }

        // Check duplicate group name for same user
        const isTitleExist = await prisma.contactGroup.findFirst({
            where: {
                accountId,
                id: {
                    not: groupId
                },
                title: {
                    equals: title,
                    mode: "insensitive"
                },
                isDeleted: false
            }
        });

        if (isTitleExist) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Group with this title already exists",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        // Update group
        const updatedGroup = await prisma.contactGroup.update({
            where: { id: groupId },
            data: {
                title,
                description,
                updatedAt: new Date()
            },
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Group updated successfully",
            statusCode: RESPONSE_CODES.GET,
            data: updatedGroup,
        });

    } catch (err) {
        console.error("Edit Group Error:", err);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;