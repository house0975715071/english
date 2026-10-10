// 音效：全部用 WebAudio 現場合成（答對叮咚、答錯噗、拿星星琶音、過關小號），沒有音檔。
// 第一次要在使用者點擊之後才能出聲（瀏覽器規定），所以 app.js 會在 pointerdown 時呼叫 unlock()。

let ctx = null;
let enabled = true;

function getCtx() {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); } catch { ctx = null; }
  return ctx;
}

export function unlock() {
  const c = getCtx();
  // iPad 鎖螢幕、接電話後會變成 'interrupted'（不是 'suspended'），所以只要不是 running 就叫醒
  if (c && c.state !== 'running') { try { c.resume(); } catch { /* 忽略 */ } }
}

export function setEnabled(on) {
  enabled = !!on;
}

export function isEnabled() {
  return enabled;
}

function tone({ freq = 440, type = 'sine', at = 0, dur = 0.15, gain = 0.18, slideTo = null }) {
  const c = getCtx();
  if (!c || !enabled) return;
  try {
    const t0 = c.currentTime + at;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch { /* 音效壞掉不能影響遊戲 */ }
}

export const sfx = {
  tap() { tone({ freq: 880, type: 'triangle', dur: 0.06, gain: 0.08 }); },
  flip() { tone({ freq: 520, type: 'triangle', dur: 0.08, gain: 0.1, slideTo: 780 }); },
  correct() {
    tone({ freq: 659, type: 'triangle', dur: 0.12 });
    tone({ freq: 988, type: 'triangle', at: 0.11, dur: 0.2 });
  },
  wrong() { tone({ freq: 220, type: 'square', dur: 0.18, gain: 0.07, slideTo: 160 }); },
  star(n = 1) {
    const notes = [784, 988, 1175, 1568];
    for (let i = 0; i < Math.min(4, n + 1); i++) tone({ freq: notes[i], type: 'sine', at: i * 0.09, dur: 0.22, gain: 0.14 });
  },
  fanfare() {
    const seq = [523, 659, 784, 1047, 784, 1047];
    seq.forEach((f, i) => tone({ freq: f, type: 'triangle', at: i * 0.12, dur: i === seq.length - 1 ? 0.5 : 0.14, gain: 0.16 }));
  },
  pop() { tone({ freq: 300, type: 'sine', dur: 0.09, gain: 0.12, slideTo: 900 }); },
  mic() { tone({ freq: 440, type: 'sine', dur: 0.1, gain: 0.1 }); tone({ freq: 660, type: 'sine', at: 0.1, dur: 0.1, gain: 0.1 }); },
};
