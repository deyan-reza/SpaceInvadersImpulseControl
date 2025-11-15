import { Game as MainGame } from './scenes/Game.js';
import { Start } from './scenes/Start.js';
import { Calibration } from './scenes/Calibration.js';
import { AUTO, Game } from 'phaser';

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
        Calibration,
        MainGame,
    ]
};

const StartGame = (parent) => new Game({ ...config, parent });
export default StartGame;
