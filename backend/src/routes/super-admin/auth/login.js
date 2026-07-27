const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client.js")
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const RESPONSE_CODES = require("../../../config/responseCode.js");

router.post("/", async (req, res) => {
    try {
        const { email, password, rememberMe = false } = req.body;

        // Find admin by email
        const admin = await prisma.admin.findFirst({
            where: {
                email,
                isDeleted: false
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });

        if (!admin) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Invalid email or password",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        // Check if account active
        if (!admin.isActive) {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Account is inactive",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {}
            });
        }

        // password verify
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Invalid email or password",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        // EXPIRY TIME logic (Remember Me)
        const expiresIn = rememberMe ? process.env.JWT_EXPIRATION : "15d";

        // Generate JWT token with tokenVersion
        const token = jwt.sign(
            {
                adminId: admin.id,
                role: admin.role.roleType,          // SYSTEM_ADMIN or INTERNAL_ADMIN
                tokenVersion: admin.tokenVersion,
            },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        // remove password in response
        const { password: _, ...safeAdmin } = admin;

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Login successful",
            statusCode: RESPONSE_CODES.GET,
            data: {
                token,
                expiresIn,
                rememberMe,
                role: admin.role.roleType,
                admin: safeAdmin
            }
        });

    } catch (error) {
        console.log("Admin Login Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal Server Error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;