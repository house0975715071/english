// 聽聽看：聽英文（不顯示字），點 3～4 個 emoji 裡對的那個。點了才出現英文＋中文並再念一次。
// 答錯：輕輕一聲、晃一下，正確的亮起來並念出來，這題排到 2～3 題後再出一次；第二次錯會灰掉一個錯的選項。
// 星星：1 完成、2 = 8 題裡 6 題第一次就對、3 = 全部第一次就對。
import { shuffle, pickDistractors, sleep } from '../lib/util.js';
import { html, render, confetti, fillName } from '../lib/ui.js';

export const id = 'listen-tap';

export function start(ctx) {
  const { theme, config, root } = ctx;
  const pool = theme.words.filter((w) => w.quizzable !== false);
  // 可考的字太少（例如打招呼主題多半是手勢）→ 題數縮到「字數 × 2」，不要同一個字問四次
  const nQ = ctx.items ? ctx.items.length : Math.min(config.listenQuestions, Math.max(1, pool.length) * 2);
  let targets = ctx.items ? ctx.items.slice() : shuffle(pool).slice(0, nQ);
  if (!ctx.items) { const again = shuffle(pool); while (targets.length < nQ && pool.length) targets.push(again[targets.length % again.length]); }
  if (!targets.length || (ctx.distractors || pool).filter((w) => w.quizzable !== false).length < 2) {
    ctx.toast('這個主題可以考的圖不夠，先玩別的');
    ctx.done({ stars: 1, kind: ctx.kind || 'learn', replay: [] });
    return { destroy() {} };
  }
  const queue = targets.map((w) => ({ word: w, tries: 0, options: null, dimmed: new Set() }));
  const firstTry = new Map();
  let answered = 0, total = queue.length, missStreak = 0, busy = false, dead = false;
  let cur = null, options = [], dimmed = new Set();

  function optionCount() {
    const base = ctx.store.optionCount(ctx.profile().id);
    return Math.max(2, base - Math.min(2, Math.floor(missStreak / 3)));
  }

  function nextQuestion() {
    if (dead) return;
    if (!queue.length) return finish();
    cur = queue.shift();
    // 同一題再出一次時用同一組選項，第二次答錯灰掉的那個也保留（真的變簡單）
    if (!cur.options) {
      const distractPool = (ctx.distractors || pool).filter((w) => w.quizzable !== false);
      cur.options = shuffle([cur.word, ...pickDistractors(distractPool, cur.word, optionCount() - 1)]);
    }
    options = cur.options;
    dimmed = cur.dimmed;
    draw();
    speak();
  }

  function speak(slow = false) {
    ctx.speakEn(cur.word.ttsOverride || cur.word.en, { rate: slow ? 0.7 : undefined });
  }

  function draw(revealed = null) {
    ctx.setProgress(answered + 1, total);
    render(root, html`
      <div class="center-text tiny mb">第 ${answered + 1} / ${total} 題</div>
      <div class="row center" style="gap:16px">
        <button class="roundbtn primary" data-act="listen" aria-label="再聽一次">🔊</button>
        <button class="roundbtn sm" data-act="slow" aria-label="慢慢聽">🐢</button>
      </div>
      <div class="center-text muted small mt">聽一聽，點對的圖</div>
      <div class="choices ${options.length === 3 ? 'three' : ''}">
        ${options.map((o) => html`
          <button class="choice ${dimmed.has(o.id) ? 'dim' : ''} ${revealed && o.id === cur.word.id ? 'correct' : ''} ${revealed && revealed.wrongId === o.id ? 'wrong' : ''}" data-id="${o.id}" ${dimmed.has(o.id) ? 'disabled' : ''}>
            <span class="emoji">${o.emoji}</span>
            <span class="label">${revealed && (o.id === cur.word.id || revealed.wrongId === o.id) ? html`${o.en}<br><span class="tiny">${o.zh}</span>` : ''}</span>
          </button>`)}
      </div>
    `);
  }

  async function choose(idStr) {
    if (busy) return;
    const picked = options.find((o) => o.id === idStr);
    if (!picked) return;
    busy = true;
    const correct = picked.id === cur.word.id;
    if (!firstTry.has(cur.word.id)) firstTry.set(cur.word.id, correct && cur.tries === 0);
    if (correct) {
      missStreak = 0;
      ctx.sfx.correct();
      draw({});
      confetti(8);
      answered++;
      const pass = cur.tries === 0;
      ctx.award({ itemId: cur.word.id, type: 'word', stars: pass ? 3 : 2, pass });
      ctx.noteToday(`word:${cur.word.id}`);
      await ctx.speakEn(cur.word.ttsOverride || cur.word.en);
      await sleep(350);
      if (dead) return;
      busy = false;
      nextQuestion();
    } else {
      missStreak++;
      cur.tries++;
      ctx.sfx.wrong();
      draw({ wrongId: picked.id });
      await ctx.speakEn(cur.word.ttsOverride || cur.word.en);
      await sleep(500);
      if (dead) return;
      if (cur.tries >= 3) {
        // 第三次：直接顯示答案，往下走（不算過）
        answered++;
        ctx.award({ itemId: cur.word.id, type: 'word', stars: 1, pass: false });
        busy = false;
        nextQuestion();
        return;
      }
      if (cur.tries === 2) cur.dimmed.add(picked.id);
      // 排到 2～3 題後再出
      const pos = Math.min(queue.length, 2 + Math.floor(Math.random() * 2));
      queue.splice(pos, 0, cur);
      total = answered + queue.length;
      busy = false;
      nextQuestion();
    }
  }

  function finish() {
    const first = Array.from(firstTry.values()).filter(Boolean).length;
    const n = firstTry.size || 1;
    const stars = first === n ? 3 : first / n >= 0.75 ? 2 : 1;
    const uniq = Array.from(new Map(targets.map((w) => [w.id, w])).values());
    ctx.done({ stars, kind: ctx.kind || 'learn', replay: uniq.map((w) => ({ en: w.en, zh: w.zh, emoji: w.emoji })) });
  }

  function onTap(e) {
    const c = e.target.closest('.choice');
    if (c) { choose(c.dataset.id); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'listen') speak();
    if (b.dataset.act === 'slow') speak(true);
  }

  root.addEventListener('click', onTap);
  ctx.setReplay(() => speak());
  // 跳過的題目算「第一次沒答對」，不能跳掉難的只留簡單的就拿 3 顆星
  ctx.setSkip(() => {
    if (busy || !cur) return;
    if (!firstTry.has(cur.word.id)) firstTry.set(cur.word.id, false);
    answered++;
    nextQuestion();
  });
  nextQuestion();
  return { destroy() { dead = true; root.removeEventListener('click', onTap); } };
}
