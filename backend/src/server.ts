import express from "express";
import path from "path";
import cors from "cors";
import "dotenv/config";

const adminRouter = require("./routes/super-admin");
const userRouter = require("./routes/customer-owner");
const resellerRouter = require("./routes/reseller");

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : true,
        credentials: true,
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/super-admin", adminRouter);
app.use("/user", userRouter);
app.use("/reseller", resellerRouter);

app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        msg: "server is running healthy!",
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log("server is running on", PORT);
})

export default app;