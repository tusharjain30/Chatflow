const RESPONSE_CODES = require("../../../config/responseCode");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.put("/", async (req, res) => {
    try {

        const loggedInAdmin = req.admin;
        const { adminId, name, phone, isActive, isVerified, roleId } = req.body;

        // Only Super Admin
        if (loggedInAdmin.role.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {}
            })
        }

        const admin = await prisma.admin.findFirst({
            where: {
                id: adminId,
                isDeleted: false
            }
        });

        if (!admin) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Admin not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            })
        }

        if (admin.id === loggedInAdmin.id && isActive === false) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "You cannot deactivate yourself"
            });
        }

        if (roleId) {
            const roleExists = await prisma.role.findFirst({
                where: {
                    id: roleId,
                    isDeleted: false,
                    isActive: true
                }
            });

            if (!roleExists) {
                return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                    status: 0,
                    message: "Invalid Role",
                    statusCode: RESPONSE_CODES.BAD_REQUEST,
                    data: {}
                });
            }
        }

        const updatedAdmin = await prisma.admin.update({
            where: { id: adminId },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(typeof isActive === "boolean" && { isActive }),
                ...(typeof isVerified === "boolean" && { isVerified }),
                ...(roleId && { roleId })
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                isVerified: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                        roleType: true
                    }
                }
            }
        });

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Admin updated successfully",
            statusCode: RESPONSE_CODES.GET,
            data: updatedAdmin
        });

    } catch (error) {
        console.log("Update Admin Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal Server Error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;