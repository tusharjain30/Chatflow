const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const indexRouter = require("./routes");
const adminRouter = require("./routes/super-admin");
const userRouter = require("./routes/customer-owner");

// Connect frontend
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.use("/", indexRouter);
app.use("/super-admin", adminRouter);
app.use("/user", userRouter);

app.use("/", (req, res) => {
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
            <h1>🚀 Server is Running</h1>
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
