const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const requireOwner = require("../../../middleware/requireOwner");
const validator = require("../../../middleware/validator");
const { z } = require("zod");

const {
  createWebhookSchema,
} = require("../../../schema/customer-owner/developer/createWebhook.schema");

const tokensList = require("./tokensList");
const tokensGenerate = require("./tokensGenerate");
const tokensDelete = require("./tokensDelete");
const webhooksList = require("./webhooksList");
const webhooksCreate = require("./webhooksCreate");
const webhooksDelete = require("./webhooksDelete");

const tokenIdSchema = z.object({
  tokenId: z.string().uuid("Invalid token id"),
});

const webhookIdSchema = z.object({
  webhookId: z.string().uuid("Invalid webhook id"),
});

router.use(
  "/tokens/generate",
  requireAuth,
  requireOwner,
  tokensGenerate,
);
router.use(
  "/tokens/:tokenId",
  requireAuth,
  requireOwner,
  validator(tokenIdSchema, "params"),
  tokensDelete,
);
router.use("/tokens", requireAuth, requireOwner, tokensList);

router.use(
  "/webhooks/create",
  requireAuth,
  requireOwner,
  validator(createWebhookSchema, "body"),
  webhooksCreate,
);
router.use(
  "/webhooks/:webhookId",
  requireAuth,
  requireOwner,
  validator(webhookIdSchema, "params"),
  webhooksDelete,
);
router.use("/webhooks", requireAuth, requireOwner, webhooksList);

module.exports = router;
