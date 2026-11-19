const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({ path: path.join(__dirname, "atlas-credentials.env") });

// Import cấu hình DB & Middleware lỗi
const connectDB = require("./config/db");
const createSessionMiddleware = require("./config/session");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();
app.set("trust proxy", 1);

// Logger & static files
app.use(morgan("combined"));
app.use("/images", express.static(path.join(__dirname, "public/images")));

// CORS chấp nhận cookie credentials từ frontend (bao gồm cả link preview và production của Vercel)
app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "http://localhost:3000",
      /\.vercel\.app$/
    ],
    credentials: true,
  })
);

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Đảm bảo kết nối DB trước khi xử lý request trên Serverless
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use(createSessionMiddleware());

// Route kiểm tra Server
app.get("/", (req, res) => {
  res.send("Hello Restful API Bloom Spa");
});

// Register API routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/public", require("./routes/public.routes"));
app.use("/api/customer", require("./routes/customer.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn API [${req.method} ${req.url}] không tồn tại!`,
    data: null,
  });
});

// Central error handler
app.use(errorMiddleware);

// Xuất app cho Vercel Serverless
module.exports = app;

// Chỉ chạy app.listen khi chạy local
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3002;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Bloom Backend Server running on: http://localhost:${PORT}`);
    });
  });
}
