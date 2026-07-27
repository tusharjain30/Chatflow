const jwt = require("jsonwebtoken");

const { PrismaClient } = require("../generated/prisma/client");
const prisma = new PrismaClient();

const hashToken = require("../utils/hashToken");
const RESPONSE_CODES = require("../config/responseCode");

const serviceAuth = (requiredService) => {
    return async (req, res, next) => {
        try {

            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                    status: 0,
                    message: "API token missing",
                    statusCode: RESPONSE_CODES.UNAUTHORIZED,
                    data: {}
                });
            }

            const token = authHeader.split(" ")[1];

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.SERVICE_TOKEN_SECRET);
            } catch (error) {
                console.log(error)
                return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                    status: 0,
                    message: "Invalid API token",
                    statusCode: RESPONSE_CODES.UNAUTHORIZED,
                    data: {}
                });
            }

            const { userId, service, accountId } = decoded;

            if (service !== requiredService) {
                return res.status(RESPONSE_CODES.FORBIDDEN).json({
                    status: 0,
                    message: `API token not allowed for ${requiredService}`,
                    statusCode: RESPONSE_CODES.FORBIDDEN,
                    data: {}
                });
            }

            const tokenHash = token;

            const accessToken = await prisma.accessToken.findFirst({
                where: {
                    userId,
                    service: requiredService,
                    tokenHash,
                    isActive: true
                }
            });

            if (!accessToken) {
                return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                    status: 0,
                    message: "API token revoked or invalid",
                    statusCode: RESPONSE_CODES.UNAUTHORIZED,
                    data: {}
                });
            }

            const user = await prisma.user.findFirst({
                where: {
                    id: userId,
                    isActive: true,
                    isDeleted: false
                }
            });

            if (!user) {
                return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                    status: 0,
                    message: "User inactive or deleted",
                    statusCode: RESPONSE_CODES.UNAUTHORIZED,
                    data: {}
                });
            }

            // check limits
            if (accessToken.limitValue !== null && accessToken.usedValue >= accessToken.limitValue) {
                return res.status(RESPONSE_CODES.FORBIDDEN).json({
                    status: 0,
                    message: "Service usage limit exceeded",
                    statusCode: RESPONSE_CODES.FORBIDDEN,
                    data: {}
                });
            }

            req.apiContext = {
                userId,
                accountId,
                service,
                accessTokenId: accessToken.id
            };

            next();

        } catch (error) {
            console.log("Service Auth middleware error:", error);
            res.status(RESPONSE_CODES.ERROR).json({
                status: 0,
                message: "Internal server error",
                statusCode: RESPONSE_CODES.ERROR,
                data: {}
            });
        }
    }
};

module.exports = serviceAuth;
