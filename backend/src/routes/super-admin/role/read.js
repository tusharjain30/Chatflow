const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
    try {

        const admin = req.admin;

        const {
            page = 1,
            limit = 10,
            roleType,
            isActive,
            includeDeleted,
        } = req.query;

        if (admin.role?.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {},
            });
        }

        const skip = (page - 1) * limit;

        const where = {};

        if (roleType) where.roleType = roleType;
        if (typeof isActive === "boolean") where.isActive = isActive;
        if (!includeDeleted) where.isDeleted = false;

        const [roles, total] = await prisma.$transaction([
            prisma.role.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    roleType: true,
                    isActive: true,
                    isDeleted: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.role.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Roles fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                items: roles,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
            },
        });


    } catch (error) {
        console.log("Get all rolls error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;