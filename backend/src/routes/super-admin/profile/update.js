const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.put("/", async (req, res) => {
    try {

        const { id, role } = req.admin;
        const { name, userName, email, phone } = req.body;
        const adminId = id;
        const roleType = role.roleType;

        // Only super & internal admin allowed
        if (!["SYSTEM_ADMIN", "INTERNAL_ADMIN"].includes(roleType)) {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {}
            })
        }

        if (userName) {
            const exists = await prisma.admin.findFirst({
                where: {
                    userName,
                    id: { not: adminId },
                    isDeleted: false
                }
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

        const updatedAdmin = await prisma.admin.update({
            where: {
                id: adminId,
                isDeleted: false
            },
            data: {
                name,
                userName: userName || null,
                email,
                phone
            },
            select: {
                id: true,
                name: true,
                userName: true,
                email: true,
                phone: true,
                role: {
                    select: {
                        name: true,
                        roleType: true
                    }
                },
                updatedAt: true
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Profile updated successfully",
            statusCode: RESPONSE_CODES.GET,
            data: updatedAdmin
        });

    } catch (error) {
        console.log("Admin Update Profile Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;
