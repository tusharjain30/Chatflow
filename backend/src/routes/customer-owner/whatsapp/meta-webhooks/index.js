const express = require("express");
const router = express.Router();

const handleMetaWebhook = require("./handleMetaWebhook");
const verifyMetaWebhook = require("./verifyMetaWebhook");

router.post("/webhook", handleMetaWebhook);
router.get("/webhook", verifyMetaWebhook);

module.exports = router;