const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.delete("/", async (req, res) => {
    try {

        const { roleId, permissionId } = req.body;
        const admin = req.admin;

        // Only System-Admin
        if (admin.role.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {}
            });
        }

        const permission = await prisma.rolePermission.findUnique({
            where: {
                roleId_permissionId: {
                    roleId,
                    permissionId
                }
            }
        });

        if (!permission) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Permission not assigned to this role",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            })
        }

        await prisma.rolePermission.delete({
            where: {
                roleId_permissionId: {
                    roleId,
                    permissionId
                }
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Permission removed from role successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {}
        });

    } catch (error) {
        console.log("Remove Permission Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;