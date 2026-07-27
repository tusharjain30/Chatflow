const express = require("express");
const router = express.Router();
const authRoutes = require("./auth");
const internalAdminRoutes = require("./internal-admin");
const permissionRoutes = require("./permission");
const profileRoutes = require("./profile");
const rollRoutes = require("./role");

router.use("/auth", authRoutes);
router.use("/internal-admin", internalAdminRoutes);
router.use("/permission", permissionRoutes);
router.use("/profile", profileRoutes);
router.use("/roles", rollRoutes);

module.exports = router;