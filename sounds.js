// ================================================================
//  sounds.js — ЗВУКОВЫЕ ЭФФЕКТЫ
// ================================================================

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('⚠️ AudioContext не поддерживается');
        }
    }
}

function playSound(type) {
    try {
        initAudio();
        if (!audioCtx) return;
        
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        
        gain.gain.value = 0.1;
        
        switch(type) {
            case 'swap':
                oscillator.frequency.value = 400;
                oscillator.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.08);
                break;
            case 'match':
                oscillator.frequency.value = 600;
                oscillator.type = 'square';
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
                break;
            case 'bonus':
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
                oscillator.start();
                setTimeout(() => {
                    const osc2 = audioCtx.createOscillator();
                    const gain2 = audioCtx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioCtx.destination);
                    gain2.gain.value = 0.08;
                    osc2.frequency.value = 1100;
                    osc2.type = 'sine';
                    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                    osc2.start();
                    osc2.stop(audioCtx.currentTime + 0.1);
                }, 100);
                oscillator.stop(audioCtx.currentTime + 0.15);
                break;
            case 'levelup':
                oscillator.frequency.value = 500;
                oscillator.type = 'sawtooth';
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                oscillator.start();
                setTimeout(() => {
                    const osc2 = audioCtx.createOscillator();
                    const gain2 = audioCtx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioCtx.destination);
                    gain2.gain.value = 0.08;
                    osc2.frequency.value = 700;
                    osc2.type = 'sawtooth';
                    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                    osc2.start();
                    osc2.stop(audioCtx.currentTime + 0.3);
                }, 150);
                setTimeout(() => {
                    const osc3 = audioCtx.createOscillator();
                    const gain3 = audioCtx.createGain();
                    osc3.connect(gain3);
                    gain3.connect(audioCtx.destination);
                    gain3.gain.value = 0.08;
                    osc3.frequency.value = 1000;
                    osc3.type = 'sawtooth';
                    gain3.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                    osc3.start();
                    osc3.stop(audioCtx.currentTime + 0.3);
                }, 300);
                oscillator.stop(audioCtx.currentTime + 0.5);
                break;
            case 'fail':
                oscillator.frequency.value = 300;
                oscillator.type = 'square';
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.2);
                break;
            default:
                oscillator.frequency.value = 500;
                oscillator.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.05);
        }
    } catch(e) {
        // Тишина, если звук не работает
    }
}

// ---- ЗВУК ДЛЯ АНИМАЦИЙ ----
function playSoundForAnimation(type) {
    // Сохраняем для использования в анимациях
    window._lastSound = type;
    playSound(type);
}

console.log('🔊 sounds.js загружен!');
