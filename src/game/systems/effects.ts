export const createPulse = (
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    color: number,
    alpha: number
) => {
    const pulse = scene.add.circle(x, y, radius, color, alpha).setDepth(12);

    scene.tweens.add({
        targets: pulse,
        alpha: 0,
        scale: 1.7,
        duration: 160,
        onComplete: () => {
            pulse.destroy();
        }
    });
};
