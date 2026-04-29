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
    }
};
