const express = require("express");
const router = express.Router();

const VerifyWhatsappNumberRoutes = require("./VerifyWhatsappNumber");
const createApiRoutes = require("./create-api");
const templateRoutes = require("./template");
const webhookRoutes = require("./meta-webhooks");
const botRoutes = require("./bots");
const botFlowRoutes = require("./bot-flows");
const messageRoutes = require("./messages");

router.use("/verify-whatsapp-number", VerifyWhatsappNumberRoutes);
router.use("/create", createApiRoutes);
router.use("/template", templateRoutes);
router.use("/meta", webhookRoutes);
router.use("/bot", botRoutes);
router.use("/bot-flow", botFlowRoutes);
router.use("/message", messageRoutes);

module.exports = router;