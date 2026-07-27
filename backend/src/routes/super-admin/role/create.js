const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
    try {

        const admin = req.admin;
        const { name, roleType } = req.body;

        if (admin.role?.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied. Only Super Admin can create roles.",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {},
            });
        }

        const roleName = name.trim().toUpperCase();

        const existingRole = await prisma.role.findFirst({
            where: {
                name: roleName,
                isDeleted: false
            }
        });

        if (existingRole) {
            return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
                status: 0,
                message: "Role already exists",
                statusCode: RESPONSE_CODES.ALREADY_EXIST,
                data: {}
            })
        }

        // Create Role
        const role = await prisma.role.create({
            data: {
                name: roleName,
                roleType: roleType
            },
            select: {
                id: true,
                name: true,
                roleType: true,
                isActive: true,
                createdAt: true
            }
        });

        res.status(RESPONSE_CODES.POST).json({
            status: 1,
            message: "Role created successfully",
            statusCode: RESPONSE_CODES.POST,
            data: role
        });

    } catch (error) {
        console.log("Create roll error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;