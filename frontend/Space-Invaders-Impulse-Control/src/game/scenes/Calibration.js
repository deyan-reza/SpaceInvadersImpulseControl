import Phaser from 'phaser';

export class Calibration extends Phaser.Scene {
    constructor() {
        super('Calibration');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('background', 'bg.jpg');
    }

    create() {
    this.add.image(512, 384, 'background');

    this.add.text(512, 150, 'Calibration Test', {
        fontFamily: 'Courier',
        fontSize: '40px',
        color: '#ffffff',
        align: 'center'
    }).setOrigin(0.5);

    this.add.text(512, 240, 'Press SPACE ONLY when the screen flashes.', {
        fontFamily: 'Courier',
        fontSize: '24px',
        color: '#ffff00',
        align: 'center'
    }).setOrigin(0.5);

    // UI text that will show each reaction time
this.reactionText = this.add.text(512, 500, '', {
    fontFamily: 'Courier',
    fontSize: '32px',
    color: '#00ff00',
    align: 'center'
}).setOrigin(0.5);


    // tracking values
    this.attempts = 0;
    this.reactionTimes = [];
    this.earlyPresses = 0;
    this.flashes = 0;

    this.spaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.spaceKey.on('down', () => this.handleSpacePress());

    // start time
    this.startTime = this.time.now;

    // total minimum duration = 7 seconds
    this.minCalibrationDuration = 7500;

    // start flashing
    this.startNextFlash();

    // check end condition every 200ms
    this.endCheck = this.time.addEvent({
        delay: 200,
        loop: true,
        callback: () => this.checkIfCalibrationCanEnd()
    });
}


    startNextFlash() {
    // stop scheduling flashes if calibration is complete
    if (this.calibrationDone) return;

    // spacing between flashes: 1.3 to 1.8 seconds
    const delay = Phaser.Math.Between(1300, 1800);

    this.time.delayedCall(delay, () => {

        // stop if finished
        if (this.calibrationDone) return;

        // --- FLASH START ---
        this.flashTime = this.time.now;
        this.flash = this.add.rectangle(512, 384, 1024, 768, 0x00ff00, 0.25);

        this.attempts++;
        this.flashes++;

        // flash lasts 300 ms
        this.time.delayedCall(300, () => {
            if (this.flash) this.flash.destroy();
            this.flash = null;
        });

        // schedule next flash
        this.startNextFlash();
    });
}
checkIfCalibrationCanEnd() {
    const elapsed = this.time.now - this.startTime;

    if (this.flash) return;

    // We need:
    // 1. At least 3 flashes
    // 2. At least minimum total time elapsed
    if (this.flashes >= 3 && elapsed >= this.minCalibrationDuration) {
        this.calibrationDone = true;
        this.endCheck.remove(false);
        this.finishCalibration();
    }
}



    handleSpacePress() {
    const now = this.time.now;

    if (this.flash && this.flashTime) {
        const rt = now - this.flashTime;
        this.reactionTimes.push(rt);
        this.displayReaction(rt);
        return;
    }

    // EARLY PRESS (impulse)
    this.earlyPresses++;
    this.displayReaction("Too early!");
}

displayReaction(value) {
    // If a number was passed, format it
    let text = typeof value === "number"
        ? `Reaction: ${value.toFixed(2)} ms`
        : value;

    this.reactionText.setText(text);
    this.reactionText.alpha = 1;

    // Fade out after 700 ms
    this.tweens.add({
        targets: this.reactionText,
        alpha: 0,
        duration: 1500,
        ease: 'Power2'
    });
}



    finishCalibration() {
        // avoid division by zero
        const avgRT = this.reactionTimes.length > 0
            ? this.reactionTimes.reduce((a, b) => a + b) / this.reactionTimes.length
            : 300; // default quick reaction

        // early press ratio
        const impulseRatio = this.earlyPresses / Math.max(1, this.attempts);

        // === TRANSLATE TO DIFFICULTY ===

        // Shooting window size (ms)
        // higher impulsiveness => bigger window
        const baseWindowSize = Phaser.Math.Clamp(
            400 + impulseRatio * 300 - avgRT * 0.2,
            200,
            800
        );

        // Enemy speed
        const enemySpeed = Phaser.Math.Clamp(
            1 + impulseRatio * 1.2,
            0.8,
            2.5
        );

        // Penalty duration
        const penalty = Phaser.Math.Clamp(
            300 + impulseRatio * 400,
            300,
            1000
        );

        const calibrationData = {
            avgReactionTime: avgRT,
            impulseRatio,
            windowSize: baseWindowSize,
            enemySpeed,
            penaltyTime: penalty
        };

        console.log("Calibration Result:", calibrationData);

        // Send into Game scene
        this.scene.start('Game', calibrationData);
    }
}
