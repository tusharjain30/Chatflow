const express = require("express");
const router = express.Router();

import prisma from "../../../config/prisma";

const RESPONSE_CODES = require("../../../config/responseCode");

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;

    let { page, limit, search, status, tab } = req.validatedQuery;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // =========================
    // Filters
    // =========================
    const where = {
      accountId,
      isDeleted: false,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (status) {
      where.status = status;
    }

    if (tab && tab !== "all") {
      const tabStatusMap = {
        active: ["RUNNING"],
        scheduled: ["SCHEDULED"],
        completed: ["COMPLETED"],
        draft: ["DRAFT"],
      };

      const statuses = tabStatusMap[tab];

      if (statuses?.length) {
        where.status = {
          in: statuses,
        };
      }
    }

    // =========================
    // Fetch Data
    // =========================
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              audiences: true,
            },
          },
        },
      }),

      prisma.campaign.count({ where }),
    ]);

    // =========================
    // Format Response
    // =========================
    const formatted = campaigns.map((c) => {
      const totalContacts = c.totalContacts || 0;
      const sent = c.sentCount || 0;

      const progress = totalContacts
        ? Math.round((sent / totalContacts) * 100)
        : 0;

      return {
        id: c.id,
        name: c.name,
        status: c.status,

        totalContacts,
        audienceCount: c._count.audiences,

        sentCount: sent,
        deliveredCount: c.deliveredCount,
        readCount: c.readCount,
        failedCount: c.failedCount,

        progress,

        template: c.template,

        isScheduled: c.isScheduled,
        scheduledAt: c.scheduledAt,
        startedAt: c.startedAt,
        completedAt: c.completedAt,
        createdAt: c.createdAt,
      };
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Campaign list fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        campaigns: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          status: status || null,
          tab: tab || "all",
        },
      },
    });
  } catch (error) {
    console.log("Get Campaigns Error:", error);

    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
