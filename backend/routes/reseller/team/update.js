const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const handleResellerTeamTableError = require("./handleResellerTeamTableError");
const {
  TEAM_ROLE_META,
  buildPermissionsPayload,
  extractPermissionsPayload,
  normalizeTeamRole,
} = require("./rolePresets");

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

    const { memberId, teamRole, permissions, ...input } = req.body;

    const member = await prisma.resellerMember.findFirst({
      where: {
        id: memberId,
        resellerId: req.auth.resellerId,
        isDeleted: false,
      },
    });

    if (!member) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Team member not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const currentPermissions = extractPermissionsPayload(member);
    const normalizedTeamRole = teamRole
      ? normalizeTeamRole(teamRole)
      : currentPermissions.teamRole;
    const nextRoleType = teamRole
      ? TEAM_ROLE_META[normalizedTeamRole].baseRoleType
      : member.roleType;
    const nextPermissions = teamRole || permissions
      ? buildPermissionsPayload({
          teamRole: normalizedTeamRole,
          permissions: permissions || currentPermissions.permissions,
          inviteStatus: member.isActive ? "ACTIVE" : currentPermissions.inviteStatus,
        })
      : undefined;

    const updated = await prisma.resellerMember.update({
      where: { id: member.id },
      data: {
        ...input,
        ...(teamRole ? { roleType: nextRoleType } : {}),
        ...(nextPermissions ? { permissions: nextPermissions } : {}),
      },
    });

    const updatedPermissions = extractPermissionsPayload(updated);

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Reseller team member updated successfully",
      statusCode: RESPONSE_CODES.POST,
      data: {
        id: updated.id,
        roleType: updated.roleType,
        teamRole: updatedPermissions.teamRole,
        permissions: updatedPermissions.permissions,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    const handledResponse = handleResellerTeamTableError(
      res,
      error,
      "RESELLER TEAM UPDATE ERROR",
    );
    if (handledResponse) {
      return handledResponse;
    }

    console.error("RESELLER TEAM UPDATE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
