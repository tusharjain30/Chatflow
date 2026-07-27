const RESPONSE_CODES = require("../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

router.delete("/", async (req, res) => {
    try {

        const admin = req.admin;
        const { roleId } = req.body;

        if (admin.role?.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {},
            });
        }

        const role = await prisma.role.findFirst({
            where: {
                id: roleId,
                isDeleted: false,
            },
        });

        if (!role) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Role not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {},
            });
        }

        if (role.roleType === "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "SYSTEM_ADMIN role cannot be deleted",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {},
            });
        }

        const assignedAdminsCount = await prisma.admin.count({
            where: {
                roleId: roleId,
                isDeleted: false,
            },
        });

        if (assignedAdminsCount > 0) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Role is assigned to admins. Remove role from admins first.",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {},
            });
        }

        await prisma.role.update({
            where: { id: roleId },
            data: {
                isDeleted: true,
                isActive: false,
            },
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Role deleted successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {},
        });

    } catch (error) {
        console.log("Delete role error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Something went wrong",
            statusCode: RESPONSE_CODES.ERROR,
            data: {},
        });
    }
});

module.exports = router;