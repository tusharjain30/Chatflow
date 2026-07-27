const jwt = require("jsonwebtoken");

const RESPONSE_CODES = require("../config/responseCode");

const { PrismaClient } = require("../generated/prisma/client");
const prisma = new PrismaClient();

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
        status: 0,
        message: "No token provided",
        statusCode: RESPONSE_CODES.UNAUTHORIZED,
        data: {},
      });
    }

    const token = header.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.USER_JWT_SECRET);
    } catch (err) {
      return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
        status: 0,
        message: "Invalid or expired token",
        statusCode: RESPONSE_CODES.UNAUTHORIZED,
        data: {},
      });
    }

    const {
      userId,
      adminId,
      resellerId,
      resellerMemberId,
      tokenVersion,
      userType,
      impersonatedBy,
    } = decoded;

    let authUser = null;

    // IF CUSTOMER USER
    if (userType === "USER") {
      authUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
          wabaVerification: true,
          account: true,
        },
      });

      if (!authUser) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: 0,
          message: "User not found",
          statusCode: RESPONSE_CODES.UNAUTHORIZED,
          data: {},
        });
      }

      if (authUser.isDeleted || !authUser.isActive) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: 0,
          message: "Account inactive or deleted",
          statusCode: RESPONSE_CODES.UNAUTHORIZED,
          data: {},
        });
      }

      if (tokenVersion !== authUser.tokenVersion) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: 0,
          message: "Session expired. Please login again.",
          statusCode: RESPONSE_CODES.UNAUTHORIZED,
          data: {},
        });
      }

      // Attach unified auth context
      req.auth = {
        userType: "USER",
        userId: authUser.id,
        accountId: authUser.accountId,
        roleId: authUser.roleId,
        role: authUser.role,
        roleType: authUser.role?.roleType,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        phone: authUser.phone,
        wabaVerification: authUser.wabaVerification,
        impersonatedBy: impersonatedBy || null,
      };

      return next();
    } else if (userType === "RESELLER") {
      if (resellerMemberId) {
        authUser = await prisma.resellerMember.findUnique({
          where: { id: resellerMemberId },
          include: {
            reseller: true,
          },
        });

        if (!authUser) {
          return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
            status: 0,
            message: "Reseller member not found",
            statusCode: RESPONSE_CODES.UNAUTHORIZED,
            data: {},
          });
        }

        if (
          authUser.isDeleted ||
          !authUser.isActive ||
          !authUser.reseller ||
          authUser.reseller.isDeleted ||
          !authUser.reseller.isActive
        ) {
          return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
            status: 0,
            message: "Reseller member account inactive or deleted",
            statusCode: RESPONSE_CODES.UNAUTHORIZED,
            data: {},
          });
        }

        if (tokenVersion !== authUser.tokenVersion) {
          return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
            status: 0,
            message: "Session expired. Please login again.",
            statusCode: RESPONSE_CODES.UNAUTHORIZED,
            data: {},
          });
        }

        req.auth = {
          userType: "RESELLER",
          resellerId: authUser.resellerId,
          resellerMemberId: authUser.id,
          resellerMemberRole: authUser.roleType,
          firstName: authUser.firstName,
          lastName: authUser.lastName,
          email: authUser.email,
          phone: authUser.phone,
          companyName: authUser.reseller.companyName,
          commissionRate: authUser.reseller.commissionRate,
          balance: authUser.reseller.balance,
        };

        return next();
      }

      authUser = await prisma.reseller.findUnique({
        where: { id: resellerId },
      });

      if (!authUser) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: 0,
          message: "Reseller not found",
          statusCode: RESPONSE_CODES.UNAUTHORIZED,
          data: {},
        });
      }

      if (authUser.isDeleted || !authUser.isActive) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: 0,
          message: "Reseller account inactive or deleted",
          statusCode: RESPONSE_CODES.UNAUTHORIZED,
          data: {},
        });
      }

      if (tokenVersion !== authUser.tokenVersion) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: 0,
          message: "Session expired. Please login again.",
          statusCode: RESPONSE_CODES.UNAUTHORIZED,
          data: {},
        });
      }

      req.auth = {
        userType: "RESELLER",
        resellerId: authUser.id,
        resellerMemberId: null,
        resellerMemberRole: "RESELLER_OWNER",
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        phone: authUser.phone,
        companyName: authUser.companyName,
        commissionRate: authUser.commissionRate,
        balance: authUser.balance,
      };

      return next();
    } else if (userType === "ADMIN") {
      // IF ADMIN USER
      authUser = await prisma.admin.findUnique({
        where: { id: adminId },
        include: {
          role: true,
        },
      });

      if (!authUser) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: 0,
          message: "Admin not found",
          statusCode: RESPONSE_CODES.UNAUTHORIZED,
          data: {},
        });
      }

      if (authUser.isDeleted || !authUser.isActive) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: 0,
          message: "Admin account inactive or deleted",
          statusCode: RESPONSE_CODES.UNAUTHORIZED,
          data: {},
        });
      }

      if (tokenVersion !== authUser.tokenVersion) {
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: 0,
          message: "Session expired. Please login again.",
          statusCode: RESPONSE_CODES.UNAUTHORIZED,
          data: {},
        });
      }

      req.auth = {
        userType: "ADMIN",
        adminId: authUser.id,
        roleId: authUser.roleId,
        role: authUser.role,
        roleType: authUser.role?.roleType || "SYSTEM_ADMIN",
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        phone: authUser.phone,
      };

      return next();
    } else {
      return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
        status: 0,
        message: "Invalid token payload",
        statusCode: RESPONSE_CODES.UNAUTHORIZED,
        data: {},
      });
    }
  } catch (error) {
    return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
      status: 0,
      message: "Invalid or expired token",
      statusCode: RESPONSE_CODES.UNAUTHORIZED,
      data: {},
    });
  }
};

module.exports = requireAuth;
