const express = require("express");
const router = express.Router();

const contactRoutes = require("./contact");
const groupRoutes = require("./groups");
const customFieldRoutes = require("./custom-fields");

router.use("/contact", contactRoutes);
router.use("/groups", groupRoutes);
router.use("/custom-fields", customFieldRoutes);

module.exports = router;