const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.put("/", async (req, res) => {
    try {

        const admin = req.admin;
        const { id, name, isActive = true } = req.body;

        if (admin.role?.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {},
            });
        }

        const role = await prisma.role.findFirst({
            where: {
                id,
                isDeleted: false
            }
        });

        if (!role) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Role not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {},
            });
        }

        const roleName = name.trim().toUpperCase();
        const isNameExists = await prisma.role.findFirst({
            where: {
                name: roleName,
                id: { not: id },
                isDeleted: false,
            },
        });

        if (isNameExists) {
            return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
                status: 0,
                message: "Role name already exists",
                statusCode: RESPONSE_CODES.ALREADY_EXIST,
                data: {},
            });
        }

        const updatedRole = await prisma.role.update({
            where: { id: id },
            data: {
                name: roleName,
                ...(typeof isActive === "boolean" && { isActive }),
            },
            select: {
                id: true,
                name: true,
                roleType: true,
                isActive: true,
                updatedAt: true,
            },
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Role updated successfully",
            statusCode: RESPONSE_CODES.GET,
            data: updatedRole,
        });

    } catch (error) {
        console.log("Update role error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {},
        });
    }
});

module.exports = router;