const express = require("express");
const { randomUUID } = require("crypto");

const app = express();
const PORT = 4000;

// Parse JSON bodies
app.use(express.json());

// In-memory "database"
const sessions = [];

/**
 * Helper to compute round stats from raw reaction times + window data
 * reactionTimes: array of numbers in ms (only successful shots or all attempts)
 * prematurePresses: number of impulsive shots before window
 * missedWindows: number of windows where user did nothing
 * totalWindows: total windows presented in the round
 */
function computeRoundStats({
  reactionTimes,
  prematurePresses,
  missedWindows,
  totalWindows,
  score,
  difficultyLevel,
  roundNumber,
}) {
  let avgReactionTime = null;
  let minReactionTime = null;
  let maxReactionTime = null;

  if (Array.isArray(reactionTimes) && reactionTimes.length > 0) {
    const sum = reactionTimes.reduce((acc, t) => acc + t, 0);
    avgReactionTime = sum / reactionTimes.length;
    minReactionTime = Math.min(...reactionTimes);
    maxReactionTime = Math.max(...reactionTimes);
  }

  const impulseCount = prematurePresses || 0;
  const missingWindows = missedWindows || 0;
  const total = totalWindows || 0;

  // Window accuracy = “good windows” / total windows
  // good windows = total - impulses - misses (you can tweak this definition later)
  let windowAccuracy = null;
  if (total > 0) {
    const goodWindows = total - impulseCount - missingWindows;
    windowAccuracy = Math.max(0, goodWindows) / total;
  }

  return {
    roundNumber,
    reactionTime: {
      average: avgReactionTime, // ms
      min: minReactionTime,     // ms
      max: maxReactionTime,     // ms
      samples: reactionTimes || [],
    },
    impulses: {
      count: impulseCount,
      missingWindows,
    },
    windowAccuracy, // 0–1
    score,
    difficultyLevel,
  };
}

/**
 * POST /api/round
 * Called at the END of each round.
 *
 * Request body example:
 * {
 *   "sessionId": "existing-session-id-or-null",
 *   "roundNumber": 1,
 *   "reactionTimes": [320, 280, 410],
 *   "prematurePresses": 5,
 *   "missedWindows": 2,
 *   "totalWindows": 15,
 *   "score": 1200,
 *   "difficultyLevel": 3
 * }
 *
 * Response:
 * {
 *   "sessionId": "...",
 *   "round": { ...computedStats },
 *   "sessionSummary": { ... }
 * }
 */
app.post("/api/round", (req, res) => {
  const {
    sessionId,
    roundNumber,
    reactionTimes,
    prematurePresses,
    missedWindows,
    totalWindows,
    score,
    difficultyLevel,
  } = req.body || {};

  // Basic validation (very light to start)
  if (typeof roundNumber !== "number") {
    return res.status(400).json({ error: "roundNumber is required and must be a number." });
  }

  // Find or create session
  let session = null;

  if (sessionId) {
    session = sessions.find((s) => s.id === sessionId);
  }

  if (!session) {
    session = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      rounds: [],
    };
    sessions.push(session);
  }

  // Compute stats for this round
  const roundStats = computeRoundStats({
    reactionTimes,
    prematurePresses,
    missedWindows,
    totalWindows,
    score,
    difficultyLevel,
    roundNumber,
  });

  session.rounds.push(roundStats);

  // Build a simple session summary (for charts & history)
  const allRounds = session.rounds;
  const totalScore = allRounds.reduce((acc, r) => acc + (r.score || 0), 0);
  const avgDifficulty =
    allRounds.length === 0
      ? null
      : allRounds.reduce((acc, r) => acc + (r.difficultyLevel || 0), 0) / allRounds.length;

  const summary = {
    sessionId: session.id,
    createdAt: session.createdAt,
    totalRounds: allRounds.length,
    totalScore,
    avgDifficulty,
  };

  return res.json({
    sessionId: session.id,
    round: roundStats,
    sessionSummary: summary,
  });
});

/**
 * GET /api/sessions
 * Quickly inspect all stored sessions (for debugging / dev).
 */
app.get("/api/sessions", (req, res) => {
  res.json(sessions);
});

/**
 * GET /api/sessions/:id
 * Get a single session with all rounds.
 */
app.get("/api/sessions/:id", (req, res) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json(session);
});

app.listen(PORT, () => {
  console.log(`Space Invaders Trainer backend running on http://localhost:${PORT}`);
});
