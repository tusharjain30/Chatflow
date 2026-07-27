const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const { customerId } = req.body;

        const customer = await prisma.user.findFirst({
            where: {
                id: customerId,
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
                                currency: true
                            },
                        },
                    },
                },
            },
        });

        if (!customer) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Customer not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            });
        }

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Customer fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                ...customer,
                subscriptions: customer.subscriptions?.[0] || null
            }
        });

    } catch (error) {
        console.log("Get customer by id error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;