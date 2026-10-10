// 教材入口：年齡層清單＋載入主題。主題檔是 ES module，用 import() 動態載入（不用 fetch，離線快取也會存）。
import manifest69 from './levels/6-9/manifest.js';
import config69 from './levels/6-9/config.js';

export const LEVELS = [
  { ...manifest69, config: config69, available: true },
  { id: '3-6', zh: '幼兒', en: 'Ages 3–6', ages: '3–6 歲', themes: [], available: false },
  { id: '9-12', zh: '國小中高年級', en: 'Grades 4–6', ages: '9–12 歲', themes: [], available: false },
  { id: '12-18', zh: '國高中', en: 'Ages 12–18', ages: '12–18 歲', themes: [], available: false },
];

// 只回傳「已經有教材」的年齡層；存檔裡寫了還沒推出的年齡層（例如匯入來的）就退回第一個，不能讓首頁當掉
export function getLevel(id) {
  return LEVELS.find((l) => l.id === id && l.available) || LEVELS[0];
}

const cache = new Map();

export async function loadTheme(levelId, themeId) {
  const key = `${levelId}/${themeId}`;
  if (cache.has(key)) return cache.get(key);
  const level = getLevel(levelId);
  if (!level.themes.some((t) => t.id === themeId)) throw new Error(`沒有這個主題：${key}`);
  const mod = await import(`./levels/${levelId}/themes/${themeId}.js`);
  const theme = mod.default;
  cache.set(key, theme);
  return theme;
}

export async function loadStickers() {
  if (cache.has('stickers')) return cache.get('stickers');
  const mod = await import('./stickers.js');
  cache.set('stickers', mod.default);
  return mod.default;
}
