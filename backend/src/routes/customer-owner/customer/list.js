const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const { page = 1, limit = 10, search, isActive, isVerified } = req.validatedQuery;

        const skip = (page - 1) * limit;

        const where = {
            isDeleted: false,
            ...(typeof isActive === "boolean" && { isActive }),
            ...(typeof isVerified === "boolean" && { isVerified }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search } },
                ],
            }),
        };

        const [items, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    isActive: true,
                    isVerified: true,
                    createdAt: true
                },
            }),
            prisma.user.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Customers fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                items,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
            },
        });

    } catch (error) {
        console.log("Get all customers error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;