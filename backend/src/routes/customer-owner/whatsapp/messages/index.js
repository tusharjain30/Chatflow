const express = require("express");
const router = express.Router();

const validator = require("../../../../middleware/validator");
const requireAuth = require("../../../../middleware/requireAuth");
const upload = require("../../../../middleware/multerUpload");

const {
  sendTextMessageSchema,
} = require("../../../../schema/customer-owner/whatsapp/messages/sendTextMessage.schema");
const {
  sendMediaMessageSchema,
} = require("../../../../schema/customer-owner/whatsapp/messages/sendMediaMessage.schema");
const {
  sendTemplateMessageSchema,
} = require("../../../../schema/customer-owner/whatsapp/messages/sendTemplateMessage.schema");
const {
  messageDetailSchema,
} = require("../../../../schema/customer-owner/whatsapp/messages/detail.schema");

const textMessageRoute = require("./text");
const sendMediaRoute = require("./sendMedia");
const sendTemplateRoute = require("./sendTemplate");
const listRoute = require("./read");
const detailRoute = require("./detail");

router.use(
  "/send-text",
  requireAuth,
  validator(sendTextMessageSchema, "body"),
  textMessageRoute
);

router.use(
  "/send-media",
  requireAuth,
  upload.single("file"),
  validator(sendMediaMessageSchema, "body"),
  sendMediaRoute
);

router.use(
  "/send-template",
  requireAuth,
  validator(sendTemplateMessageSchema, "body"),
  sendTemplateRoute
);

router.use("/list", requireAuth, listRoute);

router.use(
  "/detail/:messageId",
  requireAuth,
  validator(messageDetailSchema, "params"),
  detailRoute
);

module.exports = router;

