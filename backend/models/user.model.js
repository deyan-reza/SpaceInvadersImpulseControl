// models/user.model.js
const mongoose = require("mongoose");

const GameEntrySchema = new mongoose.Schema({
  killCount: { type: Number, required: true },
  misfires: { type: Number, required: true },
  finalScore: { type: Number, required: true },
  averageReactionTime: { type: Number, default: null },
  timestamp: { type: Date, default: Date.now }
});

const PersonalBestSchema = new mongoose.Schema({
  highestScore: { type: Number, default: 0 },
  mostKills: { type: Number, default: 0 },
  fewestMisfires: { type: Number, default: Infinity },
  bestAverageReactionTime: { type: Number, default: Infinity }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  gameHistory: {
    type: [GameEntrySchema],
    default: []
  },
  personalBests: {
    type: PersonalBestSchema,
    default: () => ({})
  }
});

module.exports = mongoose.model("User", userSchema);
