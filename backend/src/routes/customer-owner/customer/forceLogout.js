const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

const { v4: uuid } = require("uuid");

router.post("/", async (req, res) => {
    try {

        const { id } = req.body;

        const customer = await prisma.user.findFirst({
            where: {
                id,
                isDeleted: false,
            },
        });

        if (!customer) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Customer not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {},
            });
        }

        await prisma.user.update({
            where: { id },
            data: {
                tokenVersion: uuid()
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Customer logged out from all sessions successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {},
        })

    } catch (error) {
        console.log("Customer Force Logout Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;