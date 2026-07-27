const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  try {
    const { identifier, password, rememberMe } = req.body;
    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Try Admin Login First
    const admin = await prisma.admin.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { email: normalizedIdentifier },
          { userName: normalizedIdentifier },
          { phone: identifier },
        ],
      },
      include: {
        role: true,
      },
    });

    if (admin) {
      const match = await bcrypt.compare(password, admin.password);
      if (!match) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
          status: 0,
          message: "Invalid credentials",
          statusCode: RESPONSE_CODES.BAD_REQUEST,
          data: {},
        });
      }

      if (!admin.isActive) {
        return res.status(RESPONSE_CODES.FORBIDDEN).json({
          status: 0,
          message: "Admin account is disabled",
          statusCode: RESPONSE_CODES.FORBIDDEN,
          data: {},
        });
      }

      const payload = {
        userType: "ADMIN",
        adminId: admin.id,
        role: admin.role?.roleType,
        tokenVersion: admin.tokenVersion,
      };

      const expiresIn = rememberMe ? "30d" : "1d";

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn,
      });

      const { password: _, ...safeAdmin } = admin;

      return res.status(RESPONSE_CODES.GET).json({
        status: 1,
        message: "Login successful",
        statusCode: RESPONSE_CODES.GET,
        data: {
          token,
          expiresIn,
          userType: "ADMIN",
          user: safeAdmin,
        },
      });
    } else {
      // Try Customer User Login
      const user = await prisma.user.findFirst({
        where: {
          isDeleted: false,
          OR: [
            { email: normalizedIdentifier },
            { userName: normalizedIdentifier },
            { phone: identifier },
          ],
        },
        include: { role: true, account: true },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({
          status: 0,
          message: "Invalid credentials",
          statusCode: RESPONSE_CODES.BAD_REQUEST,
          data: {},
        });
      }

      if (!user.isActive) {
        return res.status(RESPONSE_CODES.FORBIDDEN).json({
          status: 0,
          message: "Account disabled",
          statusCode: RESPONSE_CODES.FORBIDDEN,
          data: {},
        });
      }

      if (!user.account?.isActive || user.account?.isDeleted) {
        return res.status(RESPONSE_CODES.FORBIDDEN).json({
          status: 0,
          message: "Account is inactive",
          statusCode: RESPONSE_CODES.FORBIDDEN,
          data: {},
        });
      }

      const tokenPayload = {
        userType: "USER",
        userId: user.id,
        accountId: user.accountId,
        role: user.role?.roleType,
        tokenVersion: user.tokenVersion,
      };

      const expiresIn = rememberMe ? "30d" : "1d";

      const token = jwt.sign(tokenPayload, process.env.USER_JWT_SECRET, {
        expiresIn,
      });

      const { password: _, ...safeUser } = user;

      return res.status(RESPONSE_CODES.GET).json({
        status: 1,
        message: "Login successful",
        statusCode: RESPONSE_CODES.GET,
        data: {
          token,
          expiresIn,
          userType: "USER",
          user: safeUser,
        },
      });
    }
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
