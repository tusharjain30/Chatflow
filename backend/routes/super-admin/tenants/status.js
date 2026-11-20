const express = require("express");
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { requireSystemAdmin, mapStatus } = require("./_helpers");

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });

router.patch("/", async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res, RESPONSE_CODES)) return;

    const { id } = req.params;
    const { action, reason } = req.body;

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

    let data = {
      statusChangedAt: new Date(),
      statusReason:
        reason ||
        `${action} by super admin ${req.admin.email}`,
    };

    if (action === "activate") {
      data = {
        ...data,
        isActive: true,
        isDeleted: false,
        lifecycleStatus: "ACTIVE",
      };
    } else if (action === "suspend") {
      data = {
        ...data,
        isActive: false,
        lifecycleStatus: "SUSPENDED",
      };
    } else if (action === "archive") {
      data = {
        ...data,
        isActive: false,
        lifecycleStatus: "EXPIRED",
        statusReason: reason
          ? `ARCHIVED: ${reason}`
          : `ARCHIVED by super admin ${req.admin.email}`,
      };
    }

    const updated = await prisma.customerAccount.update({
      where: { id },
      data,
    });

    if (action === "suspend" || action === "archive") {
      await prisma.user.updateMany({
        where: { accountId: id, isDeleted: false },
        data: { isActive: false },
      });
    }
    if (action === "activate") {
      await prisma.user.updateMany({
        where: { accountId: id, isDeleted: false },
        data: { isActive: true },
      });
    }

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: `Tenant ${action}d successfully`,
      statusCode: RESPONSE_CODES.GET,
      data: {
        id: updated.id,
        status: mapStatus(updated),
        lifecycleStatus: updated.lifecycleStatus,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    console.log("TENANT STATUS ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
