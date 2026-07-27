const express = require("express");
const jwt = require("jsonwebtoken");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    if (req.admin.role?.roleType !== "SYSTEM_ADMIN") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Access denied",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { resellerId } = req.body;
    const reseller = await prisma.reseller.findFirst({
      where: {
        id: resellerId,
        isDeleted: false,
      },
    });

    if (!reseller) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Reseller not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const token = jwt.sign(
      {
        userType: "RESELLER",
        resellerId: reseller.id,
        tokenVersion: reseller.tokenVersion,
        impersonatedBy: {
          adminId: req.admin.id,
          adminName: `${req.admin.firstName} ${req.admin.lastName}`.trim(),
          adminEmail: req.admin.email,
        },
      },
      process.env.USER_JWT_SECRET,
      { expiresIn: "8h" },
    );

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller support session created successfully",
      statusCode: RESPONSE_CODES.GET,
      data: {
        token,
        portal: "reseller",
        redirectTo: "/reseller",
        reseller: {
          id: reseller.id,
          companyName: reseller.companyName,
          email: reseller.email,
        },
        supportSession: {
          adminName: `${req.admin.firstName} ${req.admin.lastName}`.trim(),
          adminEmail: req.admin.email,
          resellerCompanyName: reseller.companyName,
        },
      },
    });
  } catch (error) {
    console.log("SUPER ADMIN LOGIN AS RESELLER ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
