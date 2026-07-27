const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const admin = req.admin;

        const profile = await prisma.admin.findFirst({
            where: {
                id: admin.id,
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
                role: {
                    select: {
                        id: true,
                        name: true,
                        roleType: true
                    }
                }
            }
        });

        if (!profile) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Admin not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            })
        }

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Profile fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: profile
        });

    } catch (error) {
        console.log("Admin Profile Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;