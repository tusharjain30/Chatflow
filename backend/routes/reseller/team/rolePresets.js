const TEAM_ROLE_KEYS = ["OWNER", "ADMIN", "ACCOUNT_MANAGER", "SUPPORT", "VIEWER"];

const TEAM_ROLE_PERMISSION_PRESETS = {
  OWNER: [
    "customers.view",
    "customers.manage",
    "campaigns.view",
    "templates.view",
    "billing.view",
    "team.invite",
    "team.roles.assign",
    "team.permissions.manage",
    "audit.view",
    "settings.manage",
    "support.tools.view",
    "analytics.view",
    "whatsapp.accounts.manage",
    "white.label.manage",
  ],
  ADMIN: [
    "customers.view",
    "customers.manage",
    "campaigns.view",
    "templates.view",
    "billing.view",
    "team.invite",
    "team.roles.assign",
    "audit.view",
    "notifications.view",
    "settings.manage",
  ],
  ACCOUNT_MANAGER: [
    "customers.view",
    "customers.manage",
    "campaigns.view",
    "templates.view",
    "notifications.view",
  ],
  SUPPORT: [
    "customers.view",
    "campaigns.view",
    "templates.view",
    "support.tools.view",
    "notifications.view",
  ],
  VIEWER: [
    "customers.view",
    "campaigns.view",
    "templates.view",
    "analytics.view",
  ],
};

const TEAM_ROLE_META = {
  OWNER: {
    key: "OWNER",
    label: "Owner",
    baseRoleType: "RESELLER_SUB_ADMIN",
  },
  ADMIN: {
    key: "ADMIN",
    label: "Admin",
    baseRoleType: "RESELLER_SUB_ADMIN",
  },
  ACCOUNT_MANAGER: {
    key: "ACCOUNT_MANAGER",
    label: "Account Manager",
    baseRoleType: "RESELLER_SUB_ADMIN",
  },
  SUPPORT: {
    key: "SUPPORT",
    label: "Support",
    baseRoleType: "RESELLER_SUPPORT",
  },
  VIEWER: {
    key: "VIEWER",
    label: "Viewer",
    baseRoleType: "RESELLER_SUPPORT",
  },
};

const normalizeTeamRole = (teamRole) =>
  TEAM_ROLE_KEYS.includes(teamRole) ? teamRole : "SUPPORT";

const buildPermissionsPayload = ({ teamRole, permissions, inviteStatus }) => {
  const normalizedTeamRole = normalizeTeamRole(teamRole);
  const presetPermissions = TEAM_ROLE_PERMISSION_PRESETS[normalizedTeamRole];

  return {
    teamRole: normalizedTeamRole,
    permissionPreset: normalizedTeamRole,
    permissions:
      Array.isArray(permissions) && permissions.length
        ? [...new Set(permissions)]
        : presetPermissions,
    inviteStatus: inviteStatus || "INVITED",
    invitedAt: new Date().toISOString(),
  };
};

const extractPermissionsPayload = (member) => {
  const raw = member.permissions && typeof member.permissions === "object"
    ? member.permissions
    : {};
  const teamRole = normalizeTeamRole(raw.teamRole);

  return {
    teamRole,
    roleLabel: TEAM_ROLE_META[teamRole].label,
    baseRoleType: member.roleType,
    permissions:
      Array.isArray(raw.permissions) && raw.permissions.length
        ? raw.permissions
        : TEAM_ROLE_PERMISSION_PRESETS[teamRole],
    inviteStatus: raw.inviteStatus || "ACTIVE",
    invitedAt: raw.invitedAt || null,
  };
};

module.exports = {
  TEAM_ROLE_KEYS,
  TEAM_ROLE_META,
  TEAM_ROLE_PERMISSION_PRESETS,
  normalizeTeamRole,
  buildPermissionsPayload,
  extractPermissionsPayload,
};
