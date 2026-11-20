const RESPONSE_CODES = require("../../../../config/responseCode");
const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;

    let {
      page = 1,
      limit = 20,
      search = "",
      status,
      type,
      direction,
      conversationId,
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 20;

    const skip = (page - 1) * limit;

    const where = {
      accountId,
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (direction) where.direction = direction;
    if (conversationId) where.conversationId = conversationId;

    const searchTerm = String(search || "").trim();
    if (searchTerm) {
      const matchingContacts = await prisma.contact.findMany({
        where: {
          accountId,
          isDeleted: false,
          OR: [
            { firstName: { contains: searchTerm, mode: "insensitive" } },
            { lastName: { contains: searchTerm, mode: "insensitive" } },
            { phone: { contains: searchTerm } },
            { email: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { phone: true },
        take: 100,
      });

      const contactPhones = matchingContacts
        .map((contact) => contact.phone)
        .filter(Boolean);

      where.OR = [
        { to: { contains: searchTerm } },
        { from: { contains: searchTerm } },
        { messageText: { contains: searchTerm, mode: "insensitive" } },
        { templateName: { contains: searchTerm, mode: "insensitive" } },
        { conversationId: { contains: searchTerm } },
        ...contactPhones.flatMap((phone) => [
          { to: { contains: phone } },
          { from: { contains: phone } },
        ]),
      ];
    }

    const [total, messages] = await Promise.all([
      prisma.messageLog.count({ where }),
      prisma.messageLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          sentByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Messages fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        messages,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log("Message List Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
