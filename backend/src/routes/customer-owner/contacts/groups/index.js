const express = require("express");
const router = express.Router();

const requireAuth = require("../../../../middleware/requireAuth");
const validator = require("../../../../middleware/validator");

const { createContactGroupSchema } = require("../../../../schema/customer-owner/contacts/groups/createGroup.schema");
const { updateGroupSchema } = require("../../../../schema/customer-owner/contacts/groups/updateGroup.schema");
const { detailGroupSchema } = require("../../../../schema/customer-owner/contacts/groups/detail.schema");
const { toggleArchiveGroupSchema } = require("../../../../schema/customer-owner/contacts/groups/toggleArchiveGroup.schema");
const { toggleArchiveBulkSchema } = require("../../../../schema/customer-owner/contacts/groups/toggleArchiveBulk.schema");
const { deleteGroupSchema } = require("../../../../schema/customer-owner/contacts/groups/delete.schema");
const { bulkDeleteGroupSchema } = require("../../../../schema/customer-owner/contacts/groups/bulkDelete.schema");
const { readGroupsBodySchema } = require("../../../../schema/customer-owner/contacts/groups/read.schema");
const { removeContactsFromGroupSchema } = require("../../../../schema/customer-owner/contacts/groups/removeContactsFromGroup.schema");
const { getGroupContactsQuerySchema, getGroupContactsParamsSchema } = require("../../../../schema/customer-owner/contacts/groups/getGroupContacts.schema");

const createGroupRoute = require("./create");
const updateGroupRoute = require("./update");
const groupDetailsRoute = require("./details");
const toggleArchiveGroupRoute = require("./toggleArchiveGroup");
const toggleArchiveBulkRoute = require("./toggleArchiveBulk");
const deleteRoute = require("./delete");
const bulkDeleteRoute = require("./bulkDelete");
const readRoute = require("./read");
const removeContactsFromGroupRoute = require("./removeContactsFromGroup");
const getGroupContactsRoute = require("./getGroupContacts");
const requireOwner = require("../../../../middleware/requireOwner");

router.use("/create", requireAuth, requireOwner, validator(createContactGroupSchema, "body"), createGroupRoute);
router.use("/update", requireAuth, requireOwner, validator(updateGroupSchema, "body"), updateGroupRoute);
router.use("/detail/:groupId", requireAuth, requireOwner, validator(detailGroupSchema, "params"), groupDetailsRoute);
router.use("/toggle-archive", requireAuth, requireOwner, validator(toggleArchiveGroupSchema, "body"), toggleArchiveGroupRoute);
router.use("/toggle-archive-bulk", requireAuth, requireOwner, validator(toggleArchiveBulkSchema, "body"), toggleArchiveBulkRoute);
router.use("/delete/:groupId", requireAuth, requireOwner, validator(deleteGroupSchema, "params"), deleteRoute);
router.use("/bulk-delete", requireAuth, requireOwner, validator(bulkDeleteGroupSchema, "body"), bulkDeleteRoute);
router.use("/read", requireAuth, requireOwner, validator(readGroupsBodySchema, "query"), readRoute);
router.use("/remove-contacts", requireAuth, requireOwner, validator(removeContactsFromGroupSchema, "body"), removeContactsFromGroupRoute);
router.use("/contacts/:groupId", requireAuth, requireOwner, validator(getGroupContactsParamsSchema, "params"), validator(getGroupContactsQuerySchema, "query"), getGroupContactsRoute);

module.exports = router;
