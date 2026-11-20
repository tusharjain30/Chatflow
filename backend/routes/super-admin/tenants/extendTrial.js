const express = require("express");
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { requireSystemAdmin } = require("./_helpers");

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });

router.post("/", async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res, RESPONSE_CODES)) return;

    const { id } = req.params;
    const days = Number(req.body.days || 7);

    const account = await prisma.customerAccount.findFirst({
      where: { id, isDeleted: false },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Tenant not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const base =
      account.trialEndsAt && new Date(account.trialEndsAt) > new Date()
        ? new Date(account.trialEndsAt)
        : new Date();
    const trialEndsAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.customerAccount.update({
      where: { id },
      data: {
        lifecycleStatus: "TRIAL",
        isActive: true,
        trialEndsAt,
        statusChangedAt: new Date(),
        statusReason: `Trial extended by ${days} day(s) by ${req.admin.email}`,
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: `Trial extended by ${days} day(s)`,
      statusCode: RESPONSE_CODES.POST,
      data: {
        id: updated.id,
        trialEndsAt: updated.trialEndsAt,
        lifecycleStatus: updated.lifecycleStatus,
      },
    });
  } catch (error) {
    console.log("TENANT EXTEND TRIAL ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
