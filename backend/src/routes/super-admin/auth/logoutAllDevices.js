const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client.js")
const prisma = new PrismaClient();

const { v4: uuid } = require("uuid");
const RESPONSE_CODES = require("../../../config/responseCode");

router.post("/", async (req, res) => {
    try {
        const adminId = req.admin.id;

        // Rotate tokenVersion
        await prisma.admin.update({
            where: { id: adminId },
            data: { tokenVersion: uuid() }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Logged out from all devices successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {}
        });

    } catch (error) {
        console.log("Logout All Devices Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal Server Error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;