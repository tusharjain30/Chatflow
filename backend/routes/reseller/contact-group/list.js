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
    const { page, limit, search, accountId, isArchived } = req.validatedQuery;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      account: {
        resellerId,
        isDeleted: false,
        ...(accountId ? { id: accountId } : {}),
      },
      ...(typeof isArchived === "boolean" ? { isArchived } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              {
                account: {
                  companyName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [groups, total, archivedCount, allMatchingGroups, accounts] = await Promise.all([
      prisma.contactGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          isArchived: true,
          createdAt: true,
          updatedAt: true,
          accountId: true,
          account: {
            select: {
              id: true,
              companyName: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              contacts: true,
            },
          },
        },
      }),
      prisma.contactGroup.count({ where }),
      prisma.contactGroup.count({
        where: {
          ...where,
          isArchived: true,
        },
      }),
      prisma.contactGroup.findMany({
        where,
        select: {
          id: true,
          _count: {
            select: {
              contacts: true,
            },
          },
        },
      }),
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

    const groupIds = groups.map((group) => group.id);
    const groupMappings = groupIds.length
      ? await prisma.contactGroupMap.findMany({
          where: {
            groupId: { in: groupIds },
          },
          select: {
            groupId: true,
            contactId: true,
          },
        })
      : [];

    const contactIds = [...new Set(groupMappings.map((item) => item.contactId))];
    const audienceRows = contactIds.length
      ? await prisma.campaignAudience.findMany({
          where: {
            contactId: { in: contactIds },
            campaign: {
              isDeleted: false,
              account: {
                resellerId,
                isDeleted: false,
              },
            },
          },
          select: {
            campaignId: true,
            contactId: true,
            campaign: {
              select: {
                id: true,
                name: true,
                status: true,
                updatedAt: true,
              },
            },
          },
        })
      : [];

    const contactToGroups = new Map();
    groupMappings.forEach((mapping) => {
      const existing = contactToGroups.get(mapping.contactId) || [];
      existing.push(mapping.groupId);
      contactToGroups.set(mapping.contactId, existing);
    });

    const groupCampaignMap = new Map();
    audienceRows.forEach((row) => {
      const relatedGroups = contactToGroups.get(row.contactId) || [];
      relatedGroups.forEach((currentGroupId) => {
        const current = groupCampaignMap.get(currentGroupId) || new Map();
        current.set(row.campaignId, row.campaign);
        groupCampaignMap.set(currentGroupId, current);
      });
    });

    const items = groups.map((group) => {
      const campaigns = Array.from((groupCampaignMap.get(group.id) || new Map()).values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      return {
        id: group.id,
        title: group.title,
        description: group.description,
        isArchived: group.isArchived,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        account: group.account,
        audienceSize: group._count.contacts,
        campaignCount: campaigns.length,
        activeCampaignCount: campaigns.filter((campaign) =>
          ["RUNNING", "PAUSED", "SCHEDULED"].includes(campaign.status),
        ).length,
        lastCampaignAt: campaigns[0]?.updatedAt || null,
        recentCampaigns: campaigns.slice(0, 3).map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          updatedAt: campaign.updatedAt,
        })),
      };
    });

    const totalAudience = allMatchingGroups.reduce((sum, group) => sum + group._count.contacts, 0);
    const campaignHeavyGroups = [...items]
      .sort((a, b) => b.campaignCount - a.campaignCount || b.audienceSize - a.audienceSize)
      .slice(0, 8);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller contact groups fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        items,
        accounts,
        summary: {
          totalGroups: total,
          archivedGroups: archivedCount,
          totalAudience,
          averageAudienceSize: total ? Number((totalAudience / total).toFixed(1)) : 0,
        },
        campaignHighlights: campaignHeavyGroups,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("RESELLER CONTACT GROUP LIST ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
