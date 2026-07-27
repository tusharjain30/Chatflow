const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const { Parser } = require("json2csv");

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { search } = req.query;

    const contacts = await prisma.contact.findMany({
      where: {
        accountId,
        isDeleted: false,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },

      include: {
        groups: {
          include: {
            group: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = contacts.map((c) => ({
      phone: c.phone,
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      email: c.email || "",
      country: c.country || "",
      languageCode: c.languageCode || "",
      isOptedOut: c.isOptedOut,
      groups: c.groups.map((g) => g.group.title).join(", "),
      createdAt: c.createdAt,
    }));

    const fields = [
      "phone",
      "firstName",
      "lastName",
      "email",
      "country",
      "languageCode",
      "isOptedOut",
      "groups",
      "createdAt",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("contacts.csv");

    return res.send(csv);
  } catch (err) {
    console.error("Export contacts error:", err);

    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Failed to export contacts",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
