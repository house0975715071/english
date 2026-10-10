// 家長區：長按 3 秒 ＋ 一題超出九九乘法的乘法 → 今天學了什麼／進度／設定／小朋友／備份／說明。
// 每次進來都要重新過關（解鎖只記在這一次畫面，離開就失效），小孩撿到平板點「家長」進不去。
// 這裡才看得到：連續天數、辨識到的原文、百分比之類的數字。小孩的畫面永遠沒有這些。
import { AVATARS, GRADES, MODES } from './lib/store.js';
import { html, raw, render, starsHtml, toast, sheet, holdToConfirm, fillName } from './lib/ui.js';
import { GAMES } from './games/index.js';

const RATES = [{ v: 0.75, zh: '慢' }, { v: 0.9, zh: '中' }, { v: 1.05, zh: '快' }];

export function mountParent(root, ctx) {
  const { store } = ctx;
  let tab = 'today';
  let kidId = store.active() ? store.active().id : (store.profiles()[0] || {}).id || null;

  function gate(ringDone = false) {
    // 12～19 × 3～9：小二小三背過的九九乘法表裡沒有，答錯就換一題（不能一直猜同一題）
    const a = 12 + Math.floor(Math.random() * 8), b = 3 + Math.floor(Math.random() * 7);
    let typed = '';
    render(root, html`
      <div class="card center-text">
        <p class="muted">給大人用的區域。請<b>按住</b>下面的圓圈 3 秒。</p>
        <div class="gate-ring" id="ring"><span>按住</span></div>
        <div id="quiz" class="mt" hidden>
          <p style="font-size:22px;font-weight:800">${a} × ${b} = <span id="ans">＿</span></p>
          <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map((k) => html`<button data-k="${k}">${k}</button>`)}</div>
        </div>
      </div>`);
    const ring = root.querySelector('#ring');
    const quiz = root.querySelector('#quiz');
    const showQuiz = () => { quiz.hidden = false; ring.style.display = 'none'; };
    if (ringDone) showQuiz();
    else holdToConfirm(ring, 3000, showQuiz, (k) => ring.style.setProperty('--k', k));
    quiz.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-k]');
      if (!btn) return;
      const k = btn.dataset.k;
      if (k === '⌫') typed = typed.slice(0, -1);
      else if (k === '✓') {
        if (typed && Number(typed) === a * b) { draw(); return; }
        toast('答錯了，換一題');
        gate(true);
        return;
      } else if (typed.length < 3) typed += k;
      const ans = root.querySelector('#ans');
      if (ans) ans.textContent = typed || '＿';
    });
  }

  const kid = () => (kidId ? store.state.profiles[kidId] : null);
  const lv = () => ctx.level();

  function draw() {
    const kids = store.profiles();
    if (!kid() && kids.length) kidId = kids[0].id;
    const tabs = [['today', '今天'], ['progress', '進度'], ['settings', '設定'], ['kids', '小朋友'], ['backup', '備份'], ['about', '說明']];
    render(root, html`
      <div class="ptabs">${tabs.map(([k, z]) => html`<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${z}</button>`)}</div>
      ${kids.length > 1 && ['today', 'progress', 'settings'].includes(tab) ? html`<div class="seg mt">${kids.map((k) => html`<button class="${k.id === kidId ? 'on' : ''}" data-kid="${k.id}">${k.avatar} ${k.name}</button>`)}</div>` : ''}
      <div id="ptab" class="mt"></div>`);
    root.querySelector('.ptabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; draw(); } };
    const seg = root.querySelector('.seg');
    if (seg) seg.onclick = (e) => { const b = e.target.closest('[data-kid]'); if (b) { kidId = b.dataset.kid; draw(); } };
    const box = root.querySelector('#ptab');
    ({ today: tabToday, progress: tabProgress, settings: tabSettings, kids: tabKids, backup: tabBackup, about: tabAbout })[tab](box);
  }

  /* ── 今天 ── */
  async function tabToday(box) {
    const k = kid();
    if (!k) return render(box, html`<div class="banner">還沒有小朋友，先到「小朋友」新增。</div>`);
    render(box, html`<p class="muted">整理中…</p>`);
    const keys = store.todayItems(k.id);
    const themes = {};
    const resolve = async (themeId) => { if (!themes[themeId]) { try { themes[themeId] = await ctx.loadTheme(themeId); } catch { themes[themeId] = null; } } return themes[themeId]; };
    const rows = [];
    for (const key of keys) {
      const [type, id] = String(key).split(':');
      if (!id) continue;
      const themeId = (id.split('.')[1] || '').replace(/#.*$/, '');
      const t = await resolve(themeId);
      if (!t) continue;
      if (type === 'word') { const w = t.words.find((x) => x.id === id); if (w) rows.push({ emoji: w.emoji, en: w.en, zh: w.zh }); }
      else if (type === 'phrase') { const p = t.phrases.find((x) => x.id === id); if (p) rows.push({ emoji: p.emoji, en: p.en, zh: p.zh }); }
      else if (type === 'line') { const [did, j] = id.split('#'); const d = t.dialogues.find((x) => x.id === did); const l = d && d.lines[Number(j)]; if (l) rows.push({ emoji: '🎭', en: l.en, zh: l.zh }); }
    }
    const missed = store.mostMissed(k.id, lv().id, 5);
    const missRows = [];
    for (const m of missed) {
      const t = await resolve(m.theme);
      if (!t) continue;
      const it = m.type === 'word' ? t.words.find((x) => x.id === m.itemId) : t.phrases.find((x) => x.id === m.itemId);
      if (it) missRows.push({ ...it, miss: m.miss });
    }
    const recTheme = lv().themes.find((t) => !store.hasBadge(k.id, lv().id, t.id)) || lv().themes[0];
    const rt = await resolve(recTheme.id);
    const nick = k.nickname;
    const rowHtml = (r) => html`<div class="listrow"><span class="emoji">${r.emoji}</span><span class="t"><div class="en">${fillName(r.en, nick)}</div><div class="zh">${fillName(r.zh, nick)}${r.miss ? html`<span class="tiny">　答錯 ${r.miss} 次</span>` : ''}</div></span><button class="roundbtn sm" data-speak-en="${fillName(r.en, nick)}" aria-label="聽">🔊</button></div>`;
    render(box, html`
      <div class="card"><h3>今天學了什麼（${rows.length}）</h3>${rows.length ? rows.map(rowHtml) : html`<p class="muted small">今天還沒玩。</p>`}</div>
      <div class="card mt"><h3>最常錯的 5 個（餐桌小考）</h3>${missRows.length ? missRows.map(rowHtml) : html`<p class="muted small">還沒有答錯的。</p>`}</div>
      ${rt ? html`<div class="card mt"><h3>這週的主題：${recTheme.emoji} ${recTheme.zh}</h3>
        <p class="small muted">對話劇本在這裡，吃飯時你可以演對方那個角色，讓孩子演 ${rt.dialogues[0] ? rt.dialogues[0].roles.find((r) => r.kid).name_zh : '小孩'}。</p>
        ${rt.dialogues.map((d) => html`<details class="mt"><summary><b>${d.title_zh}</b>　<span class="tiny">${d.scene_zh}</span></summary>${d.lines.map((l) => { const r = d.roles.find((x) => x.key === l.role); return html`<div class="listrow"><span class="emoji">${r.emoji}</span><span class="t"><div class="en">${fillName(l.en, nick, d.roles.find((x) => x.kid).name_en)}</div><div class="zh">${fillName(l.zh, nick, d.roles.find((x) => x.kid).name_en)}</div></span><button class="roundbtn sm" data-speak-en="${fillName(l.en, nick, d.roles.find((x) => x.kid).name_en)}">🔊</button></div>`; })}</details>`)}
        <div class="banner info mt small"><b>這週在家三件事</b><br>① 早晚作息那幾句改用英文說（Time to wake up! / Brush your teeth.）<br>② 吃飯時你演對方，讓孩子接話<br>③ 請孩子教你一句他今天學的</div>
      </div>` : ''}`);
  }

  /* ── 進度 ── */
  function tabProgress(box) {
    const k = kid();
    if (!k) return render(box, html`<div class="banner">還沒有小朋友。</div>`);
    const L = lv().id;
    const days = Object.keys(k.progress.days).sort();
    const last = days[days.length - 1] || '還沒玩過';
    const badges = lv().themes.filter((t) => store.hasBadge(k.id, L, t.id)).length;
    const rc = store.reviewCounts(k.id, L);
    const week = store.weekStrip(k.id);
    const minutes = week.reduce((a, w) => a + ((k.progress.days[w.key] || {}).items || []).length, 0);
    render(box, html`
      <div class="card">
        <h3>${k.avatar} ${k.name}　<span class="tiny">${GRADES.find((g) => g.id === k.grade)?.zh || ''}${k.nickname ? `・${k.nickname}` : ''}</span></h3>
        <table class="prog">
          <tr><td>最近玩</td><td class="num">${last}</td></tr>
          <tr><td>這一週</td><td class="num">${raw(`<span class="week">${week.map((w) => `<i class="${w.hatched ? 'hatched' : w.played ? 'played' : ''}"></i>`).join('')}</span>`)}</td></tr>
          <tr><td>總星數</td><td class="num">⭐ ${k.progress.totalStars}</td></tr>
          <tr><td>主題徽章</td><td class="num">${badges} / ${lv().themes.length}</td></tr>
          <tr><td>孵出的貼紙</td><td class="num">${k.progress.hatched}</td></tr>
          <tr><td>學過的項目／今天到期</td><td class="num">${rc.total}／${rc.due}</td></tr>
          <tr><td>複習盒 1→5</td><td class="num">${rc.boxes.join(' · ')}</td></tr>
          <tr><td>我會說的句子</td><td class="num">${store.canSay(k.id, L).length}</td></tr>
          <tr><td>開口星（辨識／自評）</td><td class="num">${k.progress.speakingStars.recognized}／${k.progress.speakingStars.self}</td></tr>
          <tr><td>連續天數（只給家長看）</td><td class="num">${store.streak(k.id)}</td></tr>
          <tr><td>這週碰過的項目數</td><td class="num">${minutes}</td></tr>
        </table>
      </div>
      <div class="card mt"><h3>各主題</h3>
        <table class="prog"><tr><th>主題</th>${GAMES.map((g) => html`<th title="${g.zh}">${g.emoji}</th>`)}</tr>
        ${lv().themes.map((t) => html`<tr><td>${t.emoji} ${t.zh}${store.hasBadge(k.id, L, t.id) ? ' 🏅' : ''}</td>${GAMES.map((g) => html`<td class="num">${store.modeBest(k.id, L, t.id, g.id) || '·'}</td>`)}</tr>`)}
        </table>
        <p class="tiny mt">數字＝該遊戲最佳星數（2 以上會填滿一格）。</p>
      </div>
      <div class="card mt"><h3>最近辨識到的話（只有文字，沒有錄音）</h3>
        ${k.progress.utterances.length ? html`<table class="prog">${k.progress.utterances.map((u) => html`<tr><td class="tiny">${u.t}</td><td><div class="small"><b>${u.target}</b></div><div class="tiny">聽到：${u.heard || '（空）'}</div></td><td class="num">${'⭐'.repeat(u.stars)}</td></tr>`)}</table>` : html`<p class="muted small">還沒有。</p>`}
      </div>`);
  }

  /* ── 設定 ── */
  function tabSettings(box) {
    const k = kid();
    if (!k) return render(box, html`<div class="banner">還沒有小朋友。</div>`);
    const s = k.settings;
    const voices = ctx.tts.voices('en');
    const online = navigator.onLine !== false;
    const sw = (key, label, note = '') => html`<div class="switch"><div><div><b>${label}</b></div>${note ? html`<div class="tiny">${note}</div>` : ''}</div><button class="toggle ${s[key] ? 'on' : ''}" data-sw="${key}" aria-label="${label}"></button></div>`;
    render(box, html`
      <div class="card">
        <h3>聲音</h3>
        <div class="field"><label>英文聲音</label>
          <select id="voice"><option value="">自動（本機優先）</option>${voices.map((v) => html`<option value="${v.voiceURI}" ${s.voiceURI === v.voiceURI ? 'selected' : ''}>${v.name}（${v.lang}${v.local ? '' : '・需要網路'}）</option>`)}</select>
          <div class="row mt"><button class="btn soft" id="try-voice">🔊 試聽</button>${!online ? html`<span class="tiny">現在離線，只有本機聲音會出聲</span>` : ''}</div>
        </div>
        <div class="field mt"><label>英文語速</label><div class="seg">${RATES.map((r) => html`<button class="${Math.abs(s.rate - r.v) < 0.03 ? 'on' : ''}" data-rate="${r.v}">${r.zh}</button>`)}</div></div>
        ${sw('zhVoice', '點中文會唸', '用裝置的國語語音')}
        ${sw('navVoice', '按鈕名稱會唸', '一年級還不太會認字時很有用')}
        ${sw('sfx', '音效')}
      </div>
      <div class="card mt">
        <h3>中文顯示</h3>
        <div class="field"><div class="seg"><button class="${s.zhMode === 'always' ? 'on' : ''}" data-zh="always">一直顯示</button><button class="${s.zhMode === 'tap' ? 'on' : ''}" data-zh="tap">點一下才看</button></div></div>
        ${sw('zhLock', '鎖住，不讓小孩自己切換')}
      </div>
      <div class="card mt">
        <h3>開口說</h3>
        ${sw('recognition', '語音辨識', ctx.stt.supported ? 'Chrome／Edge 會把聲音送到 Google／Microsoft 辨識（不錄音不存檔）。關掉＝只用跟讀模式。' : '這個瀏覽器沒有語音辨識，會自動用跟讀模式。')}
        <div class="field mt"><label>角色扮演：先選再說</label><div class="seg"><button class="${s.chooseThenSay === null ? 'on' : ''}" data-cts="auto">依年級</button><button class="${s.chooseThenSay === true ? 'on' : ''}" data-cts="on">開</button><button class="${s.chooseThenSay === false ? 'on' : ''}" data-cts="off">關</button></div></div>
      </div>
      <div class="card mt">
        <h3>難度</h3>
        <div class="field"><label>聽聽看選項數</label><div class="seg"><button class="${s.options === 'auto' ? 'on' : ''}" data-opt="auto">自動</button><button class="${s.options === 3 ? 'on' : ''}" data-opt="3">3</button><button class="${s.options === 4 ? 'on' : ''}" data-opt="4">4</button></div></div>
        <div class="field mt"><label>每次複習最多幾題</label><div class="seg">${[8, 12, 16].map((n) => html`<button class="${s.reviewCap === n ? 'on' : ''}" data-cap="${n}">${n}</button>`)}</div></div>
        <div class="field mt"><label>教材年齡層</label><select id="level">${ctx.levels.map((l) => html`<option value="${l.id}" ${l.id === s.levelId ? 'selected' : ''} ${l.available ? '' : 'disabled'}>${l.zh} ${l.ages}${l.available ? '' : '（即將推出）'}</option>`)}</select></div>
      </div>`);
    box.onclick = (e) => {
      const t = e.target.closest('[data-sw],[data-rate],[data-zh],[data-cts],[data-opt],[data-cap]');
      if (!t) return;
      if (t.dataset.sw) store.updateSettings(k.id, { [t.dataset.sw]: !s[t.dataset.sw] });
      if (t.dataset.rate) store.updateSettings(k.id, { rate: Number(t.dataset.rate) });
      if (t.dataset.zh) store.updateSettings(k.id, { zhMode: t.dataset.zh });
      if (t.dataset.cts) store.updateSettings(k.id, { chooseThenSay: t.dataset.cts === 'auto' ? null : t.dataset.cts === 'on' });
      if (t.dataset.opt) store.updateSettings(k.id, { options: t.dataset.opt === 'auto' ? 'auto' : Number(t.dataset.opt) });
      if (t.dataset.cap) store.updateSettings(k.id, { reviewCap: Number(t.dataset.cap) });
      draw();
    };
    box.querySelector('#voice').onchange = (e) => { store.updateSettings(k.id, { voiceURI: e.target.value || null }); toast('已換聲音'); };
    box.querySelector('#try-voice').onclick = () => { const v = box.querySelector('#voice').value || null; ctx.tts.speak('Hello! Can I have some water, please?', { lang: 'en', rate: s.rate, voiceURI: v }); };
    box.querySelector('#level').onchange = (e) => { store.updateSettings(k.id, { levelId: e.target.value }); toast('已切換年齡層'); };
  }

  /* ── 小朋友 ── */
  function tabKids(box) {
    const kids = store.profiles();
    render(box, html`
      <div class="stack">
        ${kids.map((k) => html`
          <div class="card">
            <div class="row"><span style="font-size:40px">${k.avatar}</span><div><b style="font-size:20px">${k.name}</b><div class="tiny">${GRADES.find((g) => g.id === k.grade)?.zh || ''}${k.nickname ? `・${k.nickname}` : ''}・⭐ ${k.progress.totalStars}</div></div></div>
            <div class="row wrap mt">
              <button class="btn soft small" data-edit="${k.id}">✏️ 改名字／年級／英文名</button>
              <button class="btn soft small" data-avatar-of="${k.id}">🐾 換頭像</button>
              <button class="btn soft small" data-reset="${k.id}">↺ 清除進度</button>
              <button class="btn soft small" data-del="${k.id}">🗑 刪除</button>
            </div>
          </div>`)}
        ${kids.length < 4 ? html`<button class="btn block" data-go="#/new">➕ 新增小朋友</button>` : html`<p class="tiny">最多 4 個。</p>`}
      </div>`);
    box.onclick = (e) => {
      const ed = e.target.closest('[data-edit]');
      if (ed) return editKid(ed.dataset.edit);
      const av = e.target.closest('[data-avatar-of]');
      if (av) return pickAvatar(av.dataset.avatarOf);
      const rs = e.target.closest('[data-reset]');
      if (rs) { const k = store.state.profiles[rs.dataset.reset]; return sheet({ title: `清除 ${k.name} 的進度？`, body: html`<p>星星、貼紙、複習紀錄都會歸零，名字和設定會留著。<b>這個動作沒辦法復原。</b></p>`, buttons: [{ label: '確定清除', cls: 'danger', onTap: () => { store.resetProgress(k.id); toast('已清除'); draw(); } }, { label: '取消', cls: 'soft' }] }); }
      const dl = e.target.closest('[data-del]');
      if (dl) { const k = store.state.profiles[dl.dataset.del]; return sheet({ title: `刪除 ${k.name}？`, body: html`<p>會失去 ⭐ ${k.progress.totalStars} 顆星、${k.progress.hatched} 隻貼紙。<b>這個動作沒辦法復原。</b>建議先到「備份」匯出一份。</p>`, buttons: [{ label: '確定刪除', cls: 'danger', onTap: () => { store.deleteProfile(k.id); if (kidId === k.id) kidId = null; toast('已刪除'); draw(); } }, { label: '取消', cls: 'soft' }] }); }
    };
  }
  function editKid(id) {
    const k = store.state.profiles[id];
    sheet({
      title: '修改資料',
      body: html`
        <div class="field"><label>名字</label><input type="text" id="e-name" maxlength="12" value="${k.name}"></div>
        <div class="field mt"><label>年級</label><select id="e-grade">${GRADES.map((g) => html`<option value="${g.id}" ${g.id === k.grade ? 'selected' : ''}>${g.zh}</option>`)}</select></div>
        <div class="field mt"><label>英文名字（故事裡會用）</label><input type="text" id="e-nick" maxlength="16" value="${k.nickname}" placeholder="Amy"></div>`,
      buttons: [{ label: '儲存', cls: 'ok', onTap: () => { const g = document.querySelector('#e-grade').value; store.updateProfile(id, { name: document.querySelector('#e-name').value, grade: g, nickname: document.querySelector('#e-nick').value }); draw(); } }, { label: '取消', cls: 'soft' }],
    });
  }
  function pickAvatar(id) {
    sheet({ title: '換頭像', body: html`<div class="avatars">${AVATARS.map((a) => html`<button data-a="${a}">${a}</button>`)}</div>`, buttons: [{ label: '取消', cls: 'soft' }] });
    document.querySelector('.sheet .avatars').onclick = (e) => { const b = e.target.closest('[data-a]'); if (b) { store.updateProfile(id, { avatar: b.dataset.a }); document.querySelector('.sheet-bg').remove(); draw(); } };
  }

  /* ── 備份 ── */
  function tabBackup(box) {
    render(box, html`
      <div class="card">
        <h3>進度碼（換平板最快）</h3>
        <p class="small muted">按「產生」→ 整段複製 → 傳到 LINE 給自己 → 在新裝置的家長區貼回來。會把兩邊合併（同名小孩取最佳）。</p>
        <div class="row wrap"><button class="btn" id="gen-code">產生進度碼</button><button class="btn soft" id="copy-code" hidden>📋 複製</button></div>
        <textarea class="code mt" id="code-out" readonly placeholder="進度碼會出現在這裡"></textarea>
        <h3 class="mt-lg">貼回進度碼</h3>
        <textarea class="code" id="code-in" placeholder="把 KE1. 開頭的整段貼進來"></textarea>
        <div class="row mt"><button class="btn ok" id="import-code">匯入（合併）</button></div>
      </div>
      <div class="card mt">
        <h3>檔案備份</h3>
        <div class="row wrap"><button class="btn soft" id="dl-json">⬇️ 下載進度檔</button><label class="btn soft">⬆️ 上傳進度檔<input type="file" id="up-json" accept="application/json,.json" hidden></label></div>
        ${!store.persistOk ? html`<div class="banner mt">注意：這個瀏覽器目前存不住進度（無痕模式或空間不足），關掉就會不見。</div>` : ''}
        <div class="banner mt small">iPad 的 Safari 如果 7 天沒打開這個網頁，可能會把進度清掉；<b>加到主畫面</b>就不會。重要進度請偶爾產生一次進度碼存在 LINE。</div>
      </div>
      <div class="card mt">
        <h3>加到主畫面</h3>
        <div class="small"><b>iPad／iPhone（Safari）</b>：下面的「分享」⬆️ → 「加入主畫面」。<br><b>Android（Chrome）</b>：右上角「⋮」→「安裝應用程式」或「加到主畫面」。<br>加了之後點圖示就能玩，沒網路也能玩（除了「聽你說話」）。</div>
        ${ctx.swWaiting() ? html`<div class="row mt"><button class="btn" id="apply-update">有新版本，點一下更新</button></div>` : ''}
      </div>`);
    const out = box.querySelector('#code-out');
    box.querySelector('#gen-code').onclick = async () => { out.value = await store.exportCode(); box.querySelector('#copy-code').hidden = false; out.focus(); out.select(); };
    box.querySelector('#copy-code').onclick = async () => { try { await navigator.clipboard.writeText(out.value); toast('已複製，去 LINE 貼給自己'); } catch { out.select(); toast('請長按文字框全選複製'); } };
    box.querySelector('#import-code').onclick = async () => { const r = await store.importCode(box.querySelector('#code-in').value); toast(r.ok ? `匯入完成：新增 ${r.added ?? 0}、合併 ${r.merged ?? 0}` : r.error, 3500); if (r.ok) draw(); };
    box.querySelector('#dl-json').onclick = () => { const blob = new Blob([store.exportJSON()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `天天說英文-進度-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
    box.querySelector('#up-json').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; const r = store.importJSON(await f.text()); toast(r.ok ? `匯入完成：新增 ${r.added ?? 0}、合併 ${r.merged ?? 0}` : r.error, 3500); if (r.ok) draw(); };
    const up = box.querySelector('#apply-update');
    if (up) up.onclick = () => ctx.applyUpdate();
  }

  /* ── 說明 ── */
  function tabAbout(box) {
    const diag = () => [
      `天天說英文 ${ctx.version}`,
      `瀏覽器：${navigator.userAgent}`,
      `英文語音：${ctx.tts.voices('en').slice(0, 5).map((v) => v.name + (v.local ? '' : '(線上)')).join('、') || '無'}`,
      `中文語音：${ctx.tts.voices('zh').slice(0, 3).map((v) => v.name).join('、') || '無'}`,
      `語音辨識：${ctx.stt.supported ? '有' : '無'}；離線快取：${'serviceWorker' in navigator ? '支援' : '不支援'}；存檔：${store.persistOk ? '正常' : '失敗'}`,
      `網路：${navigator.onLine !== false ? '連線' : '離線'}；畫面：${innerWidth}×${innerHeight}`,
    ].join('\n');
    render(box, html`
      <div class="card">
        <h3>怎麼用最有效</h3>
        <ul class="small" style="padding-left:20px">
          <li>每天 5 分鐘，勝過星期天一小時。「今日任務」三個圈是照這個設計的。</li>
          <li>讓孩子自己點，你只要說「說給我聽」。</li>
          <li>把你自己早上那幾句（起床、刷牙、快遲到了）改成英文說。</li>
          <li>開口說拿不到 3 星很正常：辨識器對小孩的聲音本來就比較不準，星星只是鼓勵，不是成績。</li>
        </ul>
      </div>
      <div class="card mt">
        <h3>隱私</h3>
        <p class="small">沒有帳號、沒有伺服器、沒有廣告、沒有統計碼。進度只存在這台裝置的瀏覽器裡。唯一會離開裝置的是「語音辨識」：用 Chrome／Edge 時孩子說的那一句會送到 Google／Microsoft 辨識（不錄音、不存檔），可以在「設定」關掉。</p>
      </div>
      <div class="card mt">
        <h3>回報問題</h3>
        <p class="small muted">按一下複製這台裝置的狀態，貼給維護的人。</p>
        <button class="btn soft" id="copy-diag">📋 複製裝置狀態</button>
        <pre class="tiny mt" style="white-space:pre-wrap">${diag()}</pre>
      </div>`);
    box.querySelector('#copy-diag').onclick = async () => { try { await navigator.clipboard.writeText(diag()); toast('已複製'); } catch { toast('複製失敗，請手動選取下面的文字'); } };
  }

  // 放在最後：上面的 const（kid、lv）都宣告完了才開始畫
  gate();
}
