// Web Audio API Sound Synthesizer for high-fidelity ambient UI notifications

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a warm, sweet double-chime for incoming messages.
 */
export function playMessagePing() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second note, slightly delayed
    const delay = 0.08;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + delay); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + delay + 0.15); // D6

    gain2.gain.setValueAtTime(0.12, now + delay);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.3);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + delay);
    osc2.stop(now + delay + 0.3);
  } catch (err) {
    console.warn("Audio Synthesis skipped due to context blocker:", err);
  }
}

/**
 * Plays a light ascending sound for feedback or logins.
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.05);
      
      gain.gain.setValueAtTime(0.08, now + index * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.005, now + index * 0.05 + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + index * 0.05);
      osc.stop(now + index * 0.05 + 0.2);
    });
  } catch (err) {
    console.warn("Audio Synthesis skipped:", err);
  }
}

/**
 * Plays a discrete slider toggle click.
 */
export function playToggleClick(on: boolean) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(on ? 600 : 350, now);
    osc.frequency.exponentialRampToValueAtTime(on ? 900 : 200, now + 0.05);
    
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
  } catch (err) {
    console.warn("Audio Synthesis skipped:", err);
  }
}
