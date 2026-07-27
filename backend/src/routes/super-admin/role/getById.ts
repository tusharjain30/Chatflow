const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

import prisma from "../../../config/prisma";

router.get("/", async (req: any, res: any) => {
  try {
    const admin = req.admin;
    let roleId = req.body.id;

    if (admin.role?.roleType !== "SYSTEM_ADMIN") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Access denied",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        roleType: true,
        isActive: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          where: {
            isDeleted: false,
          },
          select: {
            permission: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Role not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const permissions = role.permissions.map((rp) => rp.permission);

    const { id, name, roleType, isActive, isDeleted, createdAt, updatedAt } =
      role;

    res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Role fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        id,
        name,
        roleType,
        isActive,
        isDeleted,
        createdAt,
        updatedAt,
        permissions,
      },
    });
  } catch (error) {
    console.log("Get By Id roll error:", error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
