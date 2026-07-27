const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        let { roleId } = req.validatedParams;
        roleId = Number(roleId);

        if (!roleId) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Invalid role id",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            })
        }

        const role = await prisma.role.findFirst({
            where: {
                id: roleId,
                isDeleted: false,
                isActive: true
            }
        });

        if (!role) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Role not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            })
        }

        const permissions = await prisma.rolePermission.findMany({
            where: {
                roleId
            },
            include: {
                permission: true
            },
            orderBy: {
                permission: {
                    name: "asc"
                }
            }
        });

        const data = permissions.map(p => ({
            id: p.permission.id,
            name: p.permission.name
        }))

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Role permissions fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data
        });

    } catch (error) {
        console.log("Role Permission List Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;