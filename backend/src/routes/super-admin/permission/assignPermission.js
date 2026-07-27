const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const RESPONSE_CODES = require("../../../config/responseCode");

router.post("/", async (req, res) => {
    try {

        const admin = req.admin;
        const { roleId, permissionIds } = req.body;

        if (admin.role.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
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

        // Fetch valid permissions
        const permissions = await prisma.permission.findMany({
            where: {
                id: { in: permissionIds },
                isDeleted: false,
                isActive: true
            }
        });

        if (!permissions.length) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "No valid permissions found",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            })
        };

        // Assign Permissions
        for (const permission of permissions) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId,
                        permissionId: permission.id
                    }
                },
                update: {},
                create: {
                    roleId,
                    permissionId: permission.id
                }
            });
        }

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Permissions assigned to role successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {}
        });

    } catch (error) {
        console.log("Assign Permission Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;