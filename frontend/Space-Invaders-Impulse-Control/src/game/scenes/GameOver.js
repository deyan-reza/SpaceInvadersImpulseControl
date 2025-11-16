import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    preload() {
        this.load.setPath('assets');
        this.load.audio('gameOverSFX', 'GO.mp3');
    }

    init(data) {
        this.finalScore = data.finalScore || 0;
        this.averageReactionTime = data.averageReactionTime || 0;
    }
    

    create() {
        this.add.text(512, 250, "GAME OVER", {
            fontFamily: 'Retro',
            fontSize: '70px',
            color: '#ff0000'
        }).setOrigin(0.5);

        this.add.text(512, 330,
            `Final Score: ${this.finalScore}\nAvg RT: ${Math.round(this.averageReactionTime)}ms`,
            {
                fontFamily: 'Retro',
                fontSize: '28px',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);

        // PLAY AGAIN button
        const playAgainBtn = this.add.text(512, 420, "Play Again", {
            fontFamily: 'Retro',
            fontSize: '36px',
            color: '#00ff00'
        }).setOrigin(0.5).setInteractive();

        playAgainBtn.on('pointerdown', () => {
            this.scene.start('Game');
        });

        // MAIN MENU button
        const menuBtn = this.add.text(512, 500, "Return to Main Menu", {
            fontFamily: 'Retro',
            fontSize: '30px',
            color: '#00aaff'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerdown', () => {
            EventBus.emit("go-home");
            this.scene.start('Start');
        });
    
        this.gameOverSFX.play();

    }
}
