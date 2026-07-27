const express = require("express");
const router = express.Router();

const validator = require("../../../../middleware/validator");
const serviceAuth = require("../../../../middleware/serviceAuth");
const upload = require("../../../../middleware/multerUpload");
const parseJSONFields = require("../../../../middleware/parseJSONFields");

const { createBotFlowSchema } = require("../../../../schema/customer-owner/whatsapp/bot-flows/create.schema");
const { updateBotFlowSchema } = require("../../../../schema/customer-owner/whatsapp/bot-flows/update.schema");
const { deleteBotFlowSchema } = require("../../../../schema/customer-owner/whatsapp/bot-flows/delete.schema");
const { createSimpleBotReplySchema } = require("../../../../schema/customer-owner/whatsapp/bot-flows/createSimpleBotReply.schema");
const { updateSimpleBotReplySchema } = require("../../../../schema/customer-owner/whatsapp/bot-flows/updateSimpleBotReply.schema");
const { deleteSimpleBotReplySchema } = require("../../../../schema/customer-owner/whatsapp/bot-flows/deleteSimpleBotReply.schema");
const { createMediaBotReplySchema } = require("../../../../schema/customer-owner/whatsapp/bot-flows/createMediaBotReply.schema");
const { updateMediaBotReplySchema } = require("../../../../schema/customer-owner/whatsapp/bot-flows/updateMediaBotReply.schema");
const { deleteMediaBotReplySchema } = require("../../../../schema/customer-owner/whatsapp/bot-flows/deleteMediaBotReply.schema");
const { createInteractiveBotReplySchema } = require("../../../../schema/customer-owner/whatsapp/bot-flows/createAdvanceBotReply.schema");

const createRoute = require("./create");
const updateRoute = require("./update");
const deleteRoute = require("./delete");
const createSimpleBotReplyRoute = require("./createSimpleBotReply");
const updateSimpleBotReplyRoute = require("./updateSimpleBotReply");
const deleteSimpleBotReplyRoute = require("./deleteSimpleBotReply");
const createMediaBotReplyRoute = require("./createMediaBotReply");
const updateMediaBotReplyRoute = require("./updateMediaBotReply");
const deleteMediaBotReplyRoute = require("./deleteMediaBotReply");
const createInteractiveBotReplyRoute = require("./createInteractiveBotReply");

router.use("/create", serviceAuth("BOT"), validator(createBotFlowSchema, "body"), createRoute);
router.use("/update", serviceAuth("BOT"), validator(updateBotFlowSchema, "body"), updateRoute);
router.use("/delete", serviceAuth("BOT"), validator(deleteBotFlowSchema, "body"), deleteRoute);

router.use("/createSimpleBotReply", serviceAuth("BOT"), validator(createSimpleBotReplySchema, "body"), createSimpleBotReplyRoute);
router.use("/updateSimpleBotReply", serviceAuth("BOT"), validator(updateSimpleBotReplySchema, "body"), updateSimpleBotReplyRoute);
router.use("/deleteSimpleBotReply", serviceAuth("BOT"), validator(deleteSimpleBotReplySchema, "body"), deleteSimpleBotReplyRoute);

router.use("/createMediaBotReply", serviceAuth("BOT"), upload.single("mediaFile"), parseJSONFields, validator(createMediaBotReplySchema, "body"), createMediaBotReplyRoute);
router.use("/updateMediaBotReply", serviceAuth("BOT"), upload.single("mediaFile"), parseJSONFields, validator(updateMediaBotReplySchema, "body"), updateMediaBotReplyRoute);
router.use("/deleteMediaBotReply", serviceAuth("BOT"), validator(deleteMediaBotReplySchema, "body"), deleteMediaBotReplyRoute);

router.use("/createInteractiveBotReply", serviceAuth("BOT"), upload.single("mediaFile"), parseJSONFields, validator(createInteractiveBotReplySchema, "body"), createInteractiveBotReplyRoute);

module.exports = router;
