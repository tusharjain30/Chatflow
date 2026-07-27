const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const {
  fetchInvoiceSubscriptions,
  buildInvoiceNumber,
  mapSubscriptionToInvoice,
} = require("./shared");

const prisma = new PrismaClient();
const router = express.Router();

function escapeCsv(value) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

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

    const { search = "", resellerId, customerId, status } = req.validatedQuery;

    const subscriptions = await fetchInvoiceSubscriptions(prisma, {
      search,
      resellerId,
      customerId,
      status,
    });

    const rows = subscriptions.map((subscription) => {
      const invoice = mapSubscriptionToInvoice(subscription);
      return [
        invoice.invoiceNumber,
        invoice.resellerName,
        invoice.customerName,
        invoice.planName,
        invoice.amount,
        invoice.currency,
        invoice.commissionRate,
        invoice.commissionAmount,
        invoice.status,
        new Date(invoice.issuedAt).toISOString(),
      ];
    });

    const csv = [
      [
        "Invoice Number",
        "Reseller",
        "Customer",
        "Plan",
        "Amount",
        "Currency",
        "Commission Rate",
        "Commission Amount",
        "Status",
        "Issued At",
      ].join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="global-invoices-${Date.now()}.csv"`,
    );
    return res.status(200).send(csv);
  } catch (error) {
    console.log("SUPER ADMIN INVOICE DOWNLOAD ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

router.get("/:invoiceId", async (req, res) => {
  try {
    if (req.admin.role?.roleType !== "SYSTEM_ADMIN") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Access denied",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: req.validatedParams.invoiceId,
      },
      include: {
        plan: true,
        account: {
          include: {
            reseller: true,
          },
        },
      },
    });

    if (!subscription) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Invoice not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const invoice = mapSubscriptionToInvoice(subscription);
    const content = [
      `Invoice Number: ${buildInvoiceNumber(subscription.id)}`,
      `Reseller: ${invoice.resellerName}`,
      `Customer: ${invoice.customerName}`,
      `Plan: ${invoice.planName}`,
      `Amount: ${invoice.currency} ${invoice.amount}`,
      `Commission Rate: ${invoice.commissionRate}%`,
      `Commission Amount: ${invoice.currency} ${invoice.commissionAmount}`,
      `Status: ${invoice.status}`,
      `Issued At: ${new Date(invoice.issuedAt).toISOString()}`,
    ].join("\n");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${buildInvoiceNumber(subscription.id)}.txt"`,
    );
    return res.status(200).send(content);
  } catch (error) {
    console.log("SUPER ADMIN INVOICE DETAIL DOWNLOAD ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
