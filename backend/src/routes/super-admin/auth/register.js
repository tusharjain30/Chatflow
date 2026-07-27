const express = require("express");
const router = express.Router();

const RESPONSE_CODES = require("../../../config/responseCode");
const bcrypt = require("bcrypt");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
    try {

        const { name, email, phone, password, userName } = req.body;

        // Check if any SYSTEM_ADMIN already exists
        const existingSuperAdmin = await prisma.admin.findFirst({
            where: {
                role: {
                    roleType: "SYSTEM_ADMIN",
                },
                isDeleted: false,
            },
            include: {
                role: true,
            },
        });

        if (existingSuperAdmin) {
            return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
                status: 0,
                message: "Super Admin already exists. Registration is disabled.",
                statusCode: RESPONSE_CODES.ALREADY_EXIST,
                data: {}
            });
        }

        if (userName) {
            const exists = await prisma.admin.findFirst({
                where: {
                    userName,
                    isDeleted: false,
                },
            });

            if (exists) {
                return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
                    status: 0,
                    message: "Username already taken",
                    statusCode: RESPONSE_CODES.ALREADY_EXIST,
                    data: {}
                });
            }
        }

        // Ensure SYSTEM_ADMIN role exists
        let systemAdminRole = await prisma.role.findFirst({
            where: {
                roleType: "SYSTEM_ADMIN",
                isActive: true,
                isDeleted: false
            },
        });

        if (!systemAdminRole) {
            systemAdminRole = await prisma.role.create({
                data: {
                    name: "SYSTEM_ADMIN",
                    roleType: "SYSTEM_ADMIN",
                },
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create super admin
        const admin = await prisma.admin.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                userName: userName || null,
                isVerified: true,
                roleId: systemAdminRole.id,
            },
            include: {
                role: true,
            },
        });

        // (Optional) remove password from response
        const { password: _, ...adminSafe } = admin;

        res.status(RESPONSE_CODES.POST).json({
            status: 1,
            message: "Super Admin registered successfully",
            statusCode: RESPONSE_CODES.POST,
            data: adminSafe,
        });

    } catch (error) {
        console.error("Super Admin Register Error:", error);

        // Prisma unique constraint error
        if (error.code === "P2002") {
            return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
                status: 0,
                message: "Duplicate field value",
                statusCode: RESPONSE_CODES.ALREADY_EXIST,
                data: error.meta,
            });
        }

        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: error.message || "Something went wrong while registering",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;