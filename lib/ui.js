// 畫面小工具：安全的 HTML 樣板、星星、吐司、底部面板、彩帶、{name} 代換。
import { escapeHtml } from './util.js';

/** 樣板字串：插進去的值一律跳脫；要插「已經安全的 HTML」用 raw() 包起來 */
export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < vals.length) {
      const v = vals[i];
      if (v && v.__raw) out += v.__raw;
      else if (Array.isArray(v)) out += v.map((x) => (x && x.__raw ? x.__raw : escapeHtml(x))).join('');
      else if (v === null || v === undefined || v === false) out += '';
      else out += escapeHtml(v);
    }
  });
  return { __raw: out };
}
export const raw = (s) => ({ __raw: String(s) });
export const render = (el, tpl) => { el.innerHTML = tpl && tpl.__raw !== undefined ? tpl.__raw : String(tpl); };

export function starsHtml(n, { big = false, max = 3 } = {}) {
  const parts = [];
  for (let i = 1; i <= max; i++) parts.push(`<span class="${i <= n ? 'on' : 'off'}">⭐</span>`);
  return raw(`<span class="stars${big ? ' big' : ''}" aria-label="${n} 顆星">${parts.join('')}</span>`);
}

export function dotsHtml(slots) {
  return raw(`<span class="dots">${slots.map((s) => `<i class="${s.filled ? 'on' : s.best > 0 ? 'half' : ''}"></i>`).join('')}</span>`);
}

let toastTimer = null;
export function toast(msg, ms = 2200) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.remove(); }, ms);
}

/** 底部面板。buttons: [{ label, cls, onTap, keep }]；回傳 close() */
export function sheet({ title = '', body = raw(''), buttons = [], dismissable = true }) {
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  const btns = buttons.map((b, i) => `<button class="btn block ${b.cls || ''}" data-i="${i}">${escapeHtml(b.label)}</button>`).join('');
  bg.innerHTML = `<div class="sheet" role="dialog">${title ? `<h2 style="margin:0 0 12px;font-size:22px">${escapeHtml(title)}</h2>` : ''}<div class="sheet-body">${body.__raw ?? escapeHtml(body)}</div><div class="stack mt">${btns}</div></div>`;
  const close = () => { bg.remove(); };
  bg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (b) {
      const spec = buttons[Number(b.dataset.i)];
      if (spec && spec.onTap) spec.onTap(close);
      if (!spec || !spec.keep) close();
      return;
    }
    if (dismissable && e.target === bg) close();
  });
  document.body.appendChild(bg);
  return close;
}

const CONFETTI = ['⭐', '🌟', '✨', '🎉', '💛', '💚', '💙', '🧡'];
export function confetti(n = 14) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div');
  box.className = 'confetti';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.textContent = CONFETTI[i % CONFETTI.length];
    s.style.left = `${Math.random() * 100}vw`;
    s.style.animationDelay = `${Math.random() * 0.4}s`;
    s.style.fontSize = `${20 + Math.random() * 20}px`;
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 1900);
}

/** 把 {name} 換成小孩的英文暱稱（沒有就用角色名 fallback） */
export function fillName(text, nickname, fallback = 'Amy') {
  return String(text || '').replace(/\{name\}/g, nickname || fallback);
}

/** 用在長按的元素：按住 ms 毫秒才算；回傳解除函式 */
export function holdToConfirm(el, ms, onDone, onProgress = null) {
  let timer = null, start = 0, raf = null;
  const tick = () => {
    if (!start) return;
    const k = Math.min(1, (performance.now() - start) / ms);
    if (onProgress) onProgress(k);
    if (k < 1) raf = requestAnimationFrame(tick);
  };
  const begin = (e) => { e.preventDefault(); start = performance.now(); tick(); timer = setTimeout(() => { stop(); onDone(); }, ms); };
  const stop = () => { clearTimeout(timer); cancelAnimationFrame(raf); start = 0; if (onProgress) onProgress(0); };
  el.addEventListener('pointerdown', begin);
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointerleave', stop);
  el.addEventListener('pointercancel', stop);
  return () => { el.removeEventListener('pointerdown', begin); el.removeEventListener('pointerup', stop); el.removeEventListener('pointerleave', stop); el.removeEventListener('pointercancel', stop); };
}

export function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v !== false && v !== null && v !== undefined) n.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return n;
}
