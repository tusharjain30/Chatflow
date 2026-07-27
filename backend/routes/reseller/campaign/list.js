const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { resellerId } = req.auth;
    const { page, limit, search, status, accountId } = req.validatedQuery;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      account: {
        resellerId,
        isDeleted: false,
        ...(accountId ? { id: accountId } : {}),
      },
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                account: {
                  companyName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                template: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [campaigns, total, accounts] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        include: {
          account: {
            select: {
              id: true,
              companyName: true,
              isActive: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          _count: {
            select: {
              audiences: true,
              logs: true,
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
      prisma.customerAccount.findMany({
        where: {
          resellerId,
          isDeleted: false,
        },
        select: {
          id: true,
          companyName: true,
        },
        orderBy: [{ companyName: "asc" }],
      }),
    ]);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller campaigns fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        campaigns: campaigns.map((campaign) => {
          const totalContacts = campaign.totalContacts || 0;
          const sentCount = campaign.sentCount || 0;

          return {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            status: campaign.status,
            account: campaign.account,
            template: campaign.template,
            totalContacts,
            audienceCount: campaign._count.audiences,
            sentCount,
            deliveredCount: campaign.deliveredCount,
            readCount: campaign.readCount,
            failedCount: campaign.failedCount,
            logCount: campaign._count.logs,
            progress: totalContacts ? Math.round((sentCount / totalContacts) * 100) : 0,
            isScheduled: campaign.isScheduled,
            scheduledAt: campaign.scheduledAt,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
            createdAt: campaign.createdAt,
          };
        }),
        accounts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("RESELLER CAMPAIGN LIST ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
