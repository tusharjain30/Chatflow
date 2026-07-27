const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const requireAuth = require("../../../middleware/requireAuth");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(403).json({ status: 0, message: "Forbidden" });
    }

    const resellerId = req.auth.resellerId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const where = {
      account: {
        resellerId,
        isDeleted: false,
      },
      isDeleted: false,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: { select: { roleType: true } },
          account: { select: { companyName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.user.count({ where }),
    ]);

    return res.json({
      status: 1,
      data: {
        list: users.map((u) => ({
          id: u.id,

          // ✅ AUDIT FIELDS
          type: "user",

          title: "User Created",

          description: `${u.firstName} ${u.lastName} added as ${
            u.role?.roleType || "User"
          }`,

          // useful UI fields
          companyName: u.account.companyName,
          email: u.email,
          roleType: u.role?.roleType,

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: "Server error" });
  }
});

module.exports = router;
