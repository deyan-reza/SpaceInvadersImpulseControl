import Phaser from 'phaser';
import { EventBus } from '../EventBus';
console.log("Game.js LOADED.");

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        console.log("Game scene CONSTRUCTED.");

    }

    preload() {
        this.load.setPath('assets');
        //this.load.image('star', 'star.png');
        this.load.image('background', 'bg.jpg');
        //this.load.image('logo', 'logo.png');
        this.load.image('laser', 'laser.png');
        this.load.image('player', 'player.png');
        this.load.image('red', 'red.png');
        this.load.image('yellow', 'yellow.png');
        this.load.image('green', 'green.png');
        this.load.image('heart', 'heart_png.png');
    }

    create(calibration) {
        console.log("Game scene CREATE() fired.");
        console.log("Received calibration:", calibration);

        this.windowDuration = calibration?.windowSize || 400;
        this.enemySpeedFactor = calibration?.enemySpeed || 5;
        this.penaltyDuration = calibration?.penaltyTime || 500;
        this.baseEnemyMoveInterval = 1000;
        this.enemyMoveInterval = this.baseEnemyMoveInterval;

  

        // background
        this.add.image(512, 384, 'background');

        // init keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // player
        this.player = this.physics.add.sprite(512, 550, 'player');
        this.player.setCollideWorldBounds(true);
        this.playerLocked = false;

        this.windowInactiveColor = 'red';
        this.windowActiveColor = 'green';

        this.enemyGridConfig = {
            rows: 3,
            cols: 8,
            startX: 150,
            startY: 100,
            spacingX: 80,
            spacingY: 60
        };

        // enemy grid
        this.enemies = this.physics.add.group({ collideWorldBounds: false });
        this.createEnemyGrid();

        // enemy bullets
        this.enemyBullets = this.physics.add.group({
            defaultKey: 'laser',
            maxSize: 20
        });

        // collision: enemy bullet → player
        this.physics.add.overlap(
            this.enemyBullets,
            this.player,
            (bullet, player) => this.handlePlayerHit(bullet, player)
        );

        // enemy shooting timer
        this.enemyShootTimer = this.time.addEvent({
            delay: Phaser.Math.Between(800, 1500),
            loop: true,
            callback: () => this.enemyShoot()
        });

        // retro movement system values
        this.enemyDirection = 1;
        this.enemyStepSize = 20;
        this.enemyDropSize = 25;
        this.lastEnemyMove = 0;

        this.cleanStreak = 0;
        // Player lives
        this.lives = 3;
        this.lifeIcons = [];
        this.updateLivesDisplay();

        // Score / reward system
        this.score = 0;
        this.scoreText = this.add.text(20, 90, 'Score: 0 - Neutral', {
            fontFamily: 'Courier',
            fontSize: '24px',
            color: '#ffffff'
        });
        this.scoreText.setScrollFactor(0);
        // Performance tracking
        this.reactionTimes = [];
        this.windowOpenedAt = null;
        this.killCount = 0;
        this.misfireCount = 0;
        this.finalScore = 0;
        this.killText = this.add.text(20, 130, 'Kills: 0', {
            fontFamily: 'Courier',
            fontSize: '20px',
            color: '#ffffff'
        });
        this.killText.setScrollFactor(0);
        this.misfireText = this.add.text(20, 160, 'Misfires: 0', {
            fontFamily: 'Courier',
            fontSize: '20px',
            color: '#ffffff'
        });
        this.misfireText.setScrollFactor(0);
        // this.finalScoreText = this.add.text(20, 190, 'Final Score: 0', {
        //     fontFamily: 'Courier',
        //     fontSize: '20px',
        //     color: '#ffffff'
        // });
        // this.finalScoreText.setScrollFactor(0);
        this.updatePerformanceStats();
        this.activeScoreState = null;
        this.doubleShotActive = false;
        this.extraRowEnemies = [];
        this.shield = null;
        this.shieldCollider = null;
        this.shieldHitsRemaining = 0;
        this.playerLockTimer = null;

        // timing window system
        this.windowOpen = false;
        this.startWindowLoop();

        this.modifyScore(0);

        EventBus.emit('current-scene-ready', this);
    }

    gameOver() {
        console.log("GAME OVER!");

        // Stop movement
        this.playerLocked = true;

        // Remove player sprite
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }

        // Stop all enemy bullets
        this.enemyBullets.clear(true, true);

        // Stop enemy movement & shooting
        this.enemyShootTimer.remove(false);


        if (this.reactionTimes && this.reactionTimes.length > 0) {
            this.averageReactionTime =
                this.reactionTimes.reduce((a, b) => a + b, 0) /
                this.reactionTimes.length;
        } else {
            this.averageReactionTime = null;
        }

        console.log("Average Reaction Time:", this.averageReactionTime);

        this.sendResultsToServer();

        // Display "Game Over"
        this.add.text(512, 350, 'GAME OVER', {
            fontFamily: 'Courier',
            fontSize: '70px',
            color: '#ff0000'
        }).setOrigin(0.5);

        // Optionally restart
        // this.time.delayedCall(3000, () => {
        //     this.scene.start('Calibration'); // or StartScreen
        // });
        this.scene.start('GameOver', {
            finalScore: this.finalScore,
            averageReactionTime: this.averageReactionTime
        });
    }


    enemyShoot() {
        const enemies = this.enemies.getChildren().filter(e => e.active);
        if (enemies.length === 0) return;

        const shooter = Phaser.Utils.Array.GetRandom(enemies);

        const bullet = this.enemyBullets.get(shooter.x, shooter.y + 10);
        if (!bullet) return;

        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setScale(0.5);
        bullet.body.enable = true;

        bullet.body.setVelocityY(250);
    }


    handlePlayerHit(bullet, player) {
        bullet.destroy();

        console.log("Player HIT!");

        this.lives--;
        this.updateLivesDisplay();

        // Flash red
        const redFlash = this.add.rectangle(512, 384, 1024, 768, 0xff0000, 0.2);
        this.time.delayedCall(150, () => redFlash.destroy());

        // Check for death
        if (this.lives == 0) {
            this.gameOver();
        } else {
            this.applyPenalty();
            this.respawnPlayer();
        }
    }


    respawnPlayer() {
        // If old sprite still exists, just reset it
        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            this.player.x = 512;
            this.player.y = 550;
        } else {
            // Re-create the player sprite if it was destroyed
            this.player = this.physics.add.sprite(512, 550, 'player');
            this.player.setCollideWorldBounds(true);

            // Reconnect collision with enemy bullets
            this.physics.add.overlap(
                this.enemyBullets,
                this.player,
                (bullet, player) => this.handlePlayerHit(bullet, player)
            );
        }

        // Unlock movement
        this.playerLocked = false;

        // Optional: brief invincibility / visual feedback
        this.player.setAlpha(0.4);
        this.time.delayedCall(1000, () => {
            if (this.player && this.player.body) {
                this.player.setAlpha(1);
            }
        });
    }


    startWindowLoop() {
        this.time.addEvent({
            delay: 2000,
            loop: true,
            callback: () => this.openWindow()
        });
    }

    openWindow() {
        
        this.windowOpen = true;
        this.windowOpenedAt = performance.now();

        this.updateEnemyColors(true);

        this.flash = this.add.rectangle(512, 50, 800, 20, 0x00ff00);
        this.flash.alpha = 0.6;

        this.time.delayedCall(this.windowDuration, () => {
            this.windowOpen = false;
            this.windowOpenedAt = null;
            this.updateEnemyColors(false);
            if (this.flash) {
                this.flash.destroy();
                this.flash = null;
            }
        });
    }
    
    handleWin() {
        // Pause all physics + timers
        this.physics.pause();

        // Create black box
        const box = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            400,        // width
            150,        // height
            0x000000,   // black
            0.8         // opacity
        );
        box.setOrigin(0.5);

        // Add win text
        const winText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "YOU WIN!",
            {
                fontFamily: "Arial",
                fontSize: "72px",
                color: "#00ff00",     // green
                fontStyle: "bold"
            }
        );
        winText.setOrigin(0.5);

        // Delay before returning to Start Screen
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Start');
        });

                // Or click/tap
        this.input.once('pointerdown', () => {
            this.scene.start('Start');
        });
    }
    
    update() {

        // If player sprite or its physics body is gone, skip everything
        if (!this.player || !this.player.body) {
            return;
        }

        // ========= PLAYER LOCKED DURING PENALTY ==========
        if (this.playerLocked) {
            // (optional but safe) keep player stopped while locked
            this.player.setVelocity(0, 0);
            return;
        }

        if (this.enemies.countActive(true) === 0 && !this.winTriggered) {
            this.winTriggered = true;
            this.handleWin();
        }
        
        // ========= RETRO ENEMY BLOCK MOVEMENT ==========
        // Move once every enemyMoveInterval ms (blocky / retro)
        if (this.time.now - this.lastEnemyMove >= this.enemyMoveInterval) {
            this.lastEnemyMove = this.time.now;

            const enemies = this.enemies.getChildren();

            if (enemies.length > 0) {

                // Check if next horizontal move hits boundary
                const hitEdge = enemies.some(e =>
                    e.active &&
                    (
                        (e.x + this.enemyStepSize * this.enemyDirection > 950) ||
                        (e.x + this.enemyStepSize * this.enemyDirection < 50)
                    )
                );

                if (hitEdge) {
                    // Drop the whole block downward
                    enemies.forEach(e => {
                        if (e.active) e.y += this.enemyDropSize;
                    });

                    // Reverse direction
                    this.enemyDirection *= -1;
                } else {
                    // Move block horizontally (classic style)
                    enemies.forEach(e => {
                        if (e.active) e.x += this.enemyStepSize * this.enemyDirection;
                    });
                }

                // LOSS CONDITION
                if (enemies.some(e => e.active && e.y > 520)) {
                    console.log("Enemy reached the player zone!");
                    this.gameOver();
                }
            }
        }


        // ========= PLAYER MOVEMENT ==========
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(300);
        } else {
            this.player.setVelocityX(0);
        }

        // Clean up enemy bullets that move off screen
        this.enemyBullets.getChildren().forEach(bullet => {
            if (bullet.active && bullet.y > this.scale.height) {
                bullet.destroy();
            }
        });



        // ========= SHOOT BUTTON (SPACE) ==========
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {

            // GOOD SHOT (within timing window)
            if (this.windowOpen) {
                console.log("GOOD SHOT");

                if (this.windowOpenedAt !== null) {
                    const rt = performance.now() - this.windowOpenedAt;
                    this.reactionTimes.push(rt);
                    console.log("Reaction Time:", rt);
                }
                this.cleanStreak++;
                this.checkStreakReward();
                this.shootBullet();
            }

            // IMPULSIVE SHOT (shot outside window)
            else {
                console.log("IMPULSIVE / TOO EARLY");
                this.cleanStreak = 0;
                this.modifyScore(-1);
                this.recordMisfire();
                this.applyPenalty();
            }
        }
    }



    shootBullet() {
        const offsets = this.doubleShotActive ? [-15, 15] : [0];
        offsets.forEach(offset => this.spawnPlayerBullet(offset));
    }

    spawnPlayerBullet(offsetX = 0) {
        const bullet = this.physics.add.sprite(this.player.x + offsetX, this.player.y - 20, 'laser');
        bullet.setVelocityY(-500);
        bullet.setScale(0.5);

        this.physics.add.overlap(bullet, this.enemies, (playerBullet, enemy) => {
            this.handleEnemyHit(playerBullet, enemy);
        });
    }


    applyPenalty(durationOverride) {
        // If the player sprite or its physics body is gone, do nothing
        if (!this.player || !this.player.body) {
            return;
        }

        this.playerLocked = true;

        // Stop the player completely during the penalty
        this.player.setVelocity(0,0);

        if (this.playerLockTimer) {
            this.playerLockTimer.remove(false);
            this.playerLockTimer = null;
        }

        const delay = durationOverride ?? (this.penaltyDuration || 500);

        this.playerLockTimer = this.time.delayedCall(delay, () => {
            // Only unlock if the player still exists
            if (this.player && this.player.body) {
                this.playerLocked = false;
                // Optional: make sure velocity is still zero
                this.player.setVelocity(0,0);
            }
            this.playerLockTimer = null;
        });
    }

    checkStreakReward() {
        if (this.cleanStreak === 5) {
            console.log("Reward: 5-shot streak!");
            // Example reward: slow enemies briefly
            this.enemySpeed *= 0.8;

            this.time.delayedCall(3000, () => {
                this.enemySpeed *= 1.25; // restore
            });
        }

        if (this.cleanStreak === 10) {
            console.log("BIG REWARD: 10-shot streak!");
            // Example: temporary power-shot
            this.powerShot = true;
            this.time.delayedCall(3000, () => {
                this.powerShot = false;
            });
        }
    }

    createEnemyGrid() {
        const { rows, cols, startX, startY, spacingX, spacingY } = this.enemyGridConfig;

        for (let row = 0; row < rows; row++) {
            this.spawnEnemyRow(startY + row * spacingY, cols, startX, spacingX);
        }

        // enemy movement direction
        this.enemyDirection = 1;
    }

    spawnEnemyRow(y, cols, startX, spacingX) {
        const created = [];
        const textureKey = this.windowOpen ? this.windowActiveColor : this.windowInactiveColor;
        for (let col = 0; col < cols; col++) {
            let enemy = this.enemies.create(
                startX + col * spacingX,
                y,
                textureKey
            );
            enemy.setScale(0.6);
            enemy.setOrigin(0.5);
            enemy.alive = true;
            created.push(enemy);
        }
        return created;
    }

    updateEnemyColors(isWindowOpen) {
        const textureKey = isWindowOpen ? this.windowActiveColor : this.windowInactiveColor;
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) {
                enemy.setTexture(textureKey);
            }
        });
    }

    updateLivesDisplay() {
        if (this.lifeIcons && this.lifeIcons.length) {
            this.lifeIcons.forEach(icon => icon.destroy());
        }
        this.lifeIcons = [];

        const startX = 20;
        const startY = 20;
        const spacing = 60;
        const scale = 0.12;

        for (let i = 0; i < this.lives; i++) {
            const heart = this.add.image(startX + i * spacing, startY, 'heart');
            heart.setScale(scale);
            heart.setOrigin(0, 0);
            heart.setScrollFactor(0);
            this.lifeIcons.push(heart);
        }
    }

    modifyScore(delta) {
        if (typeof this.score !== 'number') return;

        const newScore = Phaser.Math.Clamp(this.score + delta, -3, 3);
        this.score = newScore;

        if (this.scoreText) {
            this.scoreText.setText(`Score: ${this.score} - ${this.getScoreDescription(this.score)}`);
        }

        if (this.score !== this.activeScoreState) {
            this.clearScoreEffects();
            this.applyScoreEffect(this.score);
        }
    }

    clearScoreEffects() {
        this.enemyMoveInterval = this.baseEnemyMoveInterval;
        this.doubleShotActive = false;
        this.removeShield();
        this.removeExtraRow();
    }

    applyScoreEffect(score) {
        switch (score) {
            case -3:
                this.addExtraEnemyRow();
                break;
            case -2:
                this.applyPenalty(2000);
                break;
            case -1:
                this.enemyMoveInterval = Math.max(200, this.baseEnemyMoveInterval * 0.6);
                break;
            case 1:
                this.enemyMoveInterval = this.baseEnemyMoveInterval * 1.4;
                break;
            case 2:
                this.doubleShotActive = true;
                break;
            case 3:
                this.spawnShield();
                break;
            default:
                break;
        }

        this.activeScoreState = score;
    }

    getScoreDescription(score) {
        switch (score) {
            case -3:
                return 'Extra Enemy Row';
            case -2:
                return 'Frozen';
            case -1:
                return 'Enemies Faster';
            case 1:
                return 'Enemies Slower';
            case 2:
                return 'Double Shot';
            case 3:
                return 'Shield Active';
            default:
                return 'Neutral';
        }
    }

    addExtraEnemyRow() {
        const { cols, startX, spacingX, startY, spacingY, rows } = this.enemyGridConfig;
        const y = startY + rows * spacingY;
        this.extraRowEnemies = this.spawnEnemyRow(y, cols, startX, spacingX);
    }

    removeExtraRow() {
        if (!this.extraRowEnemies || this.extraRowEnemies.length === 0) {
            return;
        }

        this.extraRowEnemies.forEach(enemy => {
            if (enemy && enemy.active) {
                enemy.destroy();
            } else if (enemy && enemy.body) {
                enemy.destroy();
            }
        });

        this.extraRowEnemies = [];
    }

    spawnShield() {
        if (this.shield) {
            this.shieldHitsRemaining = 5;
            return;
        }

        const shieldWidth = 140;
        const shieldHeight = 30;
        this.shieldHitsRemaining = 5;
        this.shield = this.add.rectangle(512, 470, shieldWidth, shieldHeight, 0x00ffff, 1);
        this.shield.setDepth(1);
        this.physics.add.existing(this.shield, true);
        if (this.shield.body && this.shield.body.setSize) {
            this.shield.body.setSize(shieldWidth, shieldHeight);
        }
        this.shieldCollider = this.physics.add.overlap(
            this.enemyBullets,
            this.shield,
            (bullet) => this.handleShieldHit(bullet),
            null,
            this
        );
    }

    handleShieldHit(bullet) {
        if (bullet && bullet.active) {
            bullet.destroy();
        }

        if (!this.shield) return;

        this.shieldHitsRemaining -= 1;
        this.shield.fillAlpha = Phaser.Math.Clamp(0.3 + this.shieldHitsRemaining * 0.12, 0.3, 1);

        if (this.shieldHitsRemaining <= 0) {
            this.removeShield();
        }
    }

    removeShield() {
        if (this.shieldCollider) {
            this.shieldCollider.destroy();
            this.shieldCollider = null;
        }

        if (this.shield) {
            if (this.shield.body) {
                this.shield.body.enable = false;
            }
            this.shield.destroy();
            this.shield = null;
        }

        this.shieldHitsRemaining = 0;
    }

    handleEnemyHit(bullet, enemy) {
        bullet.destroy();

        if (!enemy.alive) return;

        enemy.alive = false;
        enemy.disableBody(true, true);

        // TODO: Add reward or adaptive difficulty here
        console.log("Enemy destroyed!");
        this.modifyScore(1);
        this.recordKill();

        // optional: check if all enemies are dead
        if (this.enemies.countActive() === 0) {
            console.log("All Invaders Cleared!");
            // you can create a new wave here
        }
    }
    recordKill() {
        this.killCount += 1;
        this.updatePerformanceStats();
    }

    recordMisfire() {
        this.misfireCount += 1;
        this.updatePerformanceStats();
    }

    updatePerformanceStats() {
        this.finalScore = this.killCount - this.misfireCount;

        if (this.killText) {
            this.killText.setText(`Kills: ${this.killCount}`);
        }

        if (this.misfireText) {
            this.misfireText.setText(`Misfires: ${this.misfireCount}`);
        }

    }
    sendResultsToServer() {
        const userId = localStorage.getItem("userId");

        if (!userId) {
            console.warn("No userId found — cannot save game");
            return;
        }

        fetch("http://localhost:8000/game/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: userId,
                killCount: this.killCount,
                misfires: this.misfireCount,
                finalScore: this.finalScore,
                averageReactionTime: this.averageReactionTime ?? 0
            })
        })
            .then(res => res.json())
            .then(data => console.log("Game results saved:", data))
            .catch(err => console.error("Save error:", err));
    }

}
