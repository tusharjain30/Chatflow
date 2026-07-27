const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.put("/", async (req, res) => {
    try {

        const loggedInAdmin = req.admin;
        const { adminId, roleId } = req.body;

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
                message: "You cannot change your own role",
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

        if (!admin.isActive) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Admin account is inactive",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {},
            });
        }

        const role = await prisma.role.findFirst({
            where: {
                id: roleId,
                isDeleted: false,
                isActive: true,
            },
        });

        if (!role) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Role not found or inactive",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {},
            });
        }

        if (role.roleType === "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "SYSTEM_ADMIN role cannot be assigned via API",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {},
            });
        }

        const updatedAdmin = await prisma.admin.update({
            where: { id: adminId },
            data: {
                roleId: role.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                        roleType: true,
                    },
                },
                updatedAt: true,
            },
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Role assigned to admin successfully",
            statusCode: RESPONSE_CODES.GET,
            data: updatedAdmin,
        });

    } catch (error) {
        console.log("Assign role error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {},
        });
    }
});

module.exports = router;