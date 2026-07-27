const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const RESPONSE_CODES = require("../../../../config/responseCode");

const hashToken = require("../../../../utils/hashToken");

router.post("/", async (req, res) => {
  try {
    const { userId, accountId } = req.auth;
    const DEFAULT_TEMPLATE_LIMIT = 5;

    const waba = await prisma.wabaVerification.findUnique({
      where: { userId },
    });

    if (!waba || waba.status !== "VERIFIED") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Verify whatsapp number before creating API",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        accountId,
        isActive: true,
      },
      include: {
        plan: true,
      },
    });

    // if(!subscription){
    //   return res.status(RESPONSE_CODES.BAD_REQUEST).json({
    //     status: 0,
    //     message: "Subscription not found",
    //     statusCode: RESPONSE_CODES.BAD_REQUEST,
    //     data: {}
    //   })
    // }

    const plan = subscription?.plan || null;

    const services = [];

    if (plan) {
      if (plan.maxTemplates && plan.maxTemplates > 0) services.push("TEMPLATE");
      if (plan.maxBots && plan.maxBots > 0) services.push("BOT");
    } else {
      // Free default
      services.push("TEMPLATE");
      services.push("BOT");
    }

    if (!services.length) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "No services available for your plan",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const createdTokens = [];
    for (const service of services) {
      let limitValue = null;

      if (service === "TEMPLATE") {
        limitValue = plan?.maxTemplates || DEFAULT_TEMPLATE_LIMIT;
      }

      if (service === "BOT") {
        limitValue = plan?.maxBots || 10;
      }

      // Revoke old active tokens
      await prisma.accessToken.updateMany({
        where: {
          userId,
          service,
          isActive: true,
        },
        data: { isActive: false },
      });

      // Generate token
      const token = jwt.sign(
        {
          userId,
          accountId,
          service,
          type: "SERVICE_API",
        },
        process.env.SERVICE_TOKEN_SECRET
      );

      await prisma.accessToken.create({
        data: {
          userId,
          service,
          tokenHash: token,
          limitValue,
        },
      });

      createdTokens.push({
        service,
        token,
        limit: limitValue,
      });
    }

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "API created successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        apiBaseUrl: "https://api.vibrantickSaaS.com",
        plan: plan ? plan.name : "FREE",
        services: createdTokens,
      },
    });
  } catch (error) {
    console.log("Create Api Error:", error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
