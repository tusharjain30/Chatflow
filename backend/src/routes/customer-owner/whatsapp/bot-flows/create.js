const RESPONSE_CODES = require("../../../../config/responseCode");

const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
    try {

        const userId = req.apiContext.userId;
        const { title, startTriggerSubject } = req.body;

        const trigger = startTriggerSubject.toLowerCase();

        const existingBot = await prisma.bot.findFirst({
            where: {
                userId,
                triggerType: "KEYWORD",
                triggerValue: trigger,
                isDeleted: false
            }
        });

        if (existingBot) {
            return res.status(RESPONSE_CODES.BAD_REQUEST).json({
                status: 0,
                message: "Bot with same trigger already exists",
                statusCode: RESPONSE_CODES.BAD_REQUEST,
                data: {}
            });
        }

        const result = await prisma.$transaction(async (tx) => {

            const bot = await tx.bot.create({
                data: {
                    userId,
                    name: title,
                    botType: "FLOW",
                    triggerType: "KEYWORD",
                    triggerValue: trigger,
                    entryNodeKey: "START",
                    isActive: true,
                    isDeleted: false
                }
            });

            const flow = await tx.botFlow.create({
                data: {
                    botId: bot.id,
                    version: 1,
                    isPublished: false,
                    flowDefinition: {
                        startNode: "START",
                        nodes: [
                            {
                                nodeKey: "START",
                                type: "MESSAGE",
                                label: "Start",
                                next: null
                            }
                        ],
                        edges: []
                    }
                }
            });

            await tx.botReply.create({
                data: {
                    botId: bot.id,
                    name: "Start Node",
                    nodeKey: "START",
                    isStart: true,
                    replyType: "SIMPLE",
                    triggerType: "DEFAULT",
                    bodyText: "Welcome!",
                    isActive: true,
                    isDeleted: false
                }
            });

            return { bot, flow };
        });

        res.status(RESPONSE_CODES.POST).json({
            status: 1,
            message: "Bot flow created successfully",
            statusCode: RESPONSE_CODES.POST,
            data: {
                botId: result.bot.id,
                flowId: result.flow.id
            }
        });

    } catch (error) {
        console.log("Create Bot Flow Error:", error);
        res.status(RESPONSE_CODES.ERROR).json({
            status: 0,
            message: "Failed to create bot flow",
            statusCode: RESPONSE_CODES.ERROR,
            data: {}
        });
    };
})

module.exports = router;