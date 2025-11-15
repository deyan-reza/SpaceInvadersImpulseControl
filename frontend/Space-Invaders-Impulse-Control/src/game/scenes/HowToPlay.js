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
        // Background image
        this.add.image(512, 384, 'background');

        const instructions = [
            'HOW TO PLAY',
            '',
            '• Shoot ONLY during the green window flashes.',
            '• Good timing = score & rewards.',
            '• Shooting too early or outside the window = penalty.',
            '• Goal: control your impulses, not spam the key.',
        ].join('\n');

        // --- Main instructions text ---
        const instructionsText = this.add.text(512, 260, instructions, {
            fontFamily: 'Arial',
            fontSize: '26px',
            color: '#00ff00',
            align: 'center',
            wordWrap: { width: 700 }
        }).setOrigin(0.5);

        // Black box behind main instructions
        const instrPadding = 20;
        const instrBounds = instructionsText.getBounds();

        const instructionsBg = this.add.rectangle(
            instrBounds.centerX,
            instrBounds.centerY,
            instrBounds.width + instrPadding * 2,
            instrBounds.height + instrPadding * 2,
            0x000000,
            0.7 // alpha for transparency
        );
        instructionsBg.setOrigin(0.5);

        // Make sure background is behind text
        instructionsBg.setDepth(0);
        instructionsText.setDepth(1);

        // --- Hint text at bottom ---
        const hintText = this.add.text(512, 560, 'Press SPACE or click to go back', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#00ff00'
        }).setOrigin(0.5);

        const hintPadding = 10;
        const hintBounds = hintText.getBounds();

        const hintBg = this.add.rectangle(
            hintBounds.centerX,
            hintBounds.centerY,
            hintBounds.width + hintPadding * 2,
            hintBounds.height + hintPadding * 2,
            0x000000,
            0.7
        );
        hintBg.setOrigin(0.5);

        hintBg.setDepth(0);
        hintText.setDepth(1);

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
