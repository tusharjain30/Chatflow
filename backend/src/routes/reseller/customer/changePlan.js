const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
import prisma from "../../../config/prisma";
const router = express.Router();

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

    const { accountId, planId } = req.body;

    const [account, plan] = await Promise.all([
      prisma.customerAccount.findFirst({
        where: {
          id: accountId,
          resellerId: req.auth.resellerId,
          isDeleted: false,
        },
      }),
      prisma.plan.findFirst({
        where: {
          id: planId,
          isDeleted: false,
          isActive: true,
        },
      }),
    ]);

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Customer account not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    if (!plan) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Plan not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const subscription = await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: {
          accountId,
          isActive: true,
        },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      });

      return tx.subscription.create({
        data: {
          accountId,
          planId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        include: {
          plan: true,
        },
      });
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Customer plan changed successfully",
      statusCode: RESPONSE_CODES.POST,
      data: subscription,
    });
  } catch (error) {
    console.error("RESELLER CHANGE PLAN ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
