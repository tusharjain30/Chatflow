const express = require("express");
const bcrypt = require("bcrypt");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

const buildUserName = (companyName, ownerEmail) => {
  const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 10);
  const emailSlug = ownerEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8);
  return `${companySlug || "client"}${emailSlug || "owner"}${Date.now().toString().slice(-4)}`;
};

router.post("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const {
      companyName,
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
      planId,
    } = req.body;

    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    const normalizedEmail = ownerEmail.toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        isDeleted: false,
        OR: [{ email: normalizedEmail }, { phone: ownerPhone }],
      },
    });

    if (existingUser) {
      return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
        status: 0,
        message: "A customer owner with this email or phone already exists",
        statusCode: RESPONSE_CODES.ALREADY_EXIST,
        data: {},
      });
    }

    const ownerRole = await prisma.role.findFirst({
      where: {
        roleType: "CUSTOMER_OWNER",
        isDeleted: false,
      },
    });

    const created = await prisma.$transaction(async (tx) => {
      const account = await tx.customerAccount.create({
        data: {
          companyName,
          resellerId: req.auth.resellerId,
        },
      });

      const user = await tx.user.create({
        data: {
          firstName: ownerFirstName,
          lastName: ownerLastName,
          userName: buildUserName(companyName, normalizedEmail),
          email: normalizedEmail,
          phone: ownerPhone,
          password: hashedPassword,
          isVerified: true,
          roleId: ownerRole?.id,
          accountId: account.id,
        },
      });

      let subscription = null;
      if (planId) {
        subscription = await tx.subscription.create({
          data: {
            accountId: account.id,
            planId,
            isActive: true,
          },
          include: {
            plan: true,
          },
        });
      }

      return {
        account,
        user,
        subscription,
      };
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Customer created successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        id: created.account.id,
        companyName: created.account.companyName,
        isActive: created.account.isActive,
        owner: {
          id: created.user.id,
          firstName: created.user.firstName,
          lastName: created.user.lastName,
          email: created.user.email,
          phone: created.user.phone,
        },
        subscription: created.subscription,
      },
    });
  } catch (error) {
    console.error("RESELLER CUSTOMER CREATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
