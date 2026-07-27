const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const {
  fetchInvoiceSubscriptions,
  countInvoiceSubscriptions,
  mapSubscriptionToInvoice,
} = require("./shared");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (req.admin.role?.roleType !== "SYSTEM_ADMIN") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Access denied",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    let {
      page = "1",
      limit = "20",
      search = "",
      resellerId,
      customerId,
      status,
    } = req.validatedQuery;

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    const [subscriptions, total, resellers, customers] = await Promise.all([
      fetchInvoiceSubscriptions(prisma, {
        search,
        resellerId,
        customerId,
        status,
        skip,
        take: limit,
      }),
      countInvoiceSubscriptions(prisma, {
        search,
        resellerId,
        customerId,
        status,
      }),
      prisma.reseller.findMany({
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          companyName: true,
        },
        orderBy: {
          companyName: "asc",
        },
      }),
      prisma.customerAccount.findMany({
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          companyName: true,
          resellerId: true,
        },
        orderBy: {
          companyName: "asc",
        },
      }),
    ]);

    const invoices = subscriptions.map(mapSubscriptionToInvoice);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Invoices fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        items: invoices,
        filters: {
          resellers,
          customers,
        },
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.log("SUPER ADMIN INVOICE LIST ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
