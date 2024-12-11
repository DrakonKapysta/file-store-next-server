const mongoose = require("mongoose");

const DB_URL = process.env.DB_URL;
const connectDb = async () => {
  await mongoose.connect(DB_URL);
  console.log("Database connected from worker thread");
};

module.exports = connectDb;
