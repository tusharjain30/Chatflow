const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const requireAuth = require("../../../middleware/requireAuth");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const accountId = req.query.accountId;

    if (!accountId) {
      return res.status(400).json({
        status: 0,
        message: "accountId is required",
      });
    }

    // 🔥 PAGINATION + SEARCH
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    // ✅ Validate account belongs to reseller
    const account = await prisma.customerAccount.findFirst({
      where: {
        id: accountId,
        resellerId: req.auth.resellerId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Customer account not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    // 🔥 USERS QUERY
    const where = {
      accountId,
      isDeleted: false,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          role: {
            select: {
              id: true,
              name: true,
              roleType: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.user.count({ where }),
    ]);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Customer users fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        list: users.map((u) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          phone: u.phone,
          isActive: u.isActive,
          role: u.role?.roleType,
          createdAt: u.createdAt,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("CUSTOMER USERS ERROR:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;