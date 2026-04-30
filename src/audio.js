const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

export const Audio = {
    playHit: () => {
        playTone(150, 'sawtooth', 0.1, 0.2);
        setTimeout(() => playTone(100, 'square', 0.1, 0.2), 50);
    },
    playDamage: () => {
        playTone(300, 'sawtooth', 0.3, 0.3);
        setTimeout(() => playTone(200, 'sawtooth', 0.3, 0.3), 100);
    },
    playLoot: () => {
        playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => playTone(800, 'sine', 0.2, 0.1), 100);
    },
    playStep: () => {
        playTone(100, 'triangle', 0.05, 0.05);
    },
    playJump: () => {
        playTone(400, 'square', 0.1, 0.08);
        setTimeout(() => playTone(700, 'square', 0.07, 0.06), 30);
    },
    playDash: () => {
        playTone(900, 'sawtooth', 0.06, 0.07);
        setTimeout(() => playTone(500, 'sawtooth', 0.06, 0.07), 30);
    },
    playPower: () => {
        playTone(220, 'square', 0.1, 0.12);
        setTimeout(() => playTone(330, 'square', 0.12, 0.12), 100);
        setTimeout(() => playTone(550, 'sine', 0.15, 0.12), 220);
    },
    playStairs: () => {
        playTone(500, 'triangle', 0.1, 0.08);
        setTimeout(() => playTone(700, 'triangle', 0.1, 0.08), 80);
        setTimeout(() => playTone(900, 'triangle', 0.15, 0.08), 160);
    }
};
