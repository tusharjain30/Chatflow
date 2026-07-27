const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.get("/", async (req, res) => {
  try {
    const { id } = req.validatedParams;
    let { page, limit, type } = req.validatedQuery;

    const { accountId } = req.auth;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // =========================
    // Validate Campaign
    // =========================
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        accountId,
        isDeleted: false,
      },
    });

    if (!campaign) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Campaign not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    // =========================
    // Filters
    // =========================
    const where = {
      campaignId: id,
    };

    if (type) {
      where.type = type;
    }

    // =========================
    // Fetch Logs
    // =========================
    const [logs, total] = await Promise.all([
      prisma.campaignLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.campaignLog.count({ where }),
    ]);

    // =========================
    // Format Response
    // =========================
    const formatted = logs.map((log) => ({
      id: log.id,
      type: log.type,
      message: log.message,
      createdAt: log.createdAt,
    }));

    // =========================
    // Response
    // =========================
    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Campaign logs fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        logs: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.log("Campaign Logs Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
