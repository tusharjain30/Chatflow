const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();
const RESPONSE_CODES = require("../../../config/responseCode");
const { mapTicket } = require("./mapTicket");

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { page = 1, limit = 50, search = "", status } =
      req.validatedQuery || req.query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      accountId,
      isDeleted: false,
    };

    if (status) {
      where.status = status;
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { subject: { contains: q, mode: "insensitive" } },
        { ref: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, tickets] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limitNum,
      }),
    ]);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Support tickets loaded",
      statusCode: RESPONSE_CODES.GET,
      data: {
        tickets: tickets.map(mapTicket),
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (error) {
    console.log("Support ticket list error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
