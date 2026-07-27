const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const handleResellerTeamTableError = require("./handleResellerTeamTableError");
const { extractPermissionsPayload, normalizeTeamRole } = require("./rolePresets");

const prisma = new PrismaClient();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { search, teamRole, status } = req.validatedQuery;

    const where = {
      resellerId: req.auth.resellerId,
      isDeleted: false,
      ...(status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const members = await prisma.resellerMember.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const formattedMembers = members
      .map((member) => {
        const permissionData = extractPermissionsPayload(member);
        return {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          roleType: member.roleType,
          teamRole: permissionData.teamRole,
          roleLabel: permissionData.roleLabel,
          permissions: permissionData.permissions,
          inviteStatus: permissionData.inviteStatus,
          isActive: member.isActive,
          createdAt: member.createdAt,
        };
      })
      .filter((member) =>
        teamRole ? normalizeTeamRole(teamRole) === member.teamRole : true,
      );

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Reseller team loaded successfully",
      statusCode: RESPONSE_CODES.GET,
      data: formattedMembers,
    });
  } catch (error) {
    const handledResponse = handleResellerTeamTableError(
      res,
      error,
      "RESELLER TEAM LIST ERROR",
    );
    if (handledResponse) {
      return handledResponse;
    }

    console.error("RESELLER TEAM LIST ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
