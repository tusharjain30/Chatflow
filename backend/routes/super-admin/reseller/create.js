const express = require("express");
const bcrypt = require("bcrypt");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

const buildUserName = (companyName, email) => {
  const companySlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 10);
  const emailSlug = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 8);
  return `${companySlug || "reseller"}${emailSlug || "user"}${Date.now()
    .toString()
    .slice(-4)}`;
};

router.post("/", async (req, res) => {
  try {
    if (req.admin.role?.roleType !== "SYSTEM_ADMIN") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Access denied",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const {
      companyName,
      firstName,
      lastName,
      email,
      phone,
      password,
      commissionRate,
      userName,
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const [existingReseller, existingAdmin, existingUser] = await Promise.all([
      prisma.reseller.findFirst({
        where: {
          OR: [{ email: normalizedEmail }, { phone }],
        },
      }),
      prisma.admin.findFirst({
        where: {
          isDeleted: false,
          OR: [{ email: normalizedEmail }, { phone }],
        },
      }),
      prisma.user.findFirst({
        where: {
          isDeleted: false,
          OR: [{ email: normalizedEmail }, { phone }],
        },
      }),
    ]);

    if (existingReseller || existingAdmin || existingUser) {
      return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
        status: 0,
        message: "Email or phone is already in use",
        statusCode: RESPONSE_CODES.ALREADY_EXIST,
        data: {},
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await prisma.reseller.create({
      data: {
        companyName: companyName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password: hashedPassword,
        commissionRate,
        userName: userName?.trim() || buildUserName(companyName, normalizedEmail),
        isActive: true,
        isDeleted: false,
        isVerified: true,
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Reseller created successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        id: created.id,
        companyName: created.companyName,
        firstName: created.firstName,
        lastName: created.lastName,
        email: created.email,
        phone: created.phone,
        commissionRate: created.commissionRate,
        isActive: created.isActive,
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    console.log("CREATE RESELLER ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
