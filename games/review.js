// 複習：把今天到期的項目（最多 12，家長可改）用它已經玩過的模式再出一次：單字 → 聽聽看；句子 → 排句子／開口說輪流。
// 複習盒的升降在 app.js 的 award 裡統一處理（第一次就對／開口 2 星以上 → 升一盒，否則回第 1 盒）。
// 出不了題的項目（教材刪掉了、手勢類不能考的字）直接從複習盒拿掉，不讓它們永遠占著名額。
import { html, render } from '../lib/ui.js';

export const id = 'review';

export async function start(ctx) {
  const { root } = ctx;
  const kid = ctx.profile().id;
  const lv = ctx.level.id;
  let dead = false;
  let current = null;
  let stageGen = 0;
  const handle = { destroy() { dead = true; stageGen++; if (current && current.destroy) current.destroy(); } };

  const due = ctx.store.dueItems(kid, lv, Infinity);
  if (!due.length) { ctx.done({ stars: 1, kind: 'review', idle: true, replay: [] }); return handle; }
  render(root, html`<div class="center-text muted mt-lg">整理今天要複習的…</div>`);

  const themeIds = Array.from(new Set(due.map((x) => x.theme)));
  const themes = {};
  for (const tid of themeIds) { try { themes[tid] = await ctx.loadTheme(tid); } catch { /* 主題被拿掉了 */ } }
  if (dead) return handle;

  // 先挑出「真的出得了題」的，出不了的從盒子拿掉；再取前 N 個（N＝家長設定的每次複習題數）
  const servable = [];
  for (const it of due) {
    const t = themes[it.theme];
    let item = null;
    if (t && it.type === 'word') { const w = t.words.find((x) => x.id === it.itemId); if (w && w.quizzable !== false) item = w; }
    if (t && it.type === 'phrase') item = t.phrases.find((x) => x.id === it.itemId) || null;
    if (item) servable.push({ ...it, item });
    else ctx.store.forgetItem(kid, { level: lv, theme: it.theme, type: it.type, itemId: it.itemId });
  }
  const cap = ctx.settings().reviewCap || 12;
  const picked = servable.slice(0, cap);
  const words = picked.filter((x) => x.type === 'word').map((x) => ({ ...x.item, themeId: x.theme }));
  const phrases = picked.filter((x) => x.type === 'phrase').map((x) => ({ ...x.item, themeId: x.theme }));
  if (!words.length && !phrases.length) { ctx.done({ stars: 1, kind: 'review', idle: true, replay: [] }); return handle; }

  const distractors = Object.values(themes).filter(Boolean).flatMap((t) => t.words.filter((w) => w.quizzable !== false));
  const stages = [];
  if (words.length) stages.push({ game: 'listen-tap', items: words });
  const canBuild = (p) => Array.isArray(p.tokens) && p.tokens.length >= 3;
  const build = phrases.filter((p, i) => i % 2 === 0 && canBuild(p));
  const say = phrases.filter((p, i) => i % 2 === 1 || !canBuild(p));
  if (build.length) stages.push({ game: 'build-sentence', items: build });
  if (say.length) stages.push({ game: 'say-it', items: say });

  const roundStars = [];
  const replay = [];
  let selfRated = false;
  let si = 0;
  const themeOf = (itemId) => (picked.find((x) => x.itemId === itemId) || {}).theme || null;

  async function runStage() {
    if (dead) return;
    if (si >= stages.length) {
      const avg = roundStars.reduce((a, b) => a + b, 0) / Math.max(1, roundStars.length);
      ctx.done({ stars: Math.max(1, Math.round(avg)), kind: 'review', selfRated, replay });
      return;
    }
    const my = ++stageGen;
    const st = stages[si];
    const mod = await (st.game === 'listen-tap' ? import('./listen-tap.js') : st.game === 'build-sentence' ? import('./build-sentence.js') : import('./say-it.js'));
    if (dead || my !== stageGen) return;
    const subRoot = document.createElement('div');
    root.innerHTML = '';
    root.appendChild(subRoot);
    const theme = themes[st.items[0].themeId];
    let stageDone = false;
    const sub = {
      ...ctx,
      root: subRoot,
      theme,
      items: st.items,
      distractors,
      kind: 'review',
      award: (a) => ctx.award({ ...a, theme: a.theme || themeOf(a.itemId) || theme.id }),
      done: (r) => {
        if (stageDone || dead || my !== stageGen) return;
        stageDone = true;
        roundStars.push(r.stars || 1);
        if (r.selfRated) selfRated = true;
        replay.push(...(r.replay || []));
        if (current && current.destroy) current.destroy();
        current = null;
        si++;
        runStage();
      },
    };
    const g = await mod.start(sub);
    // 這一關在 start 裡就結束了（例如題目不夠）→ 不要把它記成目前的遊戲
    if (!stageDone && !dead && my === stageGen) current = g;
    else if (g && g.destroy && (dead || my !== stageGen)) g.destroy();
  }
  await runStage();
  return handle;
}
