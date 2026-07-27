const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;

    let { page = 1, limit = 20, search, groupId, isOptedOut } = req.query;

    page = Math.max(1, Number(page) || 1);
    limit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (page - 1) * limit;

    const where = {
      accountId,
      isDeleted: false,
    };

    // Search
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Opt-out filter
    if (isOptedOut === "true") where.isOptedOut = true;
    if (isOptedOut === "false") where.isOptedOut = false;

    // Group filter
    if (groupId && !isNaN(Number(groupId))) {
      where.groups = {
        some: {
          groupId: Number(groupId),
        },
      };
    }

    const [list, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          groups: { include: { group: true } },
          customValues: { include: { field: true } },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    // Normalize
    const data = list.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      country: c.country,
      phone: c.phone,
      languageCode: c.languageCode,
      email: c.email,
      isOptedOut: c.isOptedOut,
      createdAt: c.createdAt,

      groups: c.groups.map((g) => ({
        id: g.group.id,
        title: g.group.title,
      })),

      customFields: Object.fromEntries(
        c.customValues.map((v) => [v.field.key, v.value]),
      ),
    }));

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Contacts fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        contacts: data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("List contacts error:", err);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
