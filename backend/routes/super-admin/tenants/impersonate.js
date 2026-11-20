const express = require("express");
const jwt = require("jsonwebtoken");
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { pickOwner, requireSystemAdmin } = require("./_helpers");

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });

router.post("/", async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res, RESPONSE_CODES)) return;

    const { id } = req.params;

    const account = await prisma.customerAccount.findFirst({
      where: { id, isDeleted: false },
      include: {
        users: {
          where: { isDeleted: false, isActive: true },
          include: { role: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Tenant not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    if (!account.isActive) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Cannot impersonate a suspended tenant",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const targetUser = pickOwner(account.users);
    if (!targetUser) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "No active owner available for impersonation",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const token = jwt.sign(
      {
        userType: "USER",
        userId: targetUser.id,
        accountId: targetUser.accountId,
        role: targetUser.role?.roleType,
        tokenVersion: targetUser.tokenVersion,
        impersonatedBy: {
          adminId: req.admin.id,
          adminName: `${req.admin.firstName} ${req.admin.lastName}`.trim(),
          adminEmail: req.admin.email,
        },
      },
      process.env.USER_JWT_SECRET,
      { expiresIn: "8h" },
    );

    await prisma.customerAccount.update({
      where: { id },
      data: {
        statusChangedAt: new Date(),
        statusReason: `Impersonation started by ${req.admin.email} at ${new Date().toISOString()}`,
      },
    });

    console.log(
      `[AUDIT] Impersonation: admin=${req.admin.email} tenant=${account.companyName} user=${targetUser.email}`,
    );

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Impersonation token issued",
      statusCode: RESPONSE_CODES.POST,
      data: {
        token,
        accountId: account.id,
        companyName: account.companyName,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
        },
        audited: true,
      },
    });
  } catch (error) {
    console.log("TENANT IMPERSONATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
