const express = require("express");
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { requireSystemAdmin } = require("./_helpers");

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });

router.delete("/", async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res, RESPONSE_CODES)) return;

    const { id } = req.params;
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

    await prisma.$transaction(async (tx) => {
      await tx.customerAccount.update({
        where: { id },
        data: {
          isDeleted: true,
          isActive: false,
          statusChangedAt: new Date(),
          statusReason: `Soft deleted by super admin ${req.admin.email}`,
        },
      });
      await tx.user.updateMany({
        where: { accountId: id },
        data: { isDeleted: true, isActive: false },
      });
      await tx.subscription.updateMany({
        where: { accountId: id, isActive: true },
        data: { isActive: false, endDate: new Date() },
      });
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Tenant soft deleted successfully",
      statusCode: RESPONSE_CODES.GET,
      data: { id },
    });
  } catch (error) {
    console.log("TENANT DELETE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
