const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");

router.post("/", async (req, res) => {
    try {

        const loggedInAdmin = req.admin;
        const { oldPassword, newPassword } = req.body;

        const admin = await prisma.admin.findUnique({
            where: { id: loggedInAdmin.id }
        });

        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Old password is incorrect",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            })
        }

        // Prevent same password reuse
        const samePassword = await bcrypt.compare(newPassword, admin.password);
        if (samePassword) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "New password must be different from old password",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.admin.update({
            where: {
                id: admin.id
            },
            data: {
                password: hashedPassword,
                tokenVersion: uuid()
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 0,
            message: "Password changed successfully, Please login again",
            statusCode: RESPONSE_CODES.GET,
            data: {}
        });

    } catch (error) {
        console.log("Admin change password error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;