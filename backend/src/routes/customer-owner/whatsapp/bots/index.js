const express = require("express");
const router = express.Router();

const validator = require("../../../../middleware/validator");
// const requireAuth = require("../../../../middleware/requireAuth");
const serviceAuth = require("../../../../middleware/serviceAuth");
const upload = require("../../../../middleware/multerUpload");
const parseJSONFields = require("../../../../middleware/parseJSONFields");

const { createSimpleBotSchema } = require("../../../../schema/customer-owner/whatsapp/bots/createSimple.schema");
const { getAllBotsSchema } = require("../../../../schema/customer-owner/whatsapp/bots/list.schema");
const { getBotByIdSchema } = require("../../../../schema/customer-owner/whatsapp/bots/detail.schema");
const { deleteBotSchema } = require("../../../../schema/customer-owner/whatsapp/bots/delete.schema");
const { statusBotSchema } = require("../../../../schema/customer-owner/whatsapp/bots/status.schema");
const { createMediaBotSchema } = require("../../../../schema/customer-owner/whatsapp/bots/createMedia.schema");
const { createAdvanceBotSchema } = require("../../../../schema/customer-owner/whatsapp/bots/createInteractive.schema");
const { updateBotReplySchema } = require("../../../../schema/customer-owner/whatsapp/bots/update.schema");

const createSimpleBotRoute = require("./createSimple");
const createMediaBotRoute = require("./createMedia");
const createInteractiveBotRoute = require("./createInteractive");
const listRoute = require("./list");
const detailRoute = require("./detail");
const deleteRoute = require("./delete");
const statusRoute = require("./status");
const updateRoute = require("./update");

router.use("/createSimpleBot", serviceAuth("BOT"), validator(createSimpleBotSchema, "body"), createSimpleBotRoute);
router.use("/createMediaBot", serviceAuth("BOT"), upload.single("mediaFile"), validator(createMediaBotSchema, "body"), createMediaBotRoute);
router.use("/createInteractiveBot", serviceAuth("BOT"), upload.single("mediaFile"), parseJSONFields, validator(createAdvanceBotSchema, "body"), createInteractiveBotRoute);
router.use("/list", serviceAuth("BOT"), validator(getAllBotsSchema, "query"), listRoute);
router.use("/detail", serviceAuth("BOT"), validator(getBotByIdSchema, "body"), detailRoute);
router.use("/delete", serviceAuth("BOT"), validator(deleteBotSchema, "body"), deleteRoute);
router.use("/status", serviceAuth("BOT"), validator(statusBotSchema, "body"), statusRoute);
router.use("/update", serviceAuth("BOT"), upload.single("mediaFile"), parseJSONFields, validator(updateBotReplySchema, "body"), updateRoute);

module.exports = router;
