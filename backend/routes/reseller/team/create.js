const express = require("express");
const bcrypt = require("bcrypt");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const handleResellerTeamTableError = require("./handleResellerTeamTableError");
const {
  TEAM_ROLE_META,
  buildPermissionsPayload,
  normalizeTeamRole,
} = require("./rolePresets");

const prisma = new PrismaClient();
const router = express.Router();

const buildUserName = (email) =>
  `${email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12)}${Date.now().toString().slice(-4)}`;

const generateTemporaryPassword = () =>
  `Team@${Math.random().toString(36).slice(2, 6)}${Date.now().toString().slice(-4)}`;

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

    const { firstName, lastName, email, phone, password, teamRole, permissions } = req.body;
    const normalizedEmail = email.toLowerCase();
    const normalizedTeamRole = normalizeTeamRole(teamRole);
    const mappedRoleType = TEAM_ROLE_META[normalizedTeamRole].baseRoleType;
    const invitePassword = password || generateTemporaryPassword();

    const [existingMember, existingReseller] = await Promise.all([
      prisma.resellerMember.findFirst({
        where: {
          OR: [{ email: normalizedEmail }, { phone }],
        },
      }),
      prisma.reseller.findFirst({
        where: {
          OR: [{ email: normalizedEmail }, { phone }],
        },
      }),
    ]);

    if ((existingMember && !existingMember.isDeleted) || existingReseller) {
      return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
        status: 0,
        message: "Team member already exists",
        statusCode: RESPONSE_CODES.ALREADY_EXIST,
        data: {},
      });
    }

    const hashedPassword = await bcrypt.hash(invitePassword, 10);
    const permissionsPayload = buildPermissionsPayload({
      teamRole: normalizedTeamRole,
      permissions,
      inviteStatus: "INVITED",
    });

    const member =
      existingMember && existingMember.isDeleted
        ? await prisma.resellerMember.update({
            where: { id: existingMember.id },
            data: {
              firstName,
              lastName,
              email: normalizedEmail,
              phone,
              password: hashedPassword,
              roleType: mappedRoleType,
              permissions: permissionsPayload,
              resellerId: req.auth.resellerId,
              isActive: true,
              isDeleted: false,
              isVerified: true,
              userName: existingMember.userName || buildUserName(normalizedEmail),
            },
          })
        : await prisma.resellerMember.create({
            data: {
              resellerId: req.auth.resellerId,
              firstName,
              lastName,
              email: normalizedEmail,
              phone,
              password: hashedPassword,
              roleType: mappedRoleType,
              permissions: permissionsPayload,
              isActive: true,
              isDeleted: false,
              isVerified: true,
              userName: buildUserName(normalizedEmail),
            },
          });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Reseller team member added successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        roleType: member.roleType,
        teamRole: normalizedTeamRole,
        permissions: permissionsPayload.permissions,
        temporaryPassword: invitePassword,
      },
    });
  } catch (error) {
    const handledResponse = handleResellerTeamTableError(
      res,
      error,
      "RESELLER TEAM CREATE ERROR",
    );
    if (handledResponse) {
      return handledResponse;
    }

    console.error("RESELLER TEAM CREATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
