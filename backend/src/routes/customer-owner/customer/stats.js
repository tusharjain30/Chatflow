const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const [
            totalCustomers,
            activeCustomers,
            inactiveCustomers,
            verifiedCustomers,
            unverifiedCustomers,
            deletedCustomers,
            todayCustomers,
            last7DaysCustomers,
            last30DaysCustomers
        ] = await prisma.$transaction([
            prisma.user.count({
                where: { isDeleted: false }
            }),

            prisma.user.count({
                where: {
                    isDeleted: false,
                    isActive: true
                }
            }),

            prisma.user.count({
                where: {
                    isDeleted: false,
                    isActive: false
                }
            }),

            prisma.user.count({
                where: {
                    isDeleted: false,
                    isVerified: true
                }
            }),

            prisma.user.count({
                where: {
                    isDeleted: false,
                    isVerified: false
                }
            }),

            prisma.user.count({
                where: { isDeleted: true }
            }),

            prisma.user.count({
                where: {
                    isDeleted: false,
                    createdAt: { gte: startOfToday }
                }
            }),

            prisma.user.count({
                where: {
                    isDeleted: false,
                    createdAt: { gte: last7Days },
                },
            }),

            prisma.user.count({
                where: {
                    isDeleted: false,
                    createdAt: { gte: last30Days },
                },
            }),
        ]);

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Customer stats fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                totalCustomers,
                activeCustomers,
                inactiveCustomers,
                verifiedCustomers,
                unverifiedCustomers,
                deletedCustomers,
                newCustomers: {
                    today: todayCustomers,
                    last7Days: last7DaysCustomers,
                    last30Days: last30DaysCustomers,
                },
            },
        });

    } catch (error) {
        console.log("Get Customer Stats Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;