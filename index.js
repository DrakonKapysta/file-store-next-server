require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const authRouter = require("./router/index");
const fileRouter = require("./router/fileRouter");
const errorMiddleware = require("./middlewares/error-middleware");
const fileUpload = require("express-fileupload");

const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DB_URL;

app.use(fileUpload({ defCharset: "utf8", defParamCharset: "utf8" }));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.static("static"));
app.use("/api", authRouter);
app.use("/api/files", fileRouter);
app.use(errorMiddleware);

const startServer = async () => {
  try {
    await mongoose.connect(DB_URL);
    console.log("Database connected");
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
