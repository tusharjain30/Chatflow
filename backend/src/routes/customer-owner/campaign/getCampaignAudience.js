const express = require("express");
const router = express.Router();

import prisma from "../../../config/prisma";

const RESPONSE_CODES = require("../../../config/responseCode");

router.get("/", async (req, res) => {
  try {
    const { id } = req.validatedParams;
    let { page, limit, search } = req.validatedQuery;

    const { accountId } = req.auth;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    search = search?.trim();

    const skip = (page - 1) * limit;

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

    const where = {
      campaignId: id,
      campaign: { accountId },
    };

    if (search) {
      where.contact = {
        OR: [
          {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: search,
            },
          },
        ],
      };
    }

    const [audiences, total] = await Promise.all([
      prisma.campaignAudience.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              groups: {
                select: {
                  group: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.campaignAudience.count({ where }),
    ]);

    const formatted = audiences.map((audience) => ({
      id: audience.id,
      contactId: audience.contactId,
      name: `${audience.contact?.firstName || ""} ${audience.contact?.lastName || ""}`.trim(),
      phone: audience.contact?.phone,
      groups:
        audience.contact?.groups?.map((groupMap) => ({
          id: groupMap.group.id,
          name: groupMap.group.title,
        })) || [],
      status: audience.status,
      sentAt: audience.sentAt,
      deliveredAt: audience.deliveredAt,
      readAt: audience.readAt,
      failedAt: audience.failedAt,
      errorMessage: audience.errorMessage,
    }));

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Campaign audience fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        audience: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.log("Get Campaign Audience Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
