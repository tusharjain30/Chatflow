const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../../config/responseCode");

/* ================================
   GET ALL TEMPLATES (PAGINATED)
================================ */
router.get("/", async (req, res) => {
    try {
        const { accountId } = req.auth;

        let {
            page = 1,
            limit = 10,
            search = "",
            status,
            category
        } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        const skip = (page - 1) * limit;

        /* ---------- FILTER BUILD ---------- */
        const where = {
            accountId,
            isDeleted: false,
        };

        if (status) {
            where.status = status;
        }

        if (category) {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { body: { contains: search, mode: "insensitive" } },
            ];
        }

        /* ---------- QUERY ---------- */
        const [items, total] = await Promise.all([
            prisma.template.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    category: true,
                    language: true,
                    status: true,
                    rejectReason: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    metaTemplateId: true,
                    header: true,
                    footer: true,
                    buttons: true,
                }
            }),
            prisma.template.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Templates loaded",
            statusCode: RESPONSE_CODES.GET,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            },
        });

    } catch (err) {
        console.error("Get templates error:", err);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;

