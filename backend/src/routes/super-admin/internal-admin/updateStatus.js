const express = require("express");
const router = express.Router();

const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.patch("/", async (req, res) => {
    try {

        const loggedInAdmin = req.admin;

        // 🔐 Only Super Admin
        if (loggedInAdmin.role?.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {},
            });
        }

        const { adminId, isActive } = req.body;

        if (loggedInAdmin.id === adminId) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "You cannot change your own status",
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

        const updatedAdmin = await prisma.admin.update({
            where: { id: adminId },
            data: {
                isActive,
            },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                updatedAt: true,
            },
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: `Admin ${isActive ? "activated" : "deactivated"} successfully`,
            statusCode: RESPONSE_CODES.GET,
            data: updatedAdmin,
        });

    } catch (error) {
        console.log("Update Admin Status Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: error.message || "Something went wrong while registering",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;