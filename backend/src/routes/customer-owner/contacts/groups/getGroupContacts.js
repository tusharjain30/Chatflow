const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { groupId } = req.validatedParams;
    const { page, limit, search } = req.validatedQuery;

    const skip = (page - 1) * limit;

    /* ---------------- CHECK GROUP ---------------- */
    const group = await prisma.contactGroup.findFirst({
      where: {
        id: groupId,
        accountId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!group) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Group not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    /* ---------------- FILTER ---------------- */
    const contactWhere = {
      accountId,
      isDeleted: false,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    /* ---------------- QUERY ---------------- */
    const [rows, total] = await Promise.all([
      prisma.contactGroupMap.findMany({
        where: {
          groupId,
          contact: contactWhere,
        },
        skip,
        take: limit,
        orderBy: {
          id: "desc",
        },
        include: {
          contact: {
            include: {
              customValues: {
                include: {
                  field: true,
                },
              },
            },
          },
        },
      }),

      prisma.contactGroupMap.count({
        where: {
          groupId,
          contact: contactWhere,
        },
      }),
    ]);

    const contacts = rows.map((r) => {
      const c = r.contact;

      return {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        email: c.email,
        country: c.country,
        languageCode: c.languageCode,
        isOptedOut: c.isOptedOut,
        createdAt: c.createdAt,

        customFields: Object.fromEntries(
          c.customValues.map((v) => [v.field.key, v.value])
        ),
      };
    });

    /* ---------------- RESPONSE ---------------- */
    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Group contacts fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        items: contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.log("Get group contacts error:", error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
