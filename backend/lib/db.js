const mongoose = require("mongoose");
require("dotenv").config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "space_game",
    });
    console.log("MongoDB Connected ✔");
  } catch (err) {
    console.error("MongoDB Error", err);
    process.exit(1);
  }
}

module.exports = { connectDB };
