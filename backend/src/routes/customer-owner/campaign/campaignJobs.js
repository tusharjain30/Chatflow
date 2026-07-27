const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.get("/", async (req, res) => {
  try {
    const { id } = req.validatedParams;
    let { page, limit } = req.validatedQuery;

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
    // Fetch Jobs + Count
    // =========================
    const [jobs, totalJobs, stats] = await Promise.all([
      prisma.campaignJob.findMany({
        where: { campaignId: id },
        skip,
        take: limit,
        orderBy: { batchNumber: "asc" },
      }),

      prisma.campaignJob.count({
        where: { campaignId: id },
      }),

      prisma.campaignJob.groupBy({
        by: ["status"],
        where: { campaignId: id },
        _count: true,
      }),
    ]);

    // =========================
    // Stats Formatting
    // =========================
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    stats.forEach((s) => {
      if (s.status === "PENDING") pending = s._count;
      if (s.status === "PROCESSING") processing = s._count;
      if (s.status === "COMPLETED") completed = s._count;
      if (s.status === "FAILED") failed = s._count;
    });

    const progress = totalJobs
      ? Math.round((completed / totalJobs) * 100)
      : 0;

    // =========================
    // Format Jobs
    // =========================
    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      batchNumber: job.batchNumber,
      totalRecords: job.totalRecords,
      status: job.status,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
    }));

    // =========================
    // Response
    // =========================
    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Campaign jobs fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        jobs: formattedJobs,

        stats: {
          total: totalJobs,
          pending,
          processing,
          completed,
          failed,
          progress, // % progress
        },

        pagination: {
          total: totalJobs,
          page,
          limit,
          totalPages: Math.ceil(totalJobs / limit),
        },
      },
    });
  } catch (error) {
    console.log("Campaign Jobs Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;