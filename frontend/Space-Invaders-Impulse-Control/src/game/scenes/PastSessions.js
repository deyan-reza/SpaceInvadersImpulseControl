import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class PastSessions extends Phaser.Scene {
    constructor() {
        super('PastSessions');
    }

    async create() {
        // Title
        this.add.text(512, 50, "Past Sessions", {
            fontFamily: "Courier",
            fontSize: "44px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // Return button (TOP-RIGHT)
        const backBtn = this.add.text(950, 40, "Main Menu", {
            fontFamily: "Courier",
            fontSize: "28px",
            color: "#00aaff",
            backgroundColor: "#00000088",
            padding: { x: 10, y: 6 }
        })
            .setOrigin(1, 0.5)
            .setInteractive({ useHandCursor: true });

        backBtn.on("pointerdown", () => {
            EventBus.emit("go-home");
            this.scene.start("Start");
        });

        const userId = localStorage.getItem("userId");

        if (!userId) {
            this.add.text(512, 200, "You must log in to view past sessions.", {
                fontFamily: "Courier",
                fontSize: "26px",
                color: "#ff5555",
                align: "center"
            }).setOrigin(0.5);
            return;
        }

        // Fetch history
        let result;
        try {
            const res = await fetch(`http://localhost:8000/game/history/${userId}`);
            result = await res.json();
        } catch {
            this.add.text(512, 200, "Error loading history.", {
                fontFamily: "Courier",
                fontSize: "26px",
                color: "#ff5555"
            }).setOrigin(0.5);
            return;
        }

        const history = result.history || [];

        // BEST STATS (smaller + aligned)
        this.add.text(60, 120,
            `Personal Best Score: ${result.highestScore ?? "N/A"}`,
            { fontFamily: "Courier", fontSize: "22px", color: "#00ff00" }
        );

        this.add.text(60, 150,
            `Best Avg Reaction Time: ${
                result.bestAverageReactionTime !== Infinity
                    ? Math.round(result.bestAverageReactionTime) + "ms"
                    : "N/A"
            }`,
            { fontFamily: "Courier", fontSize: "22px", color: "#00ff00" }
        );

        this.add.text(60, 190, "Recent Sessions:", {
            fontFamily: "Courier",
            fontSize: "26px",
            color: "#ffffff"
        });

        // LIST (smaller font, 20px line height)
        const startY = 230;
        const lineHeight = 22;

        if (history.length === 0) {
            this.add.text(60, startY, "No games played yet.", {
                fontFamily: "Courier",
                fontSize: "20px",
                color: "#aaaaaa"
            });
        } else {
            history.slice().reverse().slice(0, 25).forEach((game, i) => {
                const date = new Date(game.timestamp);
                const entry = `#${i + 1} | Score: ${game.finalScore} | K: ${game.killCount} | M: ${game.misfires} | RT: ${
                    game.averageReactionTime ? Math.round(game.averageReactionTime) + "ms" : "N/A"
                } | ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

                this.add.text(30, startY + i * lineHeight, entry, {
                    fontFamily: "Courier",
                    fontSize: "18px",
                    color: "#ffffff"
                });
            });
        }

        //----------------------------------------------------
        // PREPARE ORDERED LAST-20 SESSIONS
        //----------------------------------------------------
        const ordered = history
            .slice(-20) // last 20
            .sort((a, b) => a.timestamp - b.timestamp); // oldest → newest

        //----------------------------------------------------
        // CHART 1: FINAL SCORE TREND (LINE CHART)
        //----------------------------------------------------
        if (ordered.length > 1) {
            const g = this.add.graphics();
            g.lineStyle(3, 0x00ff00, 1);

            const chartX = 750;
            const chartY = 200;
            const chartWidth = 250;
            const chartHeight = 120;

            // Draw bounding box
            g.strokeRect(chartX, chartY, chartWidth, chartHeight);

            const scores = ordered.map(g => g.finalScore ?? 0);
            const maxScore = Math.max(...scores);
            const minScore = Math.min(...scores);

            const normalize = (v) =>
                chartY + chartHeight - ((v - minScore) / (maxScore - minScore || 1)) * chartHeight;

            const step = chartWidth / (scores.length - 1);

            for (let i = 0; i < scores.length - 1; i++) {
                const x1 = chartX + i * step;
                const y1 = normalize(scores[i]);
                const x2 = chartX + (i + 1) * step;
                const y2 = normalize(scores[i + 1]);

                g.lineBetween(x1, y1, x2, y2);
            }

            this.add.text(chartX, chartY - 25, "Final Score Trend", {
                fontFamily: "Courier",
                fontSize: "18px",
                color: "#00ff00"
            });
        }

        //----------------------------------------------------
        // CHART 2: REACTION TIME TREND (BAR CHART)
        //----------------------------------------------------
        if (ordered.length > 0) {
            const g2 = this.add.graphics();
            const barX = 750;
            const barY = 380;
            const barWidth = 250;
            const barHeight = 120;

            // border
            g2.lineStyle(3, 0x00aaff);
            g2.strokeRect(barX, barY, barWidth, barHeight);

            const rts = ordered.map(g => g.averageReactionTime || 0);
            const maxRT = Math.max(...rts, 100);

            const barSpacing = barWidth / rts.length - 4;
            let bx = barX + 2;

            rts.forEach(rt => {
                const h = (rt / maxRT) * barHeight;
                g2.fillStyle(0x00aaff, 0.8);
                g2.fillRect(bx, barY + barHeight - h, barSpacing, h);
                bx += barSpacing + 4;
            });

            this.add.text(barX, barY - 25, "Average Reaction Time (ms)", {
                fontFamily: "Courier",
                fontSize: "18px",
                color: "#00aaff"
            });
        }
    }
}
