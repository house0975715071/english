// 發音評分：把「要念的英文句子」跟「瀏覽器聽到的文字」比對，算出幾顆星。
// 純邏輯、沒有畫面、沒有瀏覽器 API，所以 node 測試可以直接跑。
//
// 原則（給 6～9 歲小孩用，所以寬鬆）：
//   - 大小寫、標點、縮寫（I'm／I am）、數字寫法（7／seven）都當成一樣
//   - 一個字差一兩個字母（聽成 tree／three）也算對
//   - 字的順序用「最長共同子序列」對齊，少念一個字只扣那一個字
//   - 瀏覽器會給好幾個候選句，取分數最高的那個

const CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is', "it's": 'it is',
  "we're": 'we are', "they're": 'they are', "i've": 'i have', "you've": 'you have',
  "we've": 'we have', "they've": 'they have', "i'll": 'i will', "you'll": 'you will',
  "he'll": 'he will', "she'll": 'she will', "we'll": 'we will', "they'll": 'they will',
  "it'll": 'it will', "i'd": 'i would', "you'd": 'you would', "don't": 'do not',
  "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', cannot: 'can not',
  "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not',
  "weren't": 'were not', "let's": 'let us', "what's": 'what is', "where's": 'where is',
  "who's": 'who is', "how's": 'how is', "that's": 'that is', "there's": 'there is',
  "here's": 'here is', "haven't": 'have not', "hasn't": 'has not', "couldn't": 'could not',
  "shouldn't": 'should not', "wouldn't": 'would not', "i'd've": 'i would have',
  "o'clock": 'oclock',
};

const SYNONYMS = {
  mum: 'mom', mommy: 'mom', mummy: 'mom', mama: 'mom', mamma: 'mom',
  daddy: 'dad', papa: 'dad',
  okay: 'ok', yeah: 'yes', yep: 'yes', yup: 'yes',
  goodnight: 'good night', goodbye: 'good bye', miss: 'ms', mrs: 'ms', lynn: 'lin', linn: 'lin', lynne: 'lin',
  hideandseek: 'hide and seek', icecream: 'ice cream',
  gonna: 'going to', wanna: 'want to', gotta: 'got to',
  grey: 'gray', colour: 'color', favourite: 'favorite',
};

// 同音字：兩邊都換成同一個代表字，小孩念對了不會因為辨識器選錯字而扣分
const HOMOPHONES = {
  two: 'to', too: 'to', four: 'for', eye: 'i', sea: 'see', their: 'there', ate: 'eight', won: 'one',
  know: 'no', write: 'right', buy: 'by', bye: 'by', hear: 'here', wear: 'where', meet: 'meat', flower: 'flour',
  son: 'sun', pair: 'pear', hour: 'our', red: 'read', blue: 'blew', week: 'weak', hi: 'high', whole: 'hole',
};

const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];
const TENS = { 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety' };

function numberToWords(n) {
  if (n <= 20) return NUMBER_WORDS[n];
  if (n < 100) {
    const t = Math.floor(n / 10) * 10;
    const r = n % 10;
    const tens = t === 20 ? 'twenty' : TENS[t];
    return r ? `${tens} ${NUMBER_WORDS[r]}` : tens;
  }
  if (n === 100) return 'one hundred';
  return String(n);
}

/** 把一句英文拆成比對用的小寫單字陣列 */
export function tokenize(text) {
  let s = String(text || '').toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[‐-―]/g, '-')
    .replace(/(\d),(\d)/g, '$1$2')
    .replace(/(\d+):(\d\d)/g, (m, h, mm) => (mm === '00' ? `${h} oclock` : `${h} ${mm}`));
  s = s.replace(/[^a-z0-9'\s-]/g, ' ').replace(/-/g, ' ');
  const out = [];
  for (const raw of s.split(/\s+/)) {
    if (!raw) continue;
    const w = raw.replace(/^'+|'+$/g, '');
    if (!w) continue;
    const expanded = CONTRACTIONS[w] || w;
    for (let p of expanded.split(' ')) {
      if (!p) continue;
      if (/^\d+$/.test(p)) {
        const n = Number(p);
        if (n >= 0 && n <= 100) p = numberToWords(n);
      }
      const syn = SYNONYMS[p] || p;
      for (const q of syn.split(' ')) if (q) out.push(HOMOPHONES[q] || q);
    }
  }
  return out;
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = new Array(n + 1);
  let cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

/** 兩個單字算不算「念到了」：一樣，或長一點的字差 1～2 個字母 */
export function wordsMatch(a, b) {
  if (a === b) return true;
  const len = Math.max(a.length, b.length);
  if (len < 4) return false;
  const d = levenshtein(a, b);
  if (len >= 7) return d <= 2;
  return d <= 1;
}

/**
 * 用最長共同子序列對齊，回傳目標每個字有沒有被念到。
 * 回傳 boolean[]，長度等於 target.length。
 */
export function alignHits(target, spoken) {
  const m = target.length, n = spoken.length;
  const hits = new Array(m).fill(false);
  if (!m || !n) return hits;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = wordsMatch(target[i], spoken[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (wordsMatch(target[i], spoken[j])) { hits[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return hits;
}

export function starsFromRatio(ratio) {
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.5) return 2;
  if (ratio > 0) return 1;
  return 0;
}

/**
 * 已知誤聽（thursday ← thirsty）：把聽到的那個字換成目標句裡最像的字。
 * 只在「這句還沒被聽到的字」裡面找（duck 要補到沒聽到的 dog，不是已經聽到的 touch 或 don't 拆出來的 do）；
 * 一樣像的時候：關鍵字優先，再來是比較長的字。已經在目標句裡的字不動（聽到的本來就對）。
 */
function applyAlsoAccept(spoken, targetTokens, alsoAccept, keyToks = []) {
  if (!alsoAccept.length || !targetTokens.length) return spoken;
  const acc = new Set(alsoAccept.flatMap((a) => tokenize(a)));
  const keys = new Set(keyToks);
  const targets = new Set(targetTokens);
  const heard = new Set(spoken.filter((w) => targets.has(w)));
  const missing = new Set(targetTokens.filter((t) => !heard.has(t)));
  const pool = missing.size ? missing : targets;
  return spoken.map((w) => {
    if (!acc.has(w) || targets.has(w)) return w;
    let best = null;
    for (const t of pool) {
      const cand = { t, d: levenshtein(w, t), key: keys.has(t) ? 0 : 1, len: -t.length };
      if (!best || cand.d < best.d || (cand.d === best.d && (cand.key < best.key || (cand.key === best.key && cand.len < best.len)))) best = cand;
    }
    return best ? best.t : w;
  });
}

/**
 * 主函式。
 * target：要念的英文；alternatives：瀏覽器聽到的候選句（字串陣列，第一個通常最準）。
 * options.keyWords：一定要念到的實詞（沒念到最多 2 星）；options.alsoAccept：已知會被聽成的字。
 * 回傳 { stars, percent, transcript, words: [{ word, hit }], ratio, keyHit }
 * words 用原句的字（保留大小寫與標點）切出來，方便畫面上把念到的字亮起來。
 */
export function scoreSpeech(target, alternatives, { keyWords = [], alsoAccept = [] } = {}) {
  const targetTokens = tokenize(target);
  const display = String(target || '').trim().split(/\s+/).filter(Boolean);
  const alts = (Array.isArray(alternatives) ? alternatives : [alternatives])
    .map((a) => (a == null ? '' : String(a)))
    .filter((a) => a.trim());

  const keyToks = keyWords.flatMap((k) => tokenize(k));
  let best = { ratio: 0, hits: new Array(targetTokens.length).fill(false), transcript: '', exact: false };
  for (const alt of alts) {
    const spoken = applyAlsoAccept(tokenize(alt), targetTokens, alsoAccept, keyToks);
    const hits = alignHits(targetTokens, spoken);
    const exact = spoken.length === targetTokens.length && spoken.every((w, i) => w === targetTokens[i]);
    const matched = hits.filter(Boolean).length;
    // 多念很多不相干的字也要稍微扣：念到的字數 ÷ max(目標字數, 聽到字數 的 8 折)
    const denom = Math.max(targetTokens.length, Math.round(spoken.length * 0.8));
    const ratio = targetTokens.length ? matched / denom : 0;
    if (ratio > best.ratio || (ratio === best.ratio && (!best.transcript || (exact && !best.exact)))) {
      best = { ratio, hits, transcript: alt.trim(), exact };
    }
  }

  // 把 token 的命中結果對回原句的字（一個原字可能展開成多個 token，例如 I'm → i am）
  const words = [];
  let ti = 0;
  for (const w of display) {
    const n = tokenize(w).length;
    if (n === 0) { words.push({ word: w, hit: true }); continue; }
    const slice = best.hits.slice(ti, ti + n);
    words.push({ word: w, hit: slice.length > 0 && slice.every(Boolean) });
    ti += n;
  }

  const ratio = Math.min(1, best.ratio);
  let stars = starsFromRatio(ratio);
  // 關鍵字沒念到 → 最多 2 星
  const keyHit = keyToks.every((k) => { const i = targetTokens.indexOf(k); return i >= 0 && best.hits[i]; });
  if (!keyHit && stars > 2) stars = 2;
  // 一兩個字的短句（Hi!／Thank you.）要一字不差才 3 星
  if (targetTokens.length <= 2 && stars === 3 && !best.exact) stars = 2;
  return {
    stars,
    percent: Math.round(ratio * 100),
    ratio,
    transcript: best.transcript,
    words,
    keyHit,
  };
}
