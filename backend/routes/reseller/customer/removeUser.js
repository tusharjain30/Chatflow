const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.delete("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { accountId, userId } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        accountId,
        account: {
          resellerId: req.auth.resellerId,
          isDeleted: false,
        },
        isDeleted: false,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "User not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    if (user.role?.roleType === "CUSTOMER_OWNER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Customer owner cannot be removed",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isDeleted: true,
        isActive: false,
      },
    });

    return res.status(RESPONSE_CODES.DELETE).json({
      status: 1,
      message: "Customer user removed successfully",
      statusCode: RESPONSE_CODES.DELETE,
      data: {
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("RESELLER CUSTOMER USER REMOVE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
