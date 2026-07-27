const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const { v4: uuid } = require("uuid");

const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
    try {

        const loggedInAdmin = req.admin;
        const { adminId } = req.body;

        if (loggedInAdmin.role?.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {},
            });
        }

        if (loggedInAdmin.id === adminId) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "You cannot force logout yourself",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {},
            });
        }

        const admin = await prisma.admin.findFirst({
            where: {
                id: adminId,
                isDeleted: false,
            },
        });

        if (!admin) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Admin not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {},
            });
        }

        await prisma.admin.update({
            where: { id: adminId },
            data: {
                tokenVersion: uuid(),
            },
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Admin force logged out successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {},
        });


    } catch (error) {
        console.log("Force Logout Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;