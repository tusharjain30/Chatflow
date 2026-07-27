const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

const {PrismaClient} = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
    try{

        const permissions = await prisma.permission.findMany({
            where: {
                isDeleted: false,
                isActive: true
            },
            orderBy: {
                name: "asc"
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Permission list fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: permissions
        });

    }catch (error){
        console.log("Permission List Error: ", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;