const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  try {
    const {
      companyName,
      firstName,
      lastName,
      email,
      phone,
      password,
      userName,
      termsAccepted,
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone },
          ...(userName ? [{ userName }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
        status: 0,
        message: "Email, phone or username already exists",
        statusCode: RESPONSE_CODES.ALREADY_EXIST,
        data: {},
      });
    }

    if (!termsAccepted) {
      return res.status(RESPONSE_CODES.BAD_REQUEST).json({
        status: 0,
        message: "Please accept Terms & Conditions",
        statusCode: RESPONSE_CODES.BAD_REQUEST,
        data: {},
      });
    }

    const role = await prisma.role.upsert({
      where: { name: "CUSTOMER_OWNER" },
      update: {},
      create: {
        name: "CUSTOMER_OWNER",
        roleType: "CUSTOMER_OWNER",
      },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.customerAccount.create({
        data: {
          companyName,
        },
      });

      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          userName,
          password: hashedPassword,
          roleId: role.id,
          accountId: account.id,
          termsAccepted,
        },
      });

      return { account, user };
    });

    const { password: _, ...safeUser } = result.user;

    res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "User registered successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        account: result.account,
        owner: safeUser,
      },
    });
  } catch (error) {
    console.log("User Register Error:", error);
    // Prisma unique constraint error
    if (error?.code === "P2002") {
      return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
        status: 0,
        message: "Duplicate field value",
        statusCode: RESPONSE_CODES.ALREADY_EXIST,
        data: error.meta,
      });
    }

    res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
