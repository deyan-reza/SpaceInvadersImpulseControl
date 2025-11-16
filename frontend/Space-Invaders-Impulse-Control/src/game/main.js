import { Game as MainGame } from './scenes/Game.js';
import { Start } from './scenes/Start.js';
import { Calibration } from './scenes/Calibration.js';
import { HowToPlay } from './scenes/HowToPlay.js';
import { AUTO, Game } from 'phaser';
import { GameOver } from './scenes/GameOver.js';

const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    // backgroundColor: '#028af8',

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },

    scene: [
        Start,
        HowToPlay,
        Calibration,
        MainGame,
        GameOver
    ]
};

const StartGame = (parent) => new Game({ ...config, parent });
export default StartGame;
