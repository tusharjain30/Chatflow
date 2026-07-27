const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const requireOwner = require("../../../middleware/requireOwner");
const validator = require("../../../middleware/validator");

const {
  createCampaignSchema,
} = require("../../../schema/customer-owner/campaign/createCampaign.schema");
const {
  addAudienceSchema,
} = require("../../../schema/customer-owner/campaign/campaignAudience.schema");
const {
  startCampaignSchema,
} = require("../../../schema/customer-owner/campaign/startCampaign.schema");
const {
  getCampaignsSchema,
} = require("../../../schema/customer-owner/campaign/list.schema");
const {
  getCampaignDetailSchema,
} = require("../../../schema/customer-owner/campaign/detail.schema");
const {
  getAudienceParamsSchema,
  getAudienceQuerySchema,
} = require("../../../schema/customer-owner/campaign/getAudience");
const {
  pauseCampaignSchema,
} = require("../../../schema/customer-owner/campaign/pauseCampaignSchema");
const {
  resumeCampaignSchema,
} = require("../../../schema/customer-owner/campaign/resumeCampaign.schema");
const {
  cancelCampaignSchema,
} = require("../../../schema/customer-owner/campaign/CancelCampaign.schema");
const {
  retryCampaignSchema,
} = require("../../../schema/customer-owner/campaign/RetryFailed.schema");
const {
  updateCampaignParamsSchema,
  updateCampaignSchema,
} = require("../../../schema/customer-owner/campaign/update.schema");
const {
  bulkDeleteCampaignSchema,
} = require("../../../schema/customer-owner/campaign/bulkDelete");
const {
  deleteCampaignParamsSchema,
} = require("../../../schema/customer-owner/campaign/delete.schema");
const {
  bulkAddAudienceSchema,
} = require("../../../schema/customer-owner/campaign/bulkAddAudience.schema");
const {
  removeAudienceSchema,
} = require("../../../schema/customer-owner/campaign/removeAudience.schema");
const {
  bulkRemoveAudienceSchema,
} = require("../../../schema/customer-owner/campaign/bulkRemoveAudience.schema");
const {
  getCampaignLogsParamsSchema,
  getCampaignLogsQuerySchema,
} = require("../../../schema/customer-owner/campaign/getCampaignLogs.schema");
const {
  campaignJobsParamsSchema,
  campaignJobsQuerySchema,
} = require("../../../schema/customer-owner/campaign/campaignJobs.schema");

const createCampaignRoute = require("./createCampaign");
const addAudienceToCampaignRoute = require("./addAudience");
const startCampaignRoute = require("./startCampaign");
const pauseCampaignRoute = require("./pauseCampaign");
const resumeCampaignRoute = require("./resumeCampaign");
const campaignListRoute = require("./list");
const detailRoute = require("./detail");
const updateCampaignRoute = require("./update");
const getCampaignAudienceRoute = require("./getCampaignAudience");
const cancelCampaignRoute = require("./CancelCampaign");
const retryCampaignRoute = require("./RetryFailed");
const statsRoute = require("./stats");
const bulkDeleteCampaignRoute = require("./bulkDelete");
const deleteCampaignRoute = require("./delete");
const bulkAddAudienceRoute = require("./bulkAddAudience");
const removeAudienceRoute = require("./removeAudience");
const bulkRemoveAudienceRoute = require("./bulkRemoveAudience");
const campaignLogsRoute = require("./getCampaignLogs");
const campaignJobsRoute = require("./campaignJobs");

router.use(
  "/create-campaign",
  requireAuth,
  requireOwner,
  validator(createCampaignSchema, "body"),
  createCampaignRoute,
);

router.use(
  "/audience",
  requireAuth,
  requireOwner,
  validator(addAudienceSchema, "body"),
  addAudienceToCampaignRoute,
);

router.use(
  "/start",
  requireAuth,
  requireOwner,
  validator(startCampaignSchema, "body"),
  startCampaignRoute,
);

router.use(
  "/pause",
  requireAuth,
  requireOwner,
  validator(pauseCampaignSchema, "body"),
  pauseCampaignRoute,
);

router.use(
  "/resume",
  requireAuth,
  requireOwner,
  validator(resumeCampaignSchema, "body"),
  resumeCampaignRoute,
);

router.use(
  "/list",
  requireAuth,
  validator(getCampaignsSchema, "query"),
  campaignListRoute,
);

router.use(
  "/detail/:id",
  requireAuth,
  validator(getCampaignDetailSchema, "params"),
  detailRoute,
);

router.use(
  "/:id/update",
  requireAuth,
  requireOwner,
  validator(updateCampaignParamsSchema, "params"),
  validator(updateCampaignSchema, "body"),
  updateCampaignRoute,
);

router.use(
  "/:id/audience",
  requireAuth,
  validator(getAudienceParamsSchema, "params"),
  validator(getAudienceQuerySchema, "query"),
  getCampaignAudienceRoute,
);

router.use(
  "/cancel",
  requireAuth,
  requireOwner,
  validator(cancelCampaignSchema, "body"),
  cancelCampaignRoute,
);

router.use(
  "/retry",
  requireAuth,
  requireOwner,
  validator(retryCampaignSchema, "body"),
  retryCampaignRoute,
);

router.use("/stats", requireAuth, statsRoute);

router.use(
  "/:id/delete",
  requireAuth,
  requireOwner,
  validator(deleteCampaignParamsSchema, "params"),
  deleteCampaignRoute,
);

router.use(
  "/bulk-delete",
  requireAuth,
  requireOwner,
  validator(bulkDeleteCampaignSchema, "body"),
  bulkDeleteCampaignRoute,
);

router.use(
  "/audience/bulk",
  requireAuth,
  requireOwner,
  validator(bulkAddAudienceSchema, "body"),
  bulkAddAudienceRoute,
);

router.use(
  "/audience/remove",
  requireAuth,
  requireOwner,
  validator(removeAudienceSchema, "body"),
  removeAudienceRoute,
);

router.use(
  "/audience/bulk-remove",
  requireAuth,
  requireOwner,
  validator(bulkRemoveAudienceSchema, "body"),
  bulkRemoveAudienceRoute,
);

router.use(
  "/:id/logs",
  requireAuth,
  validator(getCampaignLogsParamsSchema, "params"),
  validator(getCampaignLogsQuerySchema, "query"),
  campaignLogsRoute,
);

router.use(
  "/:id/jobs",
  requireAuth,
  validator(campaignJobsParamsSchema, "params"),
  validator(campaignJobsQuerySchema, "query"),
  campaignJobsRoute,
);

module.exports = router;
