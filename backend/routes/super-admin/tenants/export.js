const express = require("express");
const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const { mapTenantListItem, requireSystemAdmin } = require("./_helpers");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res, RESPONSE_CODES)) return;

    const accounts = await prisma.customerAccount.findMany({
      where: { isDeleted: false },
      include: {
        reseller: { select: { id: true, companyName: true } },
        users: {
          where: { isDeleted: false },
          include: { role: true },
        },
        subscriptions: {
          where: { isActive: true },
          include: { plan: true },
          take: 1,
        },
        _count: {
          select: {
            users: { where: { isDeleted: false } },
            whatsAppAccounts: true,
            messageLogs: { where: { direction: "OUTBOUND" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const rows = accounts.map((account) => {
      const item = mapTenantListItem(account, {
        usersCount: account._count.users,
        whatsappCount: account._count.whatsAppAccounts,
        messagesCount: account._count.messageLogs,
      });
      return {
        organization: item.organization,
        owner: item.owner?.name || "",
        email: item.email || "",
        plan: item.plan?.name || "",
        whatsapp: item.whatsappCount,
        users: item.usersCount,
        messages: item.messagesCount,
        status: item.status,
        created: item.createdAt,
        reseller: item.reseller?.companyName || "",
      };
    });

    const header = [
      "Organization",
      "Owner",
      "Email",
      "Plan",
      "WhatsApp",
      "Users",
      "Messages",
      "Status",
      "Created",
      "Reseller",
    ];

    const csv = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.organization,
          row.owner,
          row.email,
          row.plan,
          row.whatsapp,
          row.users,
          row.messages,
          row.status,
          row.created ? new Date(row.created).toISOString() : "",
          row.reseller,
        ]
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tenants-${Date.now()}.csv"`,
    );
    return res.status(200).send(csv);
  } catch (error) {
    console.log("TENANT EXPORT ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
