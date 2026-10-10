// 學一學：一段 6–8 張大卡（單字 A／單字 B／句子）。卡片到了自動念英文，點中文會唸中文。
// 沒有對錯；看完一段 1 顆星（三段＝3 星）。看過的字進複習盒。位置會記住，下次從那張接著看。
import { html, raw, render, fillName } from '../lib/ui.js';

export const id = 'learn-cards';

export function start(ctx) {
  const { theme, config, root } = ctx;
  const chunks = config.learnChunks.map((c) => {
    const src = c.pick.type === 'words' ? theme.words : theme.phrases;
    const items = src.slice(c.pick.from, c.pick.to).map((it) => ({ ...it, type: c.pick.type === 'words' ? 'word' : 'phrase' }));
    return { ...c, items, done: ctx.store.itemStars(ctx.profile().id, ctx.level.id, theme.id, id, c.id) >= 1 };
  }).filter((c) => c.items.length);

  // 預設開「還沒看完」的第一段；全部看完就從第一段再看一次
  let chunk = ctx.chunkId ? chunks.find((c) => c.id === ctx.chunkId) : null;
  if (!chunk) chunk = chunks.find((c) => !c.done) || chunks[0];
  let idx = Math.min(ctx.store.getLearnPos(ctx.profile().id, { level: ctx.level.id, theme: theme.id, chunk: chunk.id }), chunk.items.length - 1);
  let flipped = false;

  function pickChunk() {
    render(root, html`
      <div class="stack">
        <div class="mascot"><div class="face">🦉</div><div class="say">要學哪一段？</div></div>
        ${chunks.map((c) => html`
          <button class="modebtn" data-chunk="${c.id}">
            <span class="emoji">${c.pick.type === 'words' ? '🔤' : '💬'}</span>
            <span><span class="name">${c.zh}</span><br><span class="desc">${c.items.length} 張卡</span></span>
            <span class="stars">${c.done ? '⭐' : ''}</span>
          </button>`)}
      </div>`);
  }

  function draw() {
    const it = chunk.items[idx];
    const nick = ctx.profile().nickname;
    const en = fillName(it.en, nick);
    const zh = fillName(it.zh, nick);
    ctx.setProgress(idx + 1, chunk.items.length);
    render(root, html`
      <div class="center-text tiny mb">${chunk.zh}　${idx + 1} / ${chunk.items.length}</div>
      <div class="qcard ${ctx.zhHidden() ? 'zh-hidden' : ''}" data-act="card">
        <div class="scene ${it.type === 'phrase' ? 'sm' : ''}">${it.emoji}</div>
        <div class="en ${it.type === 'word' ? 'lg' : ''}">${en}</div>
        <div class="zh" data-act="zh">${zh}</div>
        <button class="zh-chip" data-act="peek">中文</button>
        <div class="row center mt" style="gap:16px">
          <button class="roundbtn sm" data-act="listen" aria-label="聽一次">🔊</button>
          <button class="roundbtn sm" data-act="slow" aria-label="慢慢聽">🐢</button>
        </div>
        <div class="tiny mt">🗣️ 跟我說一次</div>
      </div>
      <div class="row between mt-lg">
        <button class="btn soft" data-act="prev" ${idx === 0 ? 'disabled' : ''}>◀ 上一張</button>
        <button class="btn ${idx === chunk.items.length - 1 ? 'ok' : ''}" data-act="next">${idx === chunk.items.length - 1 ? '看完了 ✓' : '下一張 ▶'}</button>
      </div>
    `);
    // 只有考得到的才進複習盒（手勢類的單字 quizzable:false 沒有遊戲能出題，放進去會永遠到期、把複習名額塞滿）
    if (it.type !== 'word' || it.quizzable !== false) {
      ctx.store.seeItem(ctx.profile().id, { level: ctx.level.id, theme: theme.id, type: it.type, itemId: it.id });
    }
    ctx.store.setLearnPos(ctx.profile().id, { level: ctx.level.id, theme: theme.id, chunk: chunk.id, index: idx });
    ctx.noteToday(`${it.type}:${it.id}`);
  }

  function speakCurrent(slow = false) {
    const it = chunk.items[idx];
    ctx.speakEn(fillName(it.tts || it.ttsOverride || it.en, ctx.profile().nickname), { rate: slow ? 0.7 : undefined });
  }

  function onTap(e) {
    const cb = e.target.closest('[data-chunk]');
    if (cb) {
      chunk = chunks.find((c) => c.id === cb.dataset.chunk);
      idx = Math.min(ctx.store.getLearnPos(ctx.profile().id, { level: ctx.level.id, theme: theme.id, chunk: chunk.id }), chunk.items.length - 1);
      ctx.sfx.tap();
      draw();
      speakCurrent();
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'listen') speakCurrent();
    else if (act === 'slow') speakCurrent(true);
    else if (act === 'zh') { if (ctx.settings().zhVoice) ctx.speakZh(fillName(chunk.items[idx].zh, ctx.profile().nickname)); }
    else if (act === 'peek') {
      const z = root.querySelector('.zh');
      if (z) { z.classList.add('revealed'); setTimeout(() => z.classList.remove('revealed'), 2000); }
      if (ctx.settings().zhVoice) ctx.speakZh(fillName(chunk.items[idx].zh, ctx.profile().nickname));
    } else if (act === 'prev') {
      if (idx > 0) { idx--; ctx.sfx.flip(); draw(); speakCurrent(); }
    } else if (act === 'next') {
      if (idx < chunk.items.length - 1) { idx++; ctx.sfx.flip(); draw(); speakCurrent(); }
      else finishChunk();
    }
  }

  function finishChunk() {
    ctx.sfx.correct();
    ctx.award({ itemId: chunk.id, type: 'chunk', stars: 1, pass: true });
    ctx.store.setLearnPos(ctx.profile().id, { level: ctx.level.id, theme: theme.id, chunk: chunk.id, index: 0 });
    const doneCount = chunks.filter((c) => c.id === chunk.id || c.done).length;
    ctx.done({ stars: Math.max(1, Math.min(3, doneCount)), replay: chunk.items.map((it) => ({ en: fillName(it.en, ctx.profile().nickname), zh: fillName(it.zh, ctx.profile().nickname), emoji: it.emoji })), kind: 'learn' });
  }

  const onPicker = () => !root.querySelector('.qcard');
  root.addEventListener('click', onTap);
  ctx.setReplay(() => { if (!onPicker()) speakCurrent(); });
  // 跳過＝翻到下一張（不是直接拿星星）；最後一張才算看完。還在選段落的畫面就不理
  ctx.setSkip(() => {
    if (onPicker()) return;
    if (idx < chunk.items.length - 1) { idx++; ctx.sfx.flip(); draw(); speakCurrent(); }
    else finishChunk();
  });
  if (ctx.chunkId || chunks.length === 1) { draw(); speakCurrent(); } else pickChunk();

  return { destroy() { root.removeEventListener('click', onTap); } };
}
