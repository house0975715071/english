// 6–9 歲｜吃飯時間（mealtime）
// 只放資料，不放程式邏輯。格式見 docs/content-schema.md，交稿前跑 node tools/lint-content.mjs mealtime
export default {
  id: 'mealtime',
  level: '6-9',
  zh: '吃飯時間',
  en: 'Mealtime',
  emoji: '🍜',

  // 12 個單字：由最具體可畫 → 最抽象
  words: [
    { id: '6-9.mealtime.word.1', en: 'rice', zh: '飯', emoji: '🍚', quizzable: true },
    { id: '6-9.mealtime.word.2', en: 'noodles', zh: '麵', emoji: '🍜', quizzable: true },
    { id: '6-9.mealtime.word.3', en: 'dumplings', zh: '水餃', emoji: '🥟', quizzable: true },
    { id: '6-9.mealtime.word.4', en: 'egg', zh: '蛋', emoji: '🥚', quizzable: true },
    { id: '6-9.mealtime.word.5', en: 'apple', zh: '蘋果', emoji: '🍎', quizzable: true },
    { id: '6-9.mealtime.word.6', en: 'carrot', zh: '紅蘿蔔', emoji: '🥕', quizzable: true },
    { id: '6-9.mealtime.word.7', en: 'soup', zh: '湯', emoji: '🥣', quizzable: true },
    { id: '6-9.mealtime.word.8', en: 'milk', zh: '牛奶', emoji: '🥛', quizzable: true },
    { id: '6-9.mealtime.word.9', en: 'water', zh: '水', emoji: '💧', quizzable: true },
    { id: '6-9.mealtime.word.10', en: 'chopsticks', zh: '筷子', emoji: '🥢', quizzable: true },
    { id: '6-9.mealtime.word.11', en: 'eat', zh: '吃', emoji: '🍽️', quizzable: false }, // 動詞，emoji 只是餐具 → 不當聽聽看選項
    { id: '6-9.mealtime.word.12', en: 'yummy', zh: '好吃', emoji: '😋', quizzable: false }, // 形容詞，emoji 只是表情 → 不當聽聽看選項
  ],

  // 8 句：第 1–4 句 2–4 個字，第 5–8 句 5–8 個字
  phrases: [
    {
      id: '6-9.mealtime.phrase.1',
      en: "Let's eat!",
      zh: '我們來吃飯吧！',
      emoji: '🍚🍜🥟',
      tokens: ["Let's", 'eat!'],
      keyWords: ['eat'],
      alsoAccept: ['eight'],
    },
    {
      id: '6-9.mealtime.phrase.2',
      en: "It's yummy!",
      zh: '好好吃！',
      emoji: '😋🍜',
      tokens: ["It's", 'yummy!'],
      keyWords: ['yummy'],
      alsoAccept: ['yami', 'yumi'],
    },
    {
      id: '6-9.mealtime.phrase.3',
      en: "I'm full.",
      zh: '我吃飽了。',
      emoji: '😌🍚',
      tokens: ["I'm", 'full.'],
      keyWords: ['full'],
      alsoAccept: ['fool', 'fall'],
    },
    {
      id: '6-9.mealtime.phrase.4',
      en: "I don't like carrots.",
      zh: '我不喜歡紅蘿蔔。',
      emoji: '🥕🙅',
      tokens: ['I', "don't", 'like', 'carrots.'],
      keyWords: ['like', 'carrots'],
      alsoAccept: ['carrot', 'parrots'],
    },
    {
      id: '6-9.mealtime.phrase.5',
      en: 'Can I have an apple, please?',
      zh: '可以給我一顆蘋果嗎？',
      emoji: '🍎🙏',
      tokens: ['Can', 'I', 'have', 'an', 'apple,', 'please?'],
      keyWords: ['apple', 'please'],
      alsoAccept: ['apples', 'able'],
    },
    {
      id: '6-9.mealtime.phrase.6',
      en: 'Can I have some water, please?',
      zh: '可以給我一杯水嗎？',
      emoji: '💧🙏',
      tokens: ['Can', 'I', 'have', 'some', 'water,', 'please?'],
      keyWords: ['water', 'please'],
      alsoAccept: ['walter', 'wader'],
    },
    {
      id: '6-9.mealtime.phrase.7',
      en: 'I want noodle soup, please.',
      zh: '我要吃湯麵。',
      emoji: '🍜🙏',
      tokens: ['I', 'want', 'noodle', 'soup,', 'please.'],
      keyWords: ['noodle', 'soup'],
      alsoAccept: ['noodles', 'soap'],
    },
    {
      id: '6-9.mealtime.phrase.8',
      en: 'Eat with your chopsticks, please.',
      zh: '用筷子吃飯。',
      emoji: '🥢🍚',
      tokens: ['Eat', 'with', 'your', 'chopsticks,', 'please.'],
      keyWords: ['chopsticks'],
      alsoAccept: ['chopstick', 'sticks'],
    },
  ],

  // 2 段對話：第 1 段在家（只用本主題單字＋第 1–5 句），第 2 段在外面（可用更前面主題的字）
  dialogues: [
    {
      id: '6-9.mealtime.dialogue.1',
      title_zh: '晚餐時間',
      scene_zh: '家裡的餐桌',
      roles: [
        { key: 'kid', emoji: '👧', name_en: 'Amy', name_zh: '小美', kid: true },
        { key: 'mom', emoji: '👩', name_en: 'Mom', name_zh: '媽媽' },
      ],
      lines: [
        { role: 'mom', en: "Let's eat!", zh: '我們來吃飯吧！' },
        { role: 'kid', en: 'Yay! I like dumplings!', zh: '耶！我喜歡水餃！' },
        { role: 'mom', en: 'Do you want more rice?', zh: '還要飯嗎？' },
        { role: 'kid', en: "No, thank you. I'm full.", zh: '不用了，謝謝。我吃飽了。' },
        { role: 'mom', en: 'Okay. Do you want some fruit?', zh: '好。那要吃水果嗎？' }, // 對方新字：fruit（水果）
        { role: 'kid', en: 'Can I have an apple, please?', zh: '可以給我一顆蘋果嗎？' },
        { role: 'mom', en: 'Here you are.', zh: '給你。' },
        { role: 'kid', en: "Thank you, Mom! It's yummy!", zh: '謝謝媽媽！好好吃！' },
      ],
    },
    {
      id: '6-9.mealtime.dialogue.2',
      title_zh: '早餐店買早餐',
      scene_zh: '早餐店，跟爸爸一起買早餐',
      roles: [
        { key: 'kid', emoji: '👧', name_en: 'Amy', name_zh: '小美', kid: true },
        { key: 'vendor', emoji: '🧑', name_en: 'Auntie', name_zh: '阿姨' },
      ],
      lines: [
        { role: 'vendor', en: 'Good morning! What do you want to eat?', zh: '早安！要吃什麼？' },
        { role: 'kid', en: 'Good morning! An egg pancake, please.', zh: '早安！我要一份蛋餅。' }, // egg pancake＝蛋餅（單字卡是 egg）
        { role: 'vendor', en: 'Okay. What do you want to drink?', zh: '好。要喝什麼？' }, // 對方新字：drink（喝）
        { role: 'kid', en: 'Milk, please.', zh: '我要牛奶。' },
        { role: 'vendor', en: 'An egg pancake and milk. Here you are.', zh: '蛋餅和牛奶，給你。' },
        { role: 'kid', en: 'Yummy! Thank you, Auntie!', zh: '看起來好好吃！謝謝阿姨！' },
      ],
    },
  ],
};
