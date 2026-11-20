const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const requireOwner = require("../../../middleware/requireOwner");
const validator = require("../../../middleware/validator");

const {
  createTicketSchema,
} = require("../../../schema/customer-owner/support/createTicket.schema");
const {
  listTicketsSchema,
} = require("../../../schema/customer-owner/support/listTickets.schema");
const {
  ticketDetailSchema,
} = require("../../../schema/customer-owner/support/ticketDetail.schema");

const listRoute = require("./list");
const createRoute = require("./create");
const detailRoute = require("./detail");

router.use(
  "/list",
  requireAuth,
  requireOwner,
  validator(listTicketsSchema, "query"),
  listRoute,
);

router.use(
  "/create",
  requireAuth,
  requireOwner,
  validator(createTicketSchema, "body"),
  createRoute,
);

router.use(
  "/detail/:ticketId",
  requireAuth,
  requireOwner,
  validator(ticketDetailSchema, "params"),
  detailRoute,
);

module.exports = router;
