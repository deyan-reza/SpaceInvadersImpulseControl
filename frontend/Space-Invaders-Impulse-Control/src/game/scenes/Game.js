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
    }

    create(calibration) {
        console.log("Game scene CREATE() fired.");
        console.log("Received calibration:", calibration);

        this.windowDuration = calibration?.windowSize || 400;
        this.enemySpeedFactor = calibration?.enemySpeed || 1;
        this.penaltyDuration = calibration?.penaltyTime || 500;

        // background
        this.add.image(512, 384, 'background');

        // init keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // player
        this.player = this.physics.add.sprite(512, 550, 'player');
        this.player.setCollideWorldBounds(true);

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
        this.enemyMoveInterval = 1000;
        this.lastEnemyMove = 0;

        this.cleanStreak = 0;
        // Player lives
        this.lives = 3;

        // Show lives on screen
        this.livesText = this.add.text(20, 20, 'Lives: 3', {
            fontFamily: 'Courier',
            fontSize: '28px',
            color: '#ffffff'
});


        // timing window system
        this.windowOpen = false;
        this.startWindowLoop();

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

    // Display "Game Over"
    this.add.text(512, 350, 'GAME OVER', {
        fontFamily: 'Courier',
        fontSize: '70px',
        color: '#ff0000'
    }).setOrigin(0.5);

    // Optionally restart
    this.time.delayedCall(3000, () => {
        this.scene.start('Calibration'); // or StartScreen
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
    this.livesText.setText('Lives: ' + this.lives);

    // Flash red
    const redFlash = this.add.rectangle(512, 384, 1024, 768, 0xff0000, 0.2);
    this.time.delayedCall(150, () => redFlash.destroy());

    // Check for death
    if (this.lives <= 0) {
        this.gameOver();
    } else {
        this.applyPenalty();
    }
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

        this.flash = this.add.rectangle(512, 50, 800, 20, 0x00ff00);
        this.flash.alpha = 0.6;

        this.time.delayedCall(this.windowDuration, () => {
            this.windowOpen = false;
            this.flash.destroy();
        });
    }

    update() {

        if (!this.player) return;    // <- prevents movement when player is removed


        // ========= PLAYER LOCKED DURING PENALTY ==========
        if (this.playerLocked) return;


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
                    // TODO: this.gameOver();
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
                this.cleanStreak++;
                this.checkStreakReward();
                this.shootBullet();
            }

            // IMPULSIVE SHOT (shot outside window)
            else {
                console.log("IMPULSIVE / TOO EARLY");
                this.cleanStreak = 0;
                this.applyPenalty();
            }
        }
    }



    shootBullet() {
        const bullet = this.physics.add.sprite(this.player.x, this.player.y - 20, 'laser');
        bullet.setVelocityY(-500);
        bullet.setScale(0.5);

        // bullet vs enemies collision
        this.physics.add.overlap(bullet, this.enemies, (bullet, enemy) => {
            this.handleEnemyHit(bullet, enemy);
        });
    }


    applyPenalty() {
    if (!this.player) return;

    this.playerLocked = true;
    this.player.setVelocityX(0);

    this.time.delayedCall(this.penaltyDuration || 500, () => {
        if (this.player) {
            this.playerLocked = false;
        }
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
        const rows = 3;
        const cols = 8;
        const startX = 150;
        const startY = 100;
        const spacingX = 80;
        const spacingY = 60;

        const colors = ['red', 'yellow', 'green']; // one color per row

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let enemy = this.enemies.create(
                    startX + col * spacingX,
                    startY + row * spacingY,
                    colors[row]
                );
                enemy.setScale(0.6);
                enemy.setOrigin(0.5);
                enemy.alive = true;
            }
        }

        // enemy movement direction
        this.enemyDirection = 1;
    }

    handleEnemyHit(bullet, enemy) {
        bullet.destroy();

        if (!enemy.alive) return;

        enemy.alive = false;
        enemy.disableBody(true, true);

        // TODO: Add reward or adaptive difficulty here
        console.log("Enemy destroyed!");

        // optional: check if all enemies are dead
        if (this.enemies.countActive() === 0) {
            console.log("Wave cleared!");
            // you can create a new wave here
        }
    }


}
