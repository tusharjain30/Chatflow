const express = require("express");
const router = express.Router();

const requireAuth = require("../../../../middleware/requireAuth");
const validator = require("../../../../middleware/validator");

const { createCustomFieldSchema } = require("../../../../schema/customer-owner/contacts/custom-fields/create.schema");
const { updateCustomFieldSchema } = require("../../../../schema/customer-owner/contacts/custom-fields/update.schema");
const { customFieldDetailSchema } = require("../../../../schema/customer-owner/contacts/custom-fields/detail.schema");
const { listCustomFieldsSchema } = require("../../../../schema/customer-owner/contacts/custom-fields/list.schema");
const { deleteCustomFieldSchema } = require("../../../../schema/customer-owner/contacts/custom-fields/delete.schema");
const { bulkDeleteCustomFieldsSchema } = require("../../../../schema/customer-owner/contacts/custom-fields/bulkDeleteSchema");

const createRoute = require("./create");
const updateRoute = require("./update");
const detailRoute = require("./detail");
const listRoute = require("./list");
const deleteRoute = require("./delete");
const bulkDeleteRoute = require("./bulkDelete");
const requireOwner = require("../../../../middleware/requireOwner");

router.use("/create", requireAuth, requireOwner, validator(createCustomFieldSchema, "body"), createRoute);
router.use("/update", requireAuth, requireOwner, validator(updateCustomFieldSchema, "body"), updateRoute);
router.use("/detail/:fieldId", requireAuth, requireOwner, validator(customFieldDetailSchema, "params"), detailRoute);
router.use("/list", requireAuth, requireOwner, validator(listCustomFieldsSchema, "query"), listRoute);
router.use("/delete/:fieldId", requireAuth, requireOwner, validator(deleteCustomFieldSchema, "params"), deleteRoute);
router.use("/bulk-delete", requireAuth, requireOwner, validator(bulkDeleteCustomFieldsSchema, "body"), bulkDeleteRoute);

module.exports = router;
