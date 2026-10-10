// 6–9 歲的畫面預設。以後別的年齡層可以有自己的一份，遊戲程式不用改。
export default {
  showZh: 'always',          // 中文一直顯示（'tap' = 點一下才看）
  optionsPerQuestion: 3,     // 聽聽看每題幾個選項（連續兩輪 3 星 → 4）
  pairsEasy: 3,              // 配對記憶：小一的板子幾對
  pairs: 6,                  // 配對記憶：小二以上幾對
  chooseThenSay: true,       // 角色扮演：先選再說（小一／小二預設開）
  speaking: 'auto',          // 語音辨識：auto＝有就用；'off'＝只用跟讀模式
  dailyReviewCap: 12,        // 複習一次最多幾題
  listenQuestions: 8,        // 聽聽看每輪幾題
  buildPhrases: 5,           // 排句子每輪幾句
  sayPhrases: 5,             // 開口說每輪幾句
  learnChunks: [             // 學一學分三段
    { id: 'words-a', zh: '單字 A', pick: { type: 'words', from: 0, to: 6 } },
    { id: 'words-b', zh: '單字 B', pick: { type: 'words', from: 6, to: 16 } },
    { id: 'phrases', zh: '句子', pick: { type: 'phrases', from: 0, to: 8 } },
  ],
  rate: { en: 0.9, zh: 0.95 },
  reviewIntervals: [1, 2, 4, 7, 16],   // Leitner 五個盒子的天數
};
