const RESPONSE_CODES = require("../../../config/responseCode");

const {PrismaClient} = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.put("/", async (req, res) => {
    try{

        const loggedInAdmin = req.admin;
        const {permissionId, name, isActive} = req.body;

        // Only system-admin
        if(loggedInAdmin.role.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {}
            })
        }

        const permission = await prisma.permission.findFirst({
            where: {
                id: permissionId,
                isDeleted: false
            }
        })

        if(!permission) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Permission not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            })
        }

        if(name && name !== permission.name) {
            const exists = await prisma.permission.findFirst({
                where: {
                    name,
                    isDeleted: false
                }
            })

            if(exists) {
                return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                    status: 0,
                    message: "Permission name already exists",
                    statusCode: RESPONSE_CODES.BAD_REQUEST,
                    data: {}
                })
            }
        }

        const updatePermission = await prisma.permission.update({
            where: {id: permissionId},
            data: {
                ...(name && {name}),
                ...(typeof isActive === "boolean" && {isActive})
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Permission updated successfully",
            statusCode: RESPONSE_CODES.GET,
            data: updatePermission
        })

    }catch (error){
        console.log("Update permission error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;
