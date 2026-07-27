const express = require("express");
const router = express.Router();

const adminAuth = require("../../../middleware/adminAuth");
const requireAuth = require("../../../middleware/requireAuth");
const checkPermission = require("../../../middleware/checkPermission");
const validator = require("../../../middleware/validator");

const { getCustomersQuerySchema } = require("../../../schema/customer-owner/customer/list.schema");
const { getCustomerByIdSchema } = require("../../../schema/customer-owner/customer/getCustomerById.schema");
const { updateCustomerBodySchema } = require("../../../schema/customer-owner/customer/update.schema");
const { customerStatusBodySchema } = require("../../../schema/customer-owner/customer/status.schema");
const { customerVerificationBodySchema } = require("../../../schema/customer-owner/customer/verify.schema");
const { deleteCustomerBodySchema } = require("../../../schema/customer-owner/customer/delete.schema");
const { customerForceLogoutSchema } = require("../../../schema/customer-owner/customer/forceLogout.schema");

const getCustomerListRoute = require("./list");
const getCustomerByIdRoute = require("./getCustomerById");
const updateRoute = require("./update");
const statusRoute = require("./status");
const verifyRoute = require("./verify");
const deleteRoute = require("./delete");
const statsRoute = require("./stats");
const forceLogoutRoute = require("./forceLogout");
const profileRoute = require("./profile");

router.use("/list", adminAuth, checkPermission("VIEW_CUSTOMERS"), validator(getCustomersQuerySchema, "query"), getCustomerListRoute);
router.use("/detail", adminAuth, checkPermission("VIEW_CUSTOMER"), validator(getCustomerByIdSchema, "body"), getCustomerByIdRoute);
router.use("/update", adminAuth, checkPermission("UPDATE_CUSTOMER"), validator(updateCustomerBodySchema, "body"), updateRoute);
router.use("/status", adminAuth, checkPermission("UPDATE_CUSTOMER_STATUS"), validator(customerStatusBodySchema, "body"), statusRoute);
router.use("/verify", adminAuth, checkPermission("VERIFY_CUSTOMER"), validator(customerVerificationBodySchema, "body"), verifyRoute);
router.use("/delete", adminAuth, checkPermission("DELETE_CUSTOMER"), validator(deleteCustomerBodySchema, "body"), deleteRoute);
router.use("/stats", adminAuth, checkPermission("VIEW_CUSTOMER_STATS"), statsRoute);
router.use("/force-logout", adminAuth, checkPermission("FORCE_LOGOUT_CUSTOMER"), validator(customerForceLogoutSchema, "body"), forceLogoutRoute);
router.use("/me", requireAuth, profileRoute);

module.exports = router;
