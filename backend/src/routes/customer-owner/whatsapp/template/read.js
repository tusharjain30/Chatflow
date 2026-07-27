const RESPONSE_CODES = require("../../../../config/responseCode");
const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;

    let { page = 1, limit = 10, search = "", status, category } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const skip = (page - 1) * limit;

    const filters = {
      accountId,
      isDeleted: false,
    };

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      filters.status = status;
    }

    if (category) {
      filters.category = category;
    }

    const [total, templates] = await Promise.all([
      prisma.template.count({ where: filters }),
      prisma.template.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          category: true,
          language: true,
          body: true,
          header: true,
          footer: true,
          buttons: true,
          components: true,
          mediaFiles: true,
          builderData: true,
          metaTemplateId: true,
          rejectReason: true,
          status: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Templates fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        templates,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log("Template List Error:", error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
