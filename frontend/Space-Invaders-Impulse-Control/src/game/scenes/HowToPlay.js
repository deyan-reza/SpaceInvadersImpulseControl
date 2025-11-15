// scenes/HowToPlay.js
import Phaser from 'phaser';

export class HowToPlay extends Phaser.Scene {
    constructor() {
        super('HowToPlay');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('background', 'bg.jpg');
    }

    create() {
        // Background
        this.add.image(512, 384, 'background');

        const instructions = [
            'HOW TO PLAY',
            '',
            '• Shoot ONLY during the green window flashes.',
            '• Good timing = score & rewards.',
            '• Shooting too early or outside the window = penalty.',
            '• Goal: control your impulses, not spam the key.',
        ].join('\n');

        // Centered text block
        this.add.text(512, 260, instructions, {
            fontFamily: 'Arial',
            fontSize: '26px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 700 }
        }).setOrigin(0.5);

        // Hint to go back
        this.add.text(512, 560, 'Press SPACE or click to go back', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Back to Start on SPACE
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('Start');
        });

        // Or click/tap
        this.input.once('pointerdown', () => {
            this.scene.start('Start');
        });
    }
}
