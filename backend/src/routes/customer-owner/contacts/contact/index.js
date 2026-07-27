const express = require("express");
const router = express.Router();

const requireAuth = require("../../../../middleware/requireAuth");
const validator = require("../../../../middleware/validator");

const { createContactSchema } = require("../../../../schema/customer-owner/contacts/contact/createContact.schema");
const { updateContactSchema } = require("../../../../schema/customer-owner/contacts/contact/updateContact.schema");
const { assignGroupsToContactsSchema } = require("../../../../schema/customer-owner/contacts/contact/assignGroupsToContacts.schema");
const { deleteContactSchema } = require("../../../../schema/customer-owner/contacts/contact/delete.schema");
const { bulkDeleteContactsSchema } = require("../../../../schema/customer-owner/contacts/contact/bulkDelete.schema");
const { detailContactSchema } = require("../../../../schema/customer-owner/contacts/contact/detail.schema");

const createContactRoute = require("./createContact");
const updateContactRoute = require("./updateContact");
const contactDetailsRoute = require("./detail");
const readContactsRoute = require("./read");
const deleteContactsRoute = require("./delete");
const bulkDeleteRoute = require("./bulkDelete");
const importContactsRoute = require("./importContacts");
const exportContactsRoute = require("./exportContacts");
const assignGroupsToContactsRoute = require("./assignGroupsToContacts");
const requireOwner = require("../../../../middleware/requireOwner");

router.use("/create", requireAuth, requireOwner, validator(createContactSchema, "body"), createContactRoute);
router.use("/update", requireAuth, requireOwner, validator(updateContactSchema, "body"), updateContactRoute);
router.use("/detail/:contactId", requireAuth, requireOwner, validator(detailContactSchema, "params"), contactDetailsRoute);
router.use("/read", requireAuth, requireOwner, readContactsRoute);
router.use("/delete/:contactId", requireAuth, requireOwner, validator(deleteContactSchema, "params"), deleteContactsRoute);
router.use("/bulk-delete", requireAuth, requireOwner, validator(bulkDeleteContactsSchema, "body"), bulkDeleteRoute);
router.use("/import", requireAuth, requireOwner, importContactsRoute);
router.use("/export", requireAuth, requireOwner, exportContactsRoute);
router.use("/assign-groups", requireAuth, requireOwner, validator(assignGroupsToContactsSchema, "body"), assignGroupsToContactsRoute);

module.exports = router;
