const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { search, page, limit } = req.validatedQuery;

    const cleanSearch = search?.trim();

    const where = {
      accountId,
      isDeleted: false,
      ...(cleanSearch && {
        OR: [
          { name: { contains: cleanSearch, mode: "insensitive" } },
          { key: { contains: cleanSearch, mode: "insensitive" } },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [fields, total] = await prisma.$transaction([
      prisma.contactCustomField.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.contactCustomField.count({ where }),
    ]);

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Custom fields list fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        items: fields,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("Custom Field List Error:", err);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
