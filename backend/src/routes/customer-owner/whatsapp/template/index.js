const express = require("express");
const router = express.Router();

const validator = require("../../../../middleware/validator");
const requireAuth = require("../../../../middleware/requireAuth");
const requireOwner = require("../../../../middleware/requireOwner");
const parseJSONFields = require("../../../../middleware/parseJSONFields");
const upload = require("../../../../middleware/multerUpload");

const {
  createTemplateSchema,
} = require("../../../../schema/customer-owner/whatsapp/template/createTemplate.schema");
const {
  updateTemplateSchema,
} = require("../../../../schema/customer-owner/whatsapp/template/update.schema");
const {
  softDeleteTemplateSchema,
} = require("../../../../schema/customer-owner/whatsapp/template/delete.schema");
const {
  submitTemplateSchema,
} = require("../../../../schema/customer-owner/whatsapp/template/submit.schema");
const {
  templateDetailSchema,
} = require("../../../../schema/customer-owner/whatsapp/template/detail.schema");
const {
  duplicateTemplateSchema,
} = require("../../../../schema/customer-owner/whatsapp/template/duplicate.schema");

const createTemplateRoute = require("./create");
const updateTemplateRoute = require("./update");
const submitTemplateRoute = require("./submit");
const duplicateTemplateRoute = require("./duplicate");
const listRoute = require("./read");
const detailRoute = require("./detail");
const deleteRoute = require("./delete");

router.use(
  "/create",
  requireAuth,
  requireOwner,
  upload.single("file"),
  parseJSONFields,
  validator(createTemplateSchema, "body"),
  createTemplateRoute,
);

router.use(
  "/update",
  requireAuth,
  requireOwner,
  upload.single("file"),
  parseJSONFields,
  validator(updateTemplateSchema, "body"),
  updateTemplateRoute,
);

router.use(
  "/submit",
  requireAuth,
  requireOwner,
  validator(submitTemplateSchema, "body"),
  submitTemplateRoute,
);

router.use(
  "/duplicate",
  requireAuth,
  requireOwner,
  validator(duplicateTemplateSchema, "body"),
  duplicateTemplateRoute,
);

router.use("/list", requireAuth, requireOwner, listRoute);

router.use(
  "/detail/:templateId",
  requireAuth,
  requireOwner,
  validator(templateDetailSchema, "params"),
  detailRoute,
);

router.use(
  "/delete",
  requireAuth,
  requireOwner,
  validator(softDeleteTemplateSchema, "body"),
  deleteRoute,
);

module.exports = router;
