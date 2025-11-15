import Phaser from 'phaser';
import { EventBus } from '../EventBus';
console.log("Game.js LOADED.");

export class Game extends Phaser.Scene
{
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
        this.enemies = this.physics.add.group({
        collideWorldBounds: false
        });

        this.createEnemyGrid();



        // window system
        this.windowOpen = false;
        this.startWindowLoop();

        EventBus.emit('current-scene-ready', this);
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
        if (this.playerLocked) return;

        // enemy movement
if (this.enemies && this.enemies.getChildren) {
    const enemies = this.enemies.getChildren();

    let moveDown = false;

    for (let enemy of enemies) {
        enemy.x += this.enemyDirection * 1.0; // horizontal movement speed

        // hit screen edge? reverse direction
        if (enemy.x > 950 || enemy.x < 50) {
            moveDown = true;
        }
    }

    // move entire grid down if needed
    if (moveDown) {
        this.enemyDirection *= -1;
        for (let enemy of enemies) {
            enemy.y += 20;
        }
    }
}


        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(300);
        } else {
            this.player.body.setVelocityX(0);
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            if (this.windowOpen) {
                console.log('GOOD SHOT');
                this.shootBullet();
            } else {
                console.log('IMPULSIVE / TOO EARLY');
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
        this.playerLocked = true;
        this.player.body.setVelocityX(0);

        this.time.delayedCall(500, () => {
            this.playerLocked = false;
        });
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
