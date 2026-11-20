const express = require("express");
const bcrypt = require("bcrypt");
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { requireSystemAdmin, mapTenantListItem } = require("./_helpers");

const prisma = new PrismaClient();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res, RESPONSE_CODES)) return;

    const body = req.body;
    const email = String(body.ownerEmail || "").trim().toLowerCase();
    const phone = String(body.ownerPhone || "").trim();
    const userName =
      email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "") +
      Math.floor(Math.random() * 1000);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
        isDeleted: false,
      },
    });
    if (existing) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Owner email or phone already exists",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const ownerRole = await prisma.role.findFirst({
      where: { roleType: "CUSTOMER_OWNER", isDeleted: false, isActive: true },
    });
    if (!ownerRole) {
      return res.status(RESPONSE_CODES.ERROR).json({
        status: 0,
        message: "CUSTOMER_OWNER role is not configured",
        statusCode: RESPONSE_CODES.ERROR,
        data: {},
      });
    }

    if (body.planId) {
      const plan = await prisma.plan.findFirst({
        where: { id: body.planId, isDeleted: false, isActive: true },
      });
      if (!plan) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
          status: 0,
          message: "Selected plan not found",
          statusCode: RESPONSE_CODES.BAD_REQUEST,
          data: {},
        });
      }
    }

    const hashed = await bcrypt.hash(body.ownerPassword, 10);
    const trialDays = Number(body.trialDays || 14);
    const lifecycleStatus = body.lifecycleStatus || "TRIAL";
    const trialEndsAt =
      lifecycleStatus === "TRIAL"
        ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
        : null;

    const created = await prisma.$transaction(async (tx) => {
      const account = await tx.customerAccount.create({
        data: {
          companyName: body.companyName.trim(),
          resellerId: body.resellerId || null,
          address: body.address || null,
          city: body.city || null,
          state: body.state || null,
          zipCode: body.zipCode || null,
          country: body.country || null,
          timezone: body.timezone || "UTC",
          lifecycleStatus,
          trialEndsAt,
          isActive: true,
          statusChangedAt: new Date(),
          statusReason: `Created by super admin ${req.admin.email}`,
        },
      });

      await tx.user.create({
        data: {
          firstName: body.ownerFirstName.trim(),
          lastName: body.ownerLastName.trim(),
          userName,
          email,
          phone,
          password: hashed,
          roleId: ownerRole.id,
          accountId: account.id,
          isActive: true,
          isVerified: true,
        },
      });

      if (body.planId) {
        await tx.subscription.create({
          data: {
            accountId: account.id,
            planId: body.planId,
            isActive: true,
            startDate: new Date(),
          },
        });
      }

      return account;
    });

    const full = await prisma.customerAccount.findUnique({
      where: { id: created.id },
      include: {
        reseller: { select: { id: true, companyName: true } },
        users: {
          where: { isDeleted: false },
          include: { role: true },
        },
        subscriptions: {
          where: { isActive: true },
          include: { plan: true },
          take: 1,
        },
        _count: {
          select: {
            users: true,
            whatsAppAccounts: true,
            messageLogs: true,
          },
        },
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Tenant created successfully",
      statusCode: RESPONSE_CODES.POST,
      data: mapTenantListItem(full, {
        usersCount: full._count.users,
        whatsappCount: full._count.whatsAppAccounts,
        messagesCount: full._count.messageLogs,
      }),
    });
  } catch (error) {
    console.log("TENANT CREATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: error.message || "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
