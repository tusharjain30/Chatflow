const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.put("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const {
      accountId,
      companyName,
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      ownerPhone,
    } = req.body;

    const account = await prisma.customerAccount.findFirst({
      where: {
        id: accountId,
        resellerId: req.auth.resellerId,
        isDeleted: false,
      },
      include: {
        users: {
          where: { isDeleted: false },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Customer account not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const owner = account.users[0];

    const updated = await prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.customerAccount.update({
        where: { id: accountId },
        data: { companyName },
      });

      let updatedOwner = null;
      if (owner) {
        updatedOwner = await tx.user.update({
          where: { id: owner.id },
          data: {
            firstName: ownerFirstName,
            lastName: ownerLastName,
            email: ownerEmail.toLowerCase(),
            phone: ownerPhone,
          },
        });
      }

      return {
        updatedAccount,
        updatedOwner,
      };
    });

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Customer updated successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        id: updated.updatedAccount.id,
        companyName: updated.updatedAccount.companyName,
        owner: updated.updatedOwner,
      },
    });
  } catch (error) {
    console.error("RESELLER CUSTOMER UPDATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
