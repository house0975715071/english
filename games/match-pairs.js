// 配對記憶：翻牌，emoji 卡配英文卡。每翻一張就念那個字，配對成功留在桌上並顯示中文。
// 小一 3 對（2×3），小二以上 6 對（3×4）。沒有步數計。星星：翻錯 ≤ 一半對數 → 3，≤ 對數＋1 → 2，其他 1。
import { shuffle } from '../lib/util.js';
import { html, render, confetti } from '../lib/ui.js';

export const id = 'match-pairs';

export function start(ctx) {
  const { theme, config, root } = ctx;
  const grade = ctx.profile().grade;
  const nPairs = Math.min(grade === '1' ? config.pairsEasy : config.pairs, theme.words.filter((w) => w.quizzable !== false).length);
  const words = shuffle(theme.words.filter((w) => w.quizzable !== false)).slice(0, nPairs);
  const cards = shuffle([
    ...words.map((w) => ({ key: `e-${w.id}`, word: w, face: 'emoji' })),
    ...words.map((w) => ({ key: `t-${w.id}`, word: w, face: 'text' })),
  ]);
  const up = new Set();      // 目前翻開但還沒配對的 key（最多 2）
  const matched = new Set(); // 配對成功的 word id
  const pairTries = new Map();
  let mismatches = 0, busy = false, dead = false;

  function draw() {
    ctx.setProgress(matched.size, nPairs);
    render(root, html`
      <div class="center-text tiny mb">找到 ${matched.size} / ${nPairs} 對</div>
      <div class="pairs" style="grid-template-columns: repeat(${nPairs <= 3 ? 2 : 3}, 1fr)">
        ${cards.map((c) => {
          const isUp = up.has(c.key) || matched.has(c.word.id);
          const done = matched.has(c.word.id);
          return html`
            <button class="pair flip ${isUp ? 'flipped' : ''} ${done ? 'matched' : ''}" data-key="${c.key}" aria-label="${isUp ? c.word.en : '翻牌'}" style="min-height:${nPairs <= 3 ? 110 : 92}px">
              <span class="inner" style="display:block;width:100%">
                <span class="face front" style="display:block;font-size:40px">❓</span>
                <span class="face back" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
                  ${c.face === 'emoji' ? html`<span style="font-size:44px;line-height:1">${c.word.emoji}</span>` : html`<span class="en" style="font-size:20px;font-weight:800">${c.word.en}</span>`}
                  ${done ? html`<span class="tiny">${c.word.zh}</span>` : ''}
                </span>
              </span>
            </button>`;
        })}
      </div>
    `);
  }

  async function flip(key) {
    if (busy) return;
    const c = cards.find((x) => x.key === key);
    if (!c || up.has(key) || matched.has(c.word.id)) return;
    up.add(key);
    ctx.sfx.flip();
    draw();
    ctx.speakEn(c.word.ttsOverride || c.word.en);
    if (up.size < 2) return;
    busy = true;
    const [a, b] = Array.from(up).map((k) => cards.find((x) => x.key === k));
    pairTries.set(a.word.id, (pairTries.get(a.word.id) || 0) + 1);
    if (a.word.id === b.word.id) {
      await new Promise((r) => setTimeout(r, 450));
      if (dead) return;
      matched.add(a.word.id);
      up.clear();
      ctx.sfx.correct();
      draw();
      const tries = pairTries.get(a.word.id) || 1;
      ctx.award({ itemId: a.word.id, type: 'word', stars: tries <= 1 ? 3 : 2, pass: tries <= 2 });
      ctx.noteToday(`word:${a.word.id}`);
      if (matched.size === nPairs) { confetti(); ctx.sfx.fanfare(); setTimeout(finish, 900); }
    } else {
      mismatches++;
      pairTries.set(b.word.id, (pairTries.get(b.word.id) || 0) + 1);
      await new Promise((r) => setTimeout(r, 950));
      if (dead) return;
      up.clear();
      ctx.sfx.pop();
      draw();
    }
    busy = false;
  }

  function finish() {
    if (dead) return;
    // 沒配完就按跳過：只算「完成」1 顆星（翻錯次數是 0 不代表很厲害）
    const stars = matched.size < nPairs ? 1 : mismatches <= Math.ceil(nPairs / 2) ? 3 : mismatches <= nPairs + 1 ? 2 : 1;
    ctx.done({ stars, kind: 'learn', replay: words.map((w) => ({ en: w.en, zh: w.zh, emoji: w.emoji })) });
  }

  function onTap(e) {
    const p = e.target.closest('.pair');
    if (p) flip(p.dataset.key);
  }
  root.addEventListener('click', onTap);
  ctx.setReplay(() => { const k = Array.from(up)[0]; const c = k && cards.find((x) => x.key === k); if (c) ctx.speakEn(c.word.en); });
  ctx.setSkip(() => finish());
  draw();
  return { destroy() { dead = true; root.removeEventListener('click', onTap); } };
}
