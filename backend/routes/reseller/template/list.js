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
    const { page, limit, search, accountId, status, category } = req.validatedQuery;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      account: {
        resellerId,
        isDeleted: false,
        ...(accountId ? { id: accountId } : {}),
      },
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { body: { contains: search, mode: "insensitive" } },
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

    const [templates, total, usageRows, accounts] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          category: true,
          language: true,
          body: true,
          header: true,
          footer: true,
          buttons: true,
          status: true,
          rejectReason: true,
          metaTemplateId: true,
          createdAt: true,
          updatedAt: true,
          account: {
            select: {
              id: true,
              companyName: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              campaigns: true,
            },
          },
        },
      }),
      prisma.template.count({ where }),
      prisma.messageLog.groupBy({
        by: ["templateId"],
        where: {
          templateId: { not: null },
          account: {
            resellerId,
            isDeleted: false,
            ...(accountId ? { id: accountId } : {}),
          },
        },
        _count: {
          _all: true,
        },
        _max: {
          createdAt: true,
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

    const usageByTemplateId = new Map(
      usageRows.map((row) => [
        row.templateId,
        {
          count: row._count._all,
          lastUsedAt: row._max.createdAt,
        },
      ]),
    );

    const items = templates.map((template) => {
      const usage = usageByTemplateId.get(template.id) || {
        count: 0,
        lastUsedAt: null,
      };

      return {
        id: template.id,
        name: template.name,
        category: template.category,
        language: template.language,
        body: template.body,
        header: template.header,
        footer: template.footer,
        buttons: template.buttons,
        status: template.status,
        rejectReason: template.rejectReason,
        metaTemplateId: template.metaTemplateId,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        account: template.account,
        campaignCount: template._count.campaigns,
        usageCount: usage.count,
        lastUsedAt: usage.lastUsedAt,
      };
    });

    const summary = {
      total: items.length,
      approved: items.filter((item) => item.status === "APPROVED").length,
      pending: items.filter((item) => ["DRAFT", "SUBMITTED"].includes(item.status)).length,
      rejected: items.filter((item) => item.status === "REJECTED").length,
      totalUsage: items.reduce((sum, item) => sum + item.usageCount, 0),
    };

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller templates fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        items,
        accounts,
        summary,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("RESELLER TEMPLATE LIST ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
