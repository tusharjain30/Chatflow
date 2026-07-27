const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const userId = req.user.id;

        const user = await prisma.user.findFirst({
            where: {
                id: userId,
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
                role: {
                    select: {
                        id: true,
                        name: true
                    },
                },
                subscriptions: {
                    where: { isActive: true },
                    orderBy: { startDate: "desc" },
                    take: 1,
                    select: {
                        id: true,
                        startDate: true,
                        endDate: true,
                        isActive: true,
                        plan: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                currency: true,
                                maxTemplates: true,
                                maxBots: true,
                                monthlyMessageLimit: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "User not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            });
        }

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Profile fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                ...user,
                subscriptions: user.subscriptions?.[0] || null
            }
        });

    } catch (error) {
        console.log("User Profile Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;