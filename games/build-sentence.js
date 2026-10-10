// 排句子：聽句子、看 emoji 小場景（中文當提示），把打亂的字塊照順序點進格子（點，不拖）。
// 點錯的字塊晃一下；同一格錯 3 次或按「提示」→ 下一個正確字塊會一直跳。拼完整句念一次。
// 星星：提示 ≤1 → 3，2～3 → 2，其他 1。
import { shuffle, sleep } from '../lib/util.js';
import { html, render, confetti, fillName } from '../lib/ui.js';

export const id = 'build-sentence';

export function start(ctx) {
  const { theme, config, root } = ctx;
  const nick = ctx.profile().nickname;
  const candidates = (ctx.items || theme.phrases).filter((p) => Array.isArray(p.tokens) && p.tokens.length >= 3);
  const phrases = ctx.items ? candidates : shuffle(candidates).slice(0, config.buildPhrases);
  let pi = 0, hintsTotal = 0, completed = 0, dead = false;
  let cur, tiles, placed, wrongOnSlot, hintOn, phraseWrong, phraseHints, busy = false;

  function setup() {
    cur = phrases[pi];
    const toks = cur.tokens.map((t) => fillName(t, nick));
    let order = shuffle(toks.map((_, i) => i));
    if (toks.length > 1 && order.every((v, i) => v === i)) order = [...order.slice(1), order[0]];
    tiles = order.map((i) => ({ i, text: toks[i], used: false }));
    placed = [];
    wrongOnSlot = 0; hintOn = false; phraseWrong = 0; phraseHints = 0; busy = false;
    draw();
    ctx.speakEn(fillName(cur.en, nick));
  }

  function nextIndex() { return placed.length; }
  function tokensOf() { return cur.tokens.map((t) => fillName(t, nick)); }

  function draw(done = false) {
    ctx.setProgress(pi + 1, phrases.length);
    const toks = tokensOf();
    const next = nextIndex();
    // 提示要亮「還沒用掉、字一樣」的那一塊（句子裡有兩個 to 時，原本那塊可能已經被用掉了）
    const hintK = hintOn ? tiles.findIndex((t) => !t.used && t.text === toks[next]) : -1;
    render(root, html`
      <div class="center-text tiny mb">第 ${pi + 1} / ${phrases.length} 句</div>
      <div class="qcard ${ctx.zhHidden() ? 'zh-hidden' : ''}" style="padding-bottom:14px">
        <div class="scene sm">${cur.emoji || '💬'}</div>
        <div class="zh" data-act="zh" style="margin-top:0">${fillName(cur.zh, nick)}</div>
        <button class="zh-chip" data-act="peek">中文</button>
        <div class="row center mt" style="gap:16px">
          <button class="roundbtn sm primary" data-act="listen" aria-label="再聽一次">🔊</button>
          <button class="roundbtn sm" data-act="slow" aria-label="慢慢聽">🐢</button>
        </div>
      </div>
      <div class="slots">
        ${toks.map((t, i) => (i < placed.length
          ? html`<button class="slot ${done ? 'lit' : ''}" data-slot="${i}">${t}</button>`
          : html`<span class="slot empty">${t}</span>`))}
      </div>
      <div class="tiles">
        ${tiles.map((tl, k) => html`<button class="wtile ${tl.used ? 'used' : ''} ${k === hintK ? 'hint' : ''}" data-tile="${k}" ${tl.used ? 'disabled' : ''}>${tl.text}</button>`)}
      </div>
      <div class="row center mt">
        <button class="btn ghost" data-act="hint">💡 提示</button>
      </div>
    `);
  }

  async function tapTile(k) {
    if (busy) return;
    const tl = tiles[k];
    if (!tl || tl.used) return;
    const toks = tokensOf();
    const next = nextIndex();
    // 同一個字出現兩次（I like, I have）→ 文字一樣就算對
    if (tl.i === next || tl.text === toks[next]) {
      tl.used = true;
      placed.push(tl.text);
      wrongOnSlot = 0; hintOn = false;
      ctx.sfx.tap();
      if (placed.length === toks.length) return complete();
      draw();
    } else {
      phraseWrong++;
      wrongOnSlot++;
      ctx.sfx.wrong();
      const el = root.querySelector(`[data-tile="${k}"]`);
      if (el) { el.classList.add('nope'); setTimeout(() => el.classList.remove('nope'), 400); }
      if (wrongOnSlot >= 3 && !hintOn) { hintOn = true; draw(); }
    }
  }

  function undoLast() {
    if (busy || !placed.length) return;
    const text = placed.pop();
    const tl = tiles.slice().reverse().find((t) => t.used && t.text === text);
    if (tl) tl.used = false;
    ctx.sfx.pop();
    draw();
  }

  async function complete() {
    busy = true;
    draw(true);
    ctx.sfx.correct();
    confetti(10);
    const stars = phraseHints === 0 && phraseWrong <= 1 ? 3 : phraseHints <= 1 && phraseWrong <= 3 ? 2 : 1;
    ctx.award({ itemId: cur.id, type: 'phrase', stars, pass: stars >= 2, theme: cur.themeId });
    ctx.noteToday(`phrase:${cur.id}`);
    // 逐字亮：用字數估時間，念整句
    const slots = Array.from(root.querySelectorAll('.slot'));
    const total = Math.max(1200, placed.join(' ').length * 90);
    slots.forEach((s, i) => setTimeout(() => s.classList.add('lit'), (total / slots.length) * i));
    completed++;
    await ctx.speakEn(fillName(cur.en, nick));
    await sleep(600);
    if (dead) return;
    pi++;
    if (pi >= phrases.length) finish();
    else setup();
  }

  function finish() {
    if (dead) return;
    // 有句子是跳過的 → 只算「完成」1 顆星（沒用提示不代表排對了）
    const stars = completed < phrases.length ? 1 : hintsTotal <= 1 ? 3 : hintsTotal <= 3 ? 2 : 1;
    ctx.done({ stars, kind: ctx.kind || 'learn', replay: phrases.map((p) => ({ en: fillName(p.en, nick), zh: fillName(p.zh, nick), emoji: p.emoji })) });
  }

  function onTap(e) {
    const t = e.target.closest('[data-tile]');
    if (t) { tapTile(Number(t.dataset.tile)); return; }
    const s = e.target.closest('[data-slot]');
    if (s) { if (Number(s.dataset.slot) === placed.length - 1) undoLast(); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'listen') ctx.speakEn(fillName(cur.en, nick));
    else if (act === 'slow') ctx.speakEn(fillName(cur.en, nick), { rate: 0.7 });
    else if (act === 'hint') { if (!hintOn) { hintOn = true; hintsTotal++; phraseHints++; draw(); } }
    else if (act === 'zh') { if (ctx.settings().zhVoice) ctx.speakZh(fillName(cur.zh, nick)); }
    else if (act === 'peek') { const z = root.querySelector('.zh'); if (z) { z.classList.add('revealed'); setTimeout(() => z.classList.remove('revealed'), 2000); } }
  }

  if (!phrases.length) { ctx.toast('這個主題還沒有可以排的句子'); ctx.done({ stars: 1, kind: 'learn', replay: [] }); return { destroy() {} }; }
  root.addEventListener('click', onTap);
  ctx.setReplay(() => ctx.speakEn(fillName(cur.en, nick)));
  ctx.setSkip(() => { if (busy) return; pi++; if (pi >= phrases.length) finish(); else setup(); });
  setup();
  return { destroy() { dead = true; root.removeEventListener('click', onTap); } };
}
