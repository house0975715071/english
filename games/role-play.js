// 角色扮演：一段 6–8 句的對話。
//   第一遍「聽故事」：像漫畫一格一格出現，每按一次 ▶ 出一句、念一句（英文在上、中文在下）。
//   第二遍「換你演」：小孩是 🧒；對方的句子程式念（念不出來會出現 ▶ 讓他按；裝置根本不能發聲就直接往下），
//     輪到小孩的句子：先選再說（小一小二預設）→ 兩個泡泡選對的那句 → 先聽 → 麥克風說 → 下一句。不管幾顆星都往下演。
//   結束：兩人鞠躬、拍手，可以「整段聽一次」或「換角色」再演一次。
// 一輪星星：小孩每句都 ≥2 且一半 ≥3 → 3；每句都有嘗試 → 2；其他 1。
// 鞠躬畫面一出現就記成績（小孩直接按回家也算）；換角色只會讓最佳星數往上。
import { html, raw, render, confetti, fillName } from '../lib/ui.js';
import { shuffle, sleep } from '../lib/util.js';

export const id = 'role-play';

export function start(ctx) {
  const { theme, root } = ctx;
  const nick = ctx.profile().nickname;
  const dialogues = theme.dialogues || [];
  let d = ctx.dialogueId ? dialogues.find((x) => x.id === ctx.dialogueId) : null;
  let pass = 'pick';          // pick | listen | act | end
  let shown = 0;              // 聽故事：已出現幾句
  let li = 0;                 // 換你演：目前第幾句
  let kidKey = null;          // 小孩演的角色 key
  let comp = null, chooseStage = null, lineStars = [], swapped = false, selfRated = false;
  let bestStars = 0;          // 這一段對話在這一輪拿過最好的星數（換角色只會往上）
  let dead = false;
  let actGen = 0;             // 「換你演」的步驟號碼：跳過、換角色、離開時 +1，舊的等待一律作廢
  let replayGen = 0;          // 「整段聽一次」的號碼
  let partnerSpeaking = false;
  const failedLines = new Set(); // 念不出來過的對方台詞：第二次就不再卡住，直接往下

  const kidRole = (dlg) => dlg.roles.find((r) => r.kid) || dlg.roles[0];
  const roleOf = (dlg, key) => dlg.roles.find((r) => r.key === key);
  const kidName = (dlg) => kidRole(dlg).name_en;
  const txt = (s, dlg) => fillName(s, nick, kidName(dlg));
  const pitchFor = (role) => (role && role.kid ? 1.15 : 0.85);

  function speakLine(line) {
    return ctx.speakEn(txt(line.en, d), { pitch: pitchFor(roleOf(d, line.role)) });
  }

  function pickScreen() {
    render(root, html`
      <div class="stack">
        <div class="mascot"><div class="face">🎭</div><div class="say">要演哪一段？</div></div>
        ${dialogues.map((x) => html`
          <button class="modebtn" data-pick="${x.id}">
            <span class="emoji">${x.roles.map((r) => r.emoji).join('')}</span>
            <span><span class="name">${x.title_zh}</span><br><span class="desc">${x.scene_zh}・${x.lines.length} 句</span></span>
            <span class="stars">${ctx.store.itemStars(ctx.profile().id, ctx.level.id, theme.id, id, x.id) ? '⭐' : ''}</span>
          </button>`)}
      </div>`);
  }

  // 每句旁的小喇叭用 data-line-say（不能用 data-say：那是主程式「念按鈕名稱」用的，會被念成中文數字）
  function bubble(line, j, { active = false, done = false, stars = null } = {}) {
    const role = roleOf(d, line.role);
    const me = line.role === kidKey;
    return html`
      <div class="bubble ${me ? 'me' : ''} ${active ? 'active' : ''} ${done ? 'done' : ''}" data-line="${j}">
        <div class="who">${role.emoji}</div>
        <div class="msg">
          <div class="name">${role.name_zh}</div>
          <div class="en">${txt(line.en, d)} <button class="speakline" data-line-say="${j}" aria-label="聽這句">🔊</button></div>
          <div class="zh">${txt(line.zh, d)}</div>
          ${stars ? html`<div class="stars">${'⭐'.repeat(stars)}</div>` : ''}
        </div>
      </div>`;
  }

  /* ───── 第一遍：聽故事 ───── */
  function drawListen() {
    ctx.setProgress(shown, d.lines.length);
    const lines = d.lines.slice(0, shown);
    render(root, html`
      <div class="center-text tiny mb">📖 聽故事・${d.scene_zh}</div>
      <div class="chat">${lines.map((l, j) => bubble(l, j, { done: j < shown - 1, active: j === shown - 1 }))}</div>
      <div class="row center mt">
        ${shown < d.lines.length
          ? html`<button class="btn big" style="width:auto" data-act="more">▶ ${shown === 0 ? '開始' : '下一句'}</button>`
          : html`<button class="btn ok big" style="width:auto" data-act="act">🎭 換你演</button>`}
      </div>
    `);
    const last = root.querySelector('.bubble.active');
    if (last) last.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* ───── 第二遍：換你演 ───── */
  function startAct() {
    actGen++;
    replayGen++;
    ctx.tts.cancel();
    pass = 'act'; li = 0; lineStars = []; chooseStage = null; partnerSpeaking = false;
    stepAct();
  }

  async function stepAct() {
    if (dead) return;
    if (li >= d.lines.length) return endScreen();
    const line = d.lines[li];
    if (line.role !== kidKey) {
      const my = ++actGen;
      partnerSpeaking = true;
      drawAct({ partnerPlaying: true });
      let r = { ok: true };
      // 裝置根本不能發聲、或這句已經念不出來過一次 → 不再卡住：字已經在畫面上，停一下就往下
      if (!ctx.tts.supported || failedLines.has(li)) await sleep(1200);
      else r = await speakLine(line);
      if (dead || my !== actGen) return;
      partnerSpeaking = false;
      if (!r.ok && r.reason !== 'timeout' && r.reason !== 'stale') {
        failedLines.add(li);
        drawAct({ needTap: true });
        return;
      }
      await sleep(400);
      if (dead || my !== actGen) return;
      li++;
      stepAct();
      return;
    }
    // 小孩的句子
    if (ctx.store.chooseThenSay(ctx.profile().id) && chooseStage !== 'done') {
      const others = dialogues.filter((x) => x.id !== d.id).flatMap((x) => x.lines.filter((l) => roleOf(x, l.role) && roleOf(x, l.role).kid).map((l) => ({ ...l, from: x })));
      const sameOthers = d.lines.filter((l, j) => l.role === kidKey && j !== li).map((l) => ({ ...l, from: d }));
      const poolD = (others.length ? others : sameOthers).filter((l) => txt(l.en, l.from) !== txt(line.en, d));
      const distractor = poolD.length ? poolD[Math.floor(Math.random() * poolD.length)] : null;
      chooseStage = { options: shuffle(distractor ? [{ line, real: true }, { line: distractor, real: false, from: distractor.from }] : [{ line, real: true }]), wrong: false };
      drawAct({});
      return;
    }
    drawAct({ speak: true });
  }

  function drawAct({ partnerPlaying = false, needTap = false, speak = false } = {}) {
    if (dead) return;
    ctx.setProgress(li + 1, d.lines.length);
    const kidTurn = speak || !!chooseStage;
    const lines = d.lines.slice(0, li + (kidTurn ? 0 : 1));
    const prev = d.lines[li - 1];
    // 「重來這句」：輪到小孩時才有用——再聽一次對方剛剛說了什麼
    const canRedo = kidTurn && li > 0 && prev && prev.role !== kidKey;
    render(root, html`
      <div class="center-text tiny mb">🎭 換你演・你是 ${roleOf(d, kidKey).emoji} ${roleOf(d, kidKey).name_zh}</div>
      <div class="chat">
        ${lines.map((l, j) => bubble(l, j, { done: j < li, active: j === li, stars: l.role === kidKey ? lineStars[j] : null }))}
        ${needTap ? html`<div class="row center"><button class="btn" data-act="partner">▶ 聽對方說</button></div>` : ''}
        ${partnerPlaying ? html`<div class="center-text tiny">…</div>` : ''}
      </div>
      ${canRedo ? html`<div class="row center"><button class="btn ghost small" data-act="redo">🔁 再聽一次對方說的</button></div>` : ''}
      ${chooseStage && chooseStage !== 'done' ? html`
        <div class="center-text muted small mt">你要說哪一句？</div>
        <div class="stack mt">
          ${chooseStage.options.map((o, k) => html`
            <button class="btn soft block ${chooseStage.wrong === k ? 'wrong' : ''}" data-choose="${k}" style="justify-content:flex-start;text-align:left;font-size:18px">
              <span class="en">${txt(o.line.en, o.from || d)}</span>
            </button>`)}
        </div>` : ''}
      ${speak ? html`<div class="speak-box mt"></div>` : ''}
    `);
    const active = root.querySelector('.bubble.active') || root.querySelector('.speak-box');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (speak) mountSpeaker();
  }

  function mountSpeaker() {
    const box = root.querySelector('.speak-box');
    const line = d.lines[li];
    const j = li;
    if (comp) comp.destroy();
    comp = ctx.speaker.mount(box, {
      phrase: { id: `${d.id}#${j}`, en: line.en, zh: line.zh, emoji: roleOf(d, kidKey).emoji, keyWords: line.keyWords || [], alsoAccept: line.alsoAccept || [] },
      roleName: kidName(d),
      autoListen: true,
      nextLabel: j >= d.lines.length - 1 ? '完成' : '下一句',
      onResult(res) {
        if (res.selfRated) selfRated = true;
        const stars = Math.max(res.skipped ? 0 : 1, res.stars);
        lineStars[j] = Math.max(lineStars[j] || 0, stars);
        ctx.award({ itemId: `${d.id}#${j}`, type: 'line', stars, pass: stars >= 2 });
        ctx.noteToday(`line:${d.id}#${j}`);
      },
    });
  }

  function afterKidLine() {
    if (comp && !comp.isDone()) comp.skip();
    if (comp) { comp.destroy(); comp = null; }
    chooseStage = null;
    li++;
    stepAct();
  }

  function endScreen() {
    if (dead) return;
    pass = 'end';
    actGen++;
    ctx.setProgress(d.lines.length, d.lines.length);
    const kidLines = d.lines.map((l, j) => (l.role === kidKey ? lineStars[j] || 0 : null)).filter((x) => x !== null);
    const all2 = kidLines.every((s) => s >= 2);
    const half3 = kidLines.filter((s) => s >= 3).length >= Math.ceil(kidLines.length / 2);
    const stars = all2 && half3 ? 3 : kidLines.every((s) => s >= 1) ? 2 : 1;
    ctx.award({ itemId: d.id, type: 'dialogue', stars, pass: stars >= 2 });
    // 鞠躬畫面一出現就記這一輪（小孩直接按回家也算數）
    ctx.record({ stars, kind: 'speak', selfRated });
    bestStars = Math.max(bestStars, stars);
    ctx.sfx.fanfare();
    confetti(16);
    render(root, html`
      <div class="result">
        <div class="big-emoji">${d.roles.map((r) => r.emoji).join(' ')}</div>
        <h1>🙇 鞠躬！👏</h1>
        <div class="delta">你演完了「${d.title_zh}」</div>
        <div class="mt">${raw('⭐'.repeat(stars))}</div>
        <div class="stack mt-lg">
          <button class="btn soft block" data-act="replay-all">🔊 整段聽一次</button>
          ${!swapped ? html`<button class="btn accent block" data-act="swap">🔄 換角色再演一次</button>` : ''}
          <button class="btn ok block" data-act="finish">完成 ✓</button>
        </div>
      </div>
    `);
  }

  async function replayAll() {
    const my = ++replayGen;
    ctx.tts.cancel();
    for (const l of d.lines) {
      const r = await speakLine(l);
      if (dead || my !== replayGen || !r.ok) return;
      await sleep(350);
      if (dead || my !== replayGen) return;
    }
  }

  function finish() {
    replayGen++;
    ctx.tts.cancel();
    ctx.done({ stars: Math.max(1, bestStars), kind: 'speak', selfRated, recorded: true, replay: d.lines.map((l) => ({ en: txt(l.en, d), zh: txt(l.zh, d), emoji: roleOf(d, l.role).emoji })) });
  }

  function beginDialogue(dlg) {
    d = dlg;
    kidKey = kidRole(d).key;
    pass = 'listen';
    shown = 0; li = 0; lineStars = []; chooseStage = null;
    drawListen();
    if (ctx.settings().navVoice) ctx.speakZh(d.title_zh);
  }

  function onTap(e) {
    if (dead) return;
    const p = e.target.closest('[data-pick]');
    if (p) { beginDialogue(dialogues.find((x) => x.id === p.dataset.pick)); return; }
    const sayBtn = e.target.closest('[data-line-say]');
    if (sayBtn) { if (!partnerSpeaking) speakLine(d.lines[Number(sayBtn.dataset.lineSay)]); return; }
    const ch = e.target.closest('[data-choose]');
    if (ch && chooseStage && chooseStage !== 'done') {
      const k = Number(ch.dataset.choose);
      if (chooseStage.options[k].real) { ctx.sfx.correct(); chooseStage = 'done'; drawAct({ speak: true }); }
      else {
        ctx.sfx.wrong(); chooseStage.wrong = k; drawAct({});
        const my = actGen;
        setTimeout(() => { if (!dead && my === actGen && chooseStage && chooseStage !== 'done') { chooseStage = 'done'; drawAct({ speak: true }); } }, 900);
      }
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'more') { shown++; drawListen(); speakLine(d.lines[shown - 1]); }
    else if (act === 'act') startAct();
    else if (act === 'partner') { failedLines.delete(li); stepAct(); }
    else if (act === 'redo') { const prev = d.lines[li - 1]; if (prev && prev.role !== kidKey) speakLine(prev); }
    else if (act === 'replay-all') replayAll();
    else if (act === 'swap') { swapped = true; kidKey = d.roles.find((r) => r.key !== kidKey).key; startAct(); }
    else if (act === 'finish') finish();
  }

  function skip() {
    if (dead) return;
    if (pass === 'listen') { shown = d.lines.length; drawListen(); return; }
    if (pass === 'end') { finish(); return; }
    if (pass !== 'act' || li >= d.lines.length) return;
    if (d.lines[li].role === kidKey) { afterKidLine(); return; }
    // 對方正在說：作廢那一句的等待，只往前一句（不會連跳兩句）
    actGen++;
    partnerSpeaking = false;
    ctx.tts.cancel();
    li++;
    stepAct();
  }

  if (!dialogues.length) { ctx.toast('這個主題還沒有對話'); ctx.done({ stars: 1, kind: 'speak', replay: [] }); return { destroy() {} }; }
  root.addEventListener('click', onTap);
  ctx.speaker.onNext = () => afterKidLine();
  ctx.setReplay(() => {
    if (pass === 'listen' && shown) speakLine(d.lines[shown - 1]);
    else if (pass === 'act') { if (comp) comp.replay(); else if (!partnerSpeaking) { const prev = d.lines[li - 1]; if (prev) speakLine(prev); } }
  });
  ctx.setSkip(skip);
  if (d || dialogues.length === 1) beginDialogue(d || dialogues[0]); else pickScreen();
  return {
    destroy() {
      dead = true; actGen++; replayGen++;
      if (comp) comp.destroy();
      ctx.speaker.onNext = null;
      root.removeEventListener('click', onTap);
    },
  };
}
