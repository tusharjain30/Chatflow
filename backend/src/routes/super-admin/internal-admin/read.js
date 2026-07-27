const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const admin = req.admin;
        let { page = 1, limit = 10, search = "", status, roleType } = req.validatedQuery;
        page = Number(page);
        limit = Number(limit);

        if (admin.role.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {}
            })
        };

        const skip = (page - 1) * limit;

        // Dynamic where clause
        const whereClause = {
            isDeleted: false,

            ...(status !== undefined && {
                isActive: status
            }),

            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search, mode: "insensitive" } }
                ]
            }),

            ...(roleType && {
                role: {
                    roleType: roleType
                }
            })
        };


        // Fetch data + count
        const [admins, total] = await Promise.all([
            prisma.admin.findMany({
                where: whereClause,
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
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: "desc"
                }
            }),
            prisma.admin.count({
                where: whereClause
            })
        ]);


        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Admin list fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                admins,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                },
            }
        });

    } catch (error) {
        console.log("Admin List Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;