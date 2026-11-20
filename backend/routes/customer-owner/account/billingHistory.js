const express = require("express");
const router = express.Router();
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const search = String(req.query.search || "").trim();

    const account = await prisma.customerAccount.findUnique({
      where: { id: accountId },
      select: { companyName: true },
    });

    const where = {
      accountId,
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" } },
              { reference: { contains: search, mode: "insensitive" } },
              { type: { equals: search.toUpperCase() } },
            ],
          }
        : {}),
    };

    const items = await prisma.billingTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Billing history loaded",
      statusCode: RESPONSE_CODES.GET,
      data: {
        organization: account?.companyName || "—",
        invoices: items.map((item) => ({
          id: item.id,
          date: item.createdAt,
          organization: account?.companyName || "—",
          description: item.description,
          amount: item.amount,
          currency: item.currency,
          type: item.type,
          reference: item.reference,
        })),
      },
    });
  } catch (error) {
    console.log("Billing history error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
