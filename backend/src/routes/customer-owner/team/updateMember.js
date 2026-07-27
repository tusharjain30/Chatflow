const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.patch("/", async (req, res) => {
  try {
    const { userId, roleType, isActive } = req.body;
    const auth = req.auth;

    // =========================
    // Find user
    // =========================
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        accountId: auth.accountId,
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

    // =========================
    // Prevent updating owner
    // =========================
    if (user.role?.roleType === "CUSTOMER_OWNER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Owner cannot be modified",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    // =========================
    // Prepare update data
    // =========================
    let updateData = {};

    // Role Update
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

    // Status Update
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    // =========================
    // Nothing to update
    // =========================
    if (Object.keys(updateData).length === 0) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "No valid fields to update",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    // =========================
    // Update user
    // =========================
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Team member updated successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        userId: updatedUser.id,
        roleType: roleType || user.role?.roleType,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.log("Update Member Error:", error);

    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
