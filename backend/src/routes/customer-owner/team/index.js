const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const requireOwner = require("../../../middleware/requireOwner");
const validator = require("../../../middleware/validator");

const {
  inviteMemberSchema,
} = require("../../../schema/customer-owner/team/inviteMember.schema");
const {
  acceptInviteSchema,
} = require("../../../schema/customer-owner/team/acceptInvite.schema");
const {
  listMembersSchema,
} = require("../../../schema/customer-owner/team/listMembers.schema");
const {
  resendInviteSchema,
} = require("../../../schema/customer-owner/team/resendInvite.schema");
const {
  updateMemberSchema,
} = require("../../../schema/customer-owner/team/updateMember.schema");
const {
  memberDetailSchema,
} = require("../../../schema/customer-owner/team/memberDetail.schema");
const {
  toggleStatusSchema,
} = require("../../../schema/customer-owner/team/toggleStatus.schema");
const {
  deleteMemberSchema,
} = require("../../../schema/customer-owner/team/deleteMember.schema");
const { bulkDeleteMembersSchema } = require("../../../schema/customer-owner/team/bulkDeleteMembers.schema");

const inviteMemberRoute = require("./inviteMember");
const acceptInviteRoute = require("./acceptInvite");
const listMembersRoute = require("./listMembers");
const resendInviteRoute = require("./resendInvite");
const updateMemberRoute = require("./updateMember");
const memberDetailRoute = require("./memberDetail");
const toggleStatusRoute = require("./toggleStatus");
const statsRoute = require("./stats");
const deleteMemberRoute = require("./deleteMember");
const bulkDeleteMembersRoute = require("./bulkDeleteMembers");

router.use(
  "/invite",
  requireAuth,
  requireOwner,
  validator(inviteMemberSchema, "body"),
  inviteMemberRoute,
);

router.use(
  "/accept-invite",
  validator(acceptInviteSchema, "body"),
  acceptInviteRoute,
);

router.use(
  "/list-members",
  requireAuth,
  requireOwner,
  validator(listMembersSchema, "query"),
  listMembersRoute,
);

router.use(
  "/resend-invite",
  requireAuth,
  requireOwner,
  validator(resendInviteSchema, "body"),
  resendInviteRoute,
);

router.use(
  "/update-member",
  requireAuth,
  requireOwner,
  validator(updateMemberSchema, "body"),
  updateMemberRoute,
);

router.use(
  "/member/:userId",
  requireAuth,
  requireOwner,
  validator(memberDetailSchema, "params"),
  memberDetailRoute,
);

router.use(
  "/member/:userId/toggle-status",
  requireAuth,
  requireOwner,
  validator(toggleStatusSchema, "params"),
  toggleStatusRoute,
);

router.use("/stats", requireAuth, requireOwner, statsRoute);

router.use(
  "/member/:userId",
  requireAuth,
  requireOwner,
  validator(deleteMemberSchema, "params"),
  deleteMemberRoute,
);

router.use(
  "/members/bulk-delete",
  requireAuth,
  requireOwner,
  validator(bulkDeleteMembersSchema, "body"),
  bulkDeleteMembersRoute
);

module.exports = router;

