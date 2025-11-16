console.log("BACKEND RUNNING:", __filename);
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./lib/db.js");

const authRoutes = require("./routes/auth.route.js");
const gameRoutes = require("./routes/game.route.js")

dotenv.config();
connectDB();

const app = express();
app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/game", gameRoutes)

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
