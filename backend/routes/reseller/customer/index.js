const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const validator = require("../../../middleware/validator");
const { resellerCustomersQuerySchema } = require("../../../schema/reseller/customer/list.schema");
const { createResellerCustomerSchema } = require("../../../schema/reseller/customer/create.schema");
const { updateResellerCustomerSchema } = require("../../../schema/reseller/customer/update.schema");
const { updateResellerCustomerStatusSchema } = require("../../../schema/reseller/customer/status.schema");
const { resellerCustomerDetailSchema } = require("../../../schema/reseller/customer/detail.schema");
const { changeResellerCustomerPlanSchema } = require("../../../schema/reseller/customer/changePlan.schema");
const { bulkChangeResellerCustomerPlanSchema } = require("../../../schema/reseller/customer/bulkChangePlan.schema");
const { rechargeResellerCustomerSchema } = require("../../../schema/reseller/customer/recharge.schema");
const { addResellerTeamMemberSchema } = require("../../../schema/reseller/customer/addTeamMember.schema");
const { sendResellerTestMessageSchema } = require("../../../schema/reseller/customer/sendTestMessage.schema");
const { bulkResellerCustomerStatusSchema } = require("../../../schema/reseller/customer/bulkStatus.schema");
const { bulkSendResellerCampaignSchema } = require("../../../schema/reseller/customer/bulkSendCampaign.schema");

const listRoute = require("./list");
const createRoute = require("./create");
const updateRoute = require("./update");
const statusRoute = require("./status");
const bulkStatusRoute = require("./bulkStatus");
const detailRoute = require("./detail");
const changePlanRoute = require("./changePlan");
const bulkChangePlanRoute = require("./bulkChangePlan");
const rechargeRoute = require("./recharge");
const addTeamMemberRoute = require("./addTeamMember");
const sendTestMessageRoute = require("./sendTestMessage");
const bulkSendCampaignRoute = require("./bulkSendCampaign");

router.use("/", requireAuth, validator(resellerCustomersQuerySchema, "query"), listRoute);
router.use("/create", requireAuth, validator(createResellerCustomerSchema, "body"), createRoute);
router.use("/update", requireAuth, validator(updateResellerCustomerSchema, "body"), updateRoute);
router.use("/status", requireAuth, validator(updateResellerCustomerStatusSchema, "body"), statusRoute);
router.use("/bulk-status", requireAuth, validator(bulkResellerCustomerStatusSchema, "body"), bulkStatusRoute);
router.use("/detail", requireAuth, validator(resellerCustomerDetailSchema, "query"), detailRoute);
router.use("/change-plan", requireAuth, validator(changeResellerCustomerPlanSchema, "body"), changePlanRoute);
router.use("/bulk-change-plan", requireAuth, validator(bulkChangeResellerCustomerPlanSchema, "body"), bulkChangePlanRoute);
router.use("/recharge", requireAuth, validator(rechargeResellerCustomerSchema, "body"), rechargeRoute);
router.use("/add-team-member", requireAuth, validator(addResellerTeamMemberSchema, "body"), addTeamMemberRoute);
router.use("/send-test-message", requireAuth, validator(sendResellerTestMessageSchema, "body"), sendTestMessageRoute);
router.use("/bulk-send-campaign", requireAuth, validator(bulkSendResellerCampaignSchema, "body"), bulkSendCampaignRoute);

module.exports = router;
