const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.patch("/", async (req, res) => {
    try {

        const { id, isActive } = req.body;

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
            data: { isActive },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                updatedAt: true
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: `Customer ${isActive ? "activated" : "deactivated"} successfully`,
            statusCode: RESPONSE_CODES.GET,
            data: updatedCustomer
        })

    } catch (error) {
        console.log("Update Customer Status error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;