const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.patch("/", async (req, res) => {
    try {

        const { id, isVerified } = req.body;

        const customer = await prisma.user.findFirst({
            where: {
                id,
                isDeleted: false
            }
        });

        if (!customer) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Customer not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            })
        }

        const updatedCustomer = await prisma.user.update({
            where: { id },
            data: { isVerified },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isVerified: true,
                updatedAt: true
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: `Customer ${isVerified ? "verified" : "unverified"} successfully`,
            statusCode: RESPONSE_CODES.GET,
            data: updatedCustomer
        })

    } catch (error) {
        console.log("Update customer verification  error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;