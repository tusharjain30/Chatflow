const RESPONSE_CODES = require("../../../config/responseCode");

import prisma from "../../../config/prisma";

const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const loggedInAdmin = req.admin;
        let { adminId } = req.validatedParams;
        adminId = Number(adminId);

        if (loggedInAdmin.role.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {}
            })
        };

        if (!adminId) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Invalid admin id",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            })
        }

        const admin = await prisma.admin.findFirst({
            where: {
                id: adminId,
                isDeleted: false
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                roleId: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                        roleType: true
                    }
                }
            }
        });

        if (!admin) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Admin not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            })
        }

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Admin detail fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: admin
        });

    } catch (error) {
        console.log("Admin detail error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;
