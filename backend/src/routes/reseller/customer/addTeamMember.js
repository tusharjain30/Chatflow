const express = require("express");
const bcrypt = require("bcrypt");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

const buildUserName = (email) =>
  `${email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12)}${Date.now().toString().slice(-4)}`;

router.post("/", async (req, res) => {
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
      firstName,
      lastName,
      email,
      phone,
      password,
      roleType = "CUSTOMER_AGENT",
    } = req.body;

    const account = await prisma.customerAccount.findFirst({
      where: {
        id: accountId,
        resellerId: req.auth.resellerId,
        isDeleted: false,
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

    const normalizedEmail = email.toLowerCase();
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone }],
      },
    });

    if (existingUser && !existingUser.isDeleted) {
      return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
        status: 0,
        message: "User already exists",
        statusCode: RESPONSE_CODES.ALREADY_EXIST,
        data: {},
      });
    }

    const role = await prisma.role.upsert({
      where: { name: roleType },
      update: {
        roleType,
        isDeleted: false,
        isActive: true,
      },
      create: {
        name: roleType,
        roleType,
        isDeleted: false,
        isActive: true,
      },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = existingUser && existingUser.isDeleted
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            firstName,
            lastName,
            email: normalizedEmail,
            phone,
            password: hashedPassword,
            accountId,
            roleId: role.id,
            isActive: true,
            isDeleted: false,
            isVerified: true,
            termsAccepted: true,
          },
        })
      : await prisma.user.create({
          data: {
            firstName,
            lastName,
            userName: buildUserName(normalizedEmail),
            email: normalizedEmail,
            phone,
            password: hashedPassword,
            accountId,
            roleId: role.id,
            isActive: true,
            isDeleted: false,
            isVerified: true,
            termsAccepted: true,
          },
        });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Team member added successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("RESELLER ADD TEAM MEMBER ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
