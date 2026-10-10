// 遊戲登記表：主題頁照這個順序畫六個按鈕；今日任務用 kind 判斷填哪個圈。
export const GAMES = [
  { id: 'learn-cards', zh: '學一學', emoji: '📖', desc: '看圖、聽英文、看中文', kind: 'learn', load: () => import('./learn-cards.js') },
  { id: 'listen-tap', zh: '聽聽看', emoji: '👂', desc: '聽英文，點對的圖', kind: 'learn', load: () => import('./listen-tap.js') },
  { id: 'match-pairs', zh: '配對記憶', emoji: '🃏', desc: '翻牌，圖配英文', kind: 'learn', load: () => import('./match-pairs.js') },
  { id: 'build-sentence', zh: '排句子', emoji: '🧩', desc: '把字排成一句話', kind: 'learn', load: () => import('./build-sentence.js') },
  { id: 'say-it', zh: '開口說', emoji: '🎤', desc: '聽一次，說一次', kind: 'speak', load: () => import('./say-it.js') },
  { id: 'role-play', zh: '角色扮演', emoji: '🎭', desc: '跟故事裡的人對話', kind: 'speak', load: () => import('./role-play.js') },
];

export const REVIEW = { id: 'review', zh: '複習', emoji: '🔁', desc: '今天該複習的', kind: 'review', load: () => import('./review.js') };

export const gameById = (id) => (id === 'review' ? REVIEW : GAMES.find((g) => g.id === id) || null);
