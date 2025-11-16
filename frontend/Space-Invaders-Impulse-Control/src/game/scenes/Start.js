import Phaser from 'phaser';

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        this.load.setPath('assets');

        this.load.image('background', 'bg.jpg');
        this.load.audio('bgMusic', 'bg.mp3');

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

        this.bgMusic = this.sound.add('bgMusic', {
            loop: true,
            volume: 0.4  // adjust volume here
        });

        this.bgMusic.play();
        
        // --- BUTTONS ---
        this.makeButton(512, 350, 'START GAME', () => {
            this.bgMusic.stop();
            this.scene.start('Calibration');
        });

        this.makeButton(512, 430, 'HOW TO PLAY', () => {
            this.showHowToPlay();
        });

        this.makeButton(512, 510, 'PAST SESSIONS', () => {
            console.log('Will load past sessions screen');
        });
    }

    makeButton(x, y, label, callback) {
        const btn = this.add.text(x, y, label, {
            fontFamily: 'Courier',
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
    this.bgMusic.stop();
    this.scene.start("HowToPlay")

}
}