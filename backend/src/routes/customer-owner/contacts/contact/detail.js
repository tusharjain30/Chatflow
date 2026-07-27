const RESPONSE_CODES = require("../../../../config/responseCode");
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
    try {
        const params = req.validatedParams;
        const contactId = params.contactId;

        const { accountId } = req.auth;

        const contact = await prisma.contact.findFirst({
            where: {
                id: contactId,
                accountId,
                isDeleted: false
            },
            include: {
                groups: {
                    include: {
                        group: true
                    }
                },
                customValues: {
                    include: {
                        field: true
                    }
                }
            }
        });

        if (!contact) {
            return res.status(RESPONSE_CODES.NOT_FOUND).json({
                status: 0,
                message: "Contact not found",
                statusCode: RESPONSE_CODES.NOT_FOUND,
                data: {}
            });
        }

        // Normalize groups
        const groups = contact.groups.map(g => ({
            id: g.group.id, 
            title: g.group.title,
            description: g.group.description
        }));

        // Normalize custom fields
        const customFields = {};
        for (const item of contact.customValues) {
            customFields[item.field.key] = item.value;
        }

        res.status(RESPONSE_CODES.GET).json({
            status: 1,
            message: "Contact fetched successfully",
            statusCode: RESPONSE_CODES.GET,
            data: {
                id: contact.id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                country: contact.country,
                phone: contact.phone,
                languageCode: contact.languageCode,
                email: contact.email,
                isOptedOut: contact.isOptedOut,
                createdAt: contact.createdAt,
                updatedAt: contact.updatedAt,

                groups,
                customFields
            }
        });

    } catch (err) {
        console.error("Contact detail error:", err);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Internal server error",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    }
});

module.exports = router;