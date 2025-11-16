const express = require("express");
const auth = require("../middleware/auth.middleware.js");
const User = require("../models/user.model.js");

const router = express.Router();

router.post("/save", async (req, res) => {
  try {
    
    const { userId, killCount, misfires, finalScore, averageReactionTime } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const newEntry = {
      killCount,
      misfires,
      finalScore,
      averageReactionTime,
      timestamp: new Date()
    };

    // add newest at top
    user.gameHistory.unshift(newEntry);

    // keep last 20
    if (user.gameHistory.length > 20) {
      user.gameHistory = user.gameHistory.slice(0, 20);
    }

    // update personal bests
    user.personalBests.highestScore = Math.max(
      user.personalBests.highestScore,
      finalScore
    );

    user.personalBests.mostKills = Math.max(
      user.personalBests.mostKills,
      killCount
    );

    user.personalBests.fewestMisfires = Math.min(
      user.personalBests.fewestMisfires,
      misfires
    );

    user.personalBests.bestAverageReactionTime = Math.min(
      user.personalBests.bestAverageReactionTime,
      averageReactionTime
    );

    await user.save();

    res.json({
      message: "Game results saved!",
      gameHistory: user.gameHistory,
      personalBests: user.personalBests
    });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
