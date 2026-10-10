// 開口說：5 句，每句用共用的開口說元件（先聽 → 麥克風 → 只亮念到的字 → 星星）。
// 一輪星星：5 句裡 4 句拿 3 星 → 3；3 句拿 2 星以上 → 2；其他 1。
// 同一句按「再說一次」只會讓這句的星數往上，不會因為第二次比較差或跳過就掉下來。
import { shuffle } from '../lib/util.js';
import { html, render, fillName } from '../lib/ui.js';

export const id = 'say-it';

export function start(ctx) {
  const { theme, config, root } = ctx;
  const nick = ctx.profile().nickname;
  const phrases = ctx.items ? ctx.items.slice() : shuffle(theme.phrases).slice(0, config.sayPhrases);
  const results = [];
  let i = 0, comp = null, selfRated = false;

  function show() {
    const j = i;
    ctx.setProgress(j + 1, phrases.length);
    render(root, html`<div class="center-text tiny mb">第 ${j + 1} / ${phrases.length} 句</div><div class="speak-box"></div>`);
    const box = root.querySelector('.speak-box');
    const phrase = phrases[j];
    comp = ctx.speaker.mount(box, {
      phrase,
      nextLabel: j === phrases.length - 1 ? '完成' : '下一句',
      onResult(res) {
        if (!results[j] || res.stars > results[j].stars) results[j] = res;
        if (res.selfRated) selfRated = true;
        const stars = Math.max(res.skipped ? 0 : 1, res.stars);
        ctx.award({ itemId: phrase.id, type: 'phrase', stars, pass: stars >= 2, theme: phrase.themeId });
        ctx.store.phraseSaid(ctx.profile().id, { level: ctx.level.id, phraseId: phrase.id, stars });
        ctx.noteToday(`phrase:${phrase.id}`);
      },
    });
  }

  function next() {
    if (comp && !comp.isDone()) comp.skip();
    if (comp) comp.destroy();
    i++;
    if (i >= phrases.length) return finish();
    show();
  }

  function finish() {
    const got = results.filter(Boolean);
    const three = got.filter((r) => r.stars >= 3).length;
    const two = got.filter((r) => r.stars >= 2).length;
    const stars = three >= Math.ceil(phrases.length * 0.8) ? 3 : two >= Math.ceil(phrases.length * 0.6) ? 2 : 1;
    ctx.done({ stars, kind: ctx.kind || 'speak', selfRated, replay: phrases.map((p) => ({ en: fillName(p.en, nick), zh: fillName(p.zh, nick), emoji: p.emoji })) });
  }

  ctx.speaker.onNext = next;
  ctx.setReplay(() => comp && comp.replay());
  ctx.setSkip(() => next());
  show();
  return { destroy() { if (comp) comp.destroy(); ctx.speaker.onNext = null; } };
}
