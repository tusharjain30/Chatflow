const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.patch("/", async (req, res) => {
  try {
    if (req.admin.role?.roleType !== "SYSTEM_ADMIN") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Access denied",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { entityType, id } = req.body;

    if (entityType === "RESELLER") {
      const reseller = await prisma.reseller.findFirst({
        where: { id, isDeleted: false },
      });

      if (!reseller) {
        return res.status(RESPONSE_CODES.NOT_FOUND).json({
          status: 0,
          message: "Reseller not found",
          statusCode: RESPONSE_CODES.NOT_FOUND,
          data: {},
        });
      }

      const updated = await prisma.reseller.update({
        where: { id },
        data: {
          isActive: true,
          isVerified: true,
          isDeleted: false,
        },
      });

      return res.status(RESPONSE_CODES.GET).json({
        status: 1,
        message: "Reseller force activated successfully",
        statusCode: RESPONSE_CODES.GET,
        data: {
          id: updated.id,
          entityType,
          isActive: updated.isActive,
        },
      });
    }

    const account = await prisma.customerAccount.findFirst({
      where: { id, isDeleted: false },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Customer account not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.customerAccount.update({
        where: { id },
        data: {
          isActive: true,
          isDeleted: false,
        },
      });

      await tx.user.updateMany({
        where: {
          accountId: id,
          isDeleted: false,
        },
        data: {
          isActive: true,
          isVerified: true,
        },
      });
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Customer account force activated successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        id,
        entityType,
        isActive: true,
      },
    });
  } catch (error) {
    console.log("SUPER ADMIN FORCE ACTIVATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
