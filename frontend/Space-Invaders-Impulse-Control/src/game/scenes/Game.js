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
        this.load.image('star', 'star.png');
        this.load.image('background', 'bg.png');
        this.load.image('logo', 'logo.png');
    }

    create() {
        console.log("Game scene CREATE() fired.");

        // background
        this.add.image(512, 384, 'background');

        // init keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // player
        this.player = this.add.rectangle(512, 550, 40, 20, 0xffffff);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

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

        this.time.delayedCall(500, () => {
            this.windowOpen = false;
            this.flash.destroy();
        });
    }

    update() {
        if (this.playerLocked) return;

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
        const bullet = this.add.rectangle(this.player.x, this.player.y - 20, 5, 10, 0xffffff);
        this.physics.add.existing(bullet);
        bullet.body.setVelocityY(-400);
    }

    applyPenalty() {
        this.playerLocked = true;
        this.player.body.setVelocityX(0);

        this.time.delayedCall(500, () => {
            this.playerLocked = false;
        });
    }
}
