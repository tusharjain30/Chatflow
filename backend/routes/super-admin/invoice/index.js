const express = require("express");

const adminAuth = require("../../../middleware/adminAuth");
const validator = require("../../../middleware/validator");
const { invoiceListQuerySchema } = require("../../../schema/super-admin/invoice/list.schema");

const listRoute = require("./list");
const downloadRoute = require("./download");

const router = express.Router();

router.use("/list", adminAuth, validator(invoiceListQuerySchema, "query"), listRoute);
router.use("/download", adminAuth, validator(invoiceListQuerySchema, "query"), downloadRoute);
router.use(
  "/download/:invoiceId",
  adminAuth,
  validator(
    require("zod").z.object({
      invoiceId: require("zod").z.string().min(1, "Invoice id is required"),
    }),
    "params",
  ),
  downloadRoute,
);

module.exports = router;
