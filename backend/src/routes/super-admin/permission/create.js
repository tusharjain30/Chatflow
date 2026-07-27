const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

import prisma from "../../../config/prisma";

router.post("/", async (req, res) => {
    try {

        const admin = req.admin;
        let { name } = req.body;
        name = name.toUpperCase();

        // Only Super Admin
        if (admin.role.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {}
            })
        };

        const existing = await prisma.permission.findFirst({
            where: {
                name
            }
        });

        if (existing) {
            return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
                status: 0,
                message: "Permission already exists",
                statusCode: RESPONSE_CODES.ALREADY_EXIST,
                data: {}
            })
        };

        const permission = await prisma.permission.create({
            data: {
                name
            }
        });

        res.status(RESPONSE_CODES.POST).json({
            status: 1,
            message: "Permission created successfully",
            statusCode: RESPONSE_CODES.POST,
            data: permission
        });

    } catch (error) {
        console.log("Permission Create Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;