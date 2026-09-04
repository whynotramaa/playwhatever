/**
 * Game noise, synthesized. A downloaded effect is another file to license,
 * host, and watch fail to load; an oscillator is a few lines and is always
 * there. Everything here is quiet on purpose and silent when the browser has
 * not handed out audio yet.
 */
let ctx: AudioContext | null = null;

export function blip(frequency: number, ms = 90, gain = 0.06) {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    // Exponential, because a linear fade to zero clicks at the end.
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000);
  } catch {
    // No audio is a quiet game, not a broken one.
  }
}
