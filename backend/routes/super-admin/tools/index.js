const express = require("express");

const adminAuth = require("../../../middleware/adminAuth");
const validator = require("../../../middleware/validator");

const { adminToolCustomerListSchema } = require("../../../schema/super-admin/tools/customerList.schema");
const { adminLoginAsCustomerSchema } = require("../../../schema/super-admin/tools/loginAsCustomer.schema");
const { adminLoginAsResellerSchema } = require("../../../schema/super-admin/tools/loginAsReseller.schema");
const { adminForceActivateSchema } = require("../../../schema/super-admin/tools/forceActivate.schema");
const { adminResetLimitsSchema } = require("../../../schema/super-admin/tools/resetLimits.schema");

const customersRoute = require("./customers");
const loginAsCustomerRoute = require("./loginAsCustomer");
const loginAsResellerRoute = require("./loginAsReseller");
const forceActivateRoute = require("./forceActivate");
const resetLimitsRoute = require("./resetLimits");

const router = express.Router();

router.use("/customers", adminAuth, validator(adminToolCustomerListSchema, "query"), customersRoute);
router.use("/login-as-customer", adminAuth, validator(adminLoginAsCustomerSchema, "body"), loginAsCustomerRoute);
router.use("/login-as-reseller", adminAuth, validator(adminLoginAsResellerSchema, "body"), loginAsResellerRoute);
router.use("/force-activate", adminAuth, validator(adminForceActivateSchema, "body"), forceActivateRoute);
router.use("/reset-limits", adminAuth, validator(adminResetLimitsSchema, "body"), resetLimitsRoute);

module.exports = router;
