import Phaser from 'phaser';

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('background', 'bg.jpg');
    }

    create() {
        // background
        this.add.image(512, 384, 'background');

        // title
        this.add.text(512, 150, 'BRAIN INVADERS', {
            fontFamily: 'Courier',
            fontSize: '48px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // --- BUTTONS ---
        this.makeButton(512, 350, 'START GAME', () => {
            const isCalibrated = localStorage.getItem("isCalibrated");

            if (!isCalibrated) {
                this.scene.start("Calibration");
            } else {
                const savedCalibration = JSON.parse(localStorage.getItem("calibrationData"));
                this.scene.start("Game", savedCalibration);
            }
        });

        this.makeButton(512, 430, 'HOW TO PLAY', () => {
            this.showHowToPlay();
        });

        this.makeButton(512, 510, 'PAST SESSIONS', () => {
            this.showPastSessions();
        });
    }

    makeButton(x, y, label, callback) {
        const btn = this.add.text(x, y, label, {
            fontFamily: 'Retro',
            fontSize: '32px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 12, y: 8 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', callback)
        .on('pointerover', () => btn.setStyle({ color: '#ffff00' }))
        .on('pointerout', () => btn.setStyle({ color: '#00ff00' }));

        return btn;
    }

showHowToPlay() {
    this.scene.start("HowToPlay")
}

showPastSessions() {
    this.scene.start("PastSessions")
}
}
