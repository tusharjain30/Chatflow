const RESPONSE_CODES = require("../../../config/responseCode");
const bcrypt = require("bcrypt");

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
    try {

        const admin = req.admin;

        // Check SYSTEM_ADMIN role
        if (admin.role && admin.role.roleType !== "SYSTEM_ADMIN") {
            return res.status(RESPONSE_CODES.FORBIDDEN).json({
                status: 0,
                message: "Access denied",
                statusCode: RESPONSE_CODES.FORBIDDEN,
                data: {}
            });
        };

        const {
            name,
            email,
            phone,
            password,
            userName,
            roleName,
            permissionIds = []
        } = req.body;

        // check duplicares
        const existing = await prisma.admin.findFirst({
            where: {
                OR: [{ email }, { phone }, { userName }],
                isDeleted: false
            }
        });

        if (existing) {
            return res.status(RESPONSE_CODES.ALREADY_EXIST).json({
                status: 0,
                message: "Email/Phone/Username already exists",
                statusCode: RESPONSE_CODES.ALREADY_EXIST,
                data: {}
            })
        };

        let role;
        if (roleName) {
            // If custom role like MANAGER, SUPPORT etc.
            role = await prisma.role.findFirst({
                where: {
                    name: roleName.toUpperCase(),
                    roleType: "INTERNAL_ADMIN"
                }
            });

            if (!role) {
                role = await prisma.role.create({
                    data: {
                        name: roleName.toUpperCase(),
                        roleType: "INTERNAL_ADMIN"
                    }
                });
            }
        } else {
            // default internal admin role
            role = await prisma.role.findFirst({
                where: {
                    name: "INTERNAL_ADMIN",
                    roleType: "INTERNAL_ADMIN"
                }
            });

            if (!role) {
                role = await prisma.role.create({
                    data: {
                        name: "INTERNAL_ADMIN",
                        roleType: "INTERNAL_ADMIN",
                    }
                });
            }
        }

        // Assign Permissions to Role
        if (permissionIds.length > 0) {
            const permissions = await prisma.permission.findMany({
                where: {
                    id: { in: permissionIds },
                    isActive: true
                }
            });

            // Add role-permission mapping
            for (const perm of permissions) {
                await prisma.rolePermission.upsert({
                    where: {
                        roleId_permissionId: {
                            roleId: role.id,
                            permissionId: perm.id
                        }
                    },
                    update: {},
                    create: {
                        roleId: role.id,
                        permissionId: perm.id
                    }
                });
            }
        };

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Admin
        const newAdmin = await prisma.admin.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                userName: userName || null,
                isActive: true,
                isDeleted: false,
                isVerified: true,
                roleId: role.id
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        });

        const { password: _, ...safeAdmin } = newAdmin;

        res.status(RESPONSE_CODES.POST).json({
            status: 1,
            message: "Admin created successfully",
            statusCode: RESPONSE_CODES.POST,
            data: safeAdmin
        });

    } catch (error) {
        console.log("Admin Create Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal Server Error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        })
    }
});

module.exports = router;