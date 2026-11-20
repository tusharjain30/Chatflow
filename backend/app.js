require("dotenv").config({ quiet: true });

const http = require("http");
const express = require("express");
const path = require("path");
const cors = require("cors");

const logger = require("./utils/logger");
const requestLogger = require("./middleware/requestLogger");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/errorHandler");
const { initSocket } = require("./socket");
const { startWorkers } = require("./queue");

const adminRouter = require("./routes/super-admin");
const userRouter = require("./routes/customer-owner");
const resellerRouter = require("./routes/reseller");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  ...new Set(
    [
      process.env.FRONTEND_URL,
      process.env.CUSTOMER_OWNER_URL,
      process.env.RESELLER_FRONTEND_URL,
      process.env.ADMIN_FRONTEND_URL,
      // Local Vite apps (owner may run on 5173 or 8080)
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:8081",
      "http://localhost:8082",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:8080",
      "http://127.0.0.1:8081",
      "http://127.0.0.1:8082",
    ].filter(Boolean),
  ),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, origin || true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/super-admin", adminRouter);
app.use("/user", userRouter);
app.use("/reseller", resellerRouter);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Server Running</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #0f172a, #1e293b);
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
            }
            .container {
                text-align: center;
            }
            h1 {
                font-size: 3rem;
                margin-bottom: 10px;
                color: #38bdf8;
            }
            p {
                font-size: 1.2rem;
                color: #cbd5f5;
            }
            .status {
                margin-top: 20px;
                padding: 10px 20px;
                background: #22c55e;
                color: #000;
                border-radius: 8px;
                display: inline-block;
                font-weight: bold;
            }
            .footer {
                margin-top: 30px;
                font-size: 0.9rem;
                color: #94a3b8;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Chatflow Server is Running</h1>
            <p>Your backend is live and ready to handle requests.</p>
            <div class="status">STATUS: ACTIVE</div>
            <div class="footer">
                Powered by Node.js & Express
            </div>
        </div>
    </body>
    </html>
  `);
});

app.use(notFoundHandler);
app.use(errorHandler);

initSocket(server);

server.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info("Routes: /super-admin, /user, /reseller");
  logger.info("Realtime: Socket.IO on /socket.io");

  startWorkers().catch((err) => {
    logger.error("[queue] failed to start workers (is Redis running?):", err.message);
  });
});
