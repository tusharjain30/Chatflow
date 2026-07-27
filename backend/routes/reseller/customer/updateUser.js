const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.patch("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { accountId, userId, roleType, isActive } = req.body;

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
        message: "Customer owner cannot be modified",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const updateData = {};

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (roleType) {
      const role = await prisma.role.findFirst({
        where: {
          roleType,
          isDeleted: false,
          isActive: true,
        },
      });

      if (!role) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
          status: 0,
          message: "Invalid role",
          statusCode: RESPONSE_CODES.BAD_REQUEST,
          data: {},
        });
      }

      updateData.roleId = role.id;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: {
        role: {
          select: {
            roleType: true,
            name: true,
          },
        },
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Customer user updated successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        id: updatedUser.id,
        isActive: updatedUser.isActive,
        roleType: updatedUser.role?.roleType || null,
        roleName: updatedUser.role?.name || null,
      },
    });
  } catch (error) {
    console.error("RESELLER CUSTOMER USER UPDATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
