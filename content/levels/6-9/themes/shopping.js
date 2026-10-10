// 買東西｜Shopping（6–9 歲）
// 只放資料，不放程式邏輯。格式見 docs/content-schema.md；交稿前跑 node tools/lint-content.mjs shopping
export default {
  id: 'shopping',
  level: '6-9',
  zh: '買東西',
  en: 'Shopping',
  emoji: '🏪',

  // 由「最具體可畫」排到「最抽象」：前 6 個是東西，後 6 個是買賣用的字塊
  words: [
    { id: '6-9.shopping.word.1', en: 'candy', zh: '糖果', emoji: '🍬', quizzable: true },
    { id: '6-9.shopping.word.2', en: 'toy', zh: '玩具', emoji: '🧸', quizzable: true },
    { id: '6-9.shopping.word.3', en: 'drink', zh: '飲料', emoji: '🥤', quizzable: true },
    { id: '6-9.shopping.word.4', en: 'bag', zh: '袋子', emoji: '🛍️', quizzable: true },
    { id: '6-9.shopping.word.5', en: 'wallet', zh: '錢包', emoji: '👛', quizzable: true },
    { id: '6-9.shopping.word.6', en: 'store', zh: '商店', emoji: '🏪', quizzable: true },
    { id: '6-9.shopping.word.7', en: 'money', zh: '錢', emoji: '💰', quizzable: true },
    { id: '6-9.shopping.word.8', en: 'dollars', zh: '塊錢', emoji: '💵', quizzable: false }, // 跟 money 💰 太像，不拿去當聽聽看選項
    { id: '6-9.shopping.word.9', en: 'buy', zh: '買', emoji: '🛒', quizzable: false },
    { id: '6-9.shopping.word.10', en: 'this one', zh: '這個', emoji: '👉', quizzable: false },
    { id: '6-9.shopping.word.11', en: 'how much', zh: '多少錢', emoji: '🏷️', quizzable: false },
    { id: '6-9.shopping.word.12', en: 'expensive', zh: '貴', emoji: '💸', quizzable: false },
  ],

  // 第 1–4 句 2–4 個字，第 5–8 句 5–8 個字
  phrases: [
    {
      id: '6-9.shopping.phrase.1',
      en: 'How much is this?',
      zh: '這個多少錢？',
      emoji: '🏷️❓',
      tokens: ['How', 'much', 'is', 'this?'],
      keyWords: ['much'],
      alsoAccept: ['match', 'mash'],
    },
    {
      id: '6-9.shopping.phrase.2',
      en: "It's too expensive.",
      zh: '太貴了。',
      emoji: '💸😮',
      tokens: ["It's", 'too', 'expensive.'],
      keyWords: ['expensive'],
      alsoAccept: ['expense', 'pensive'],
    },
    {
      id: '6-9.shopping.phrase.3',
      en: 'Here you are.',
      zh: '給你。',
      emoji: '👉💵',
      tokens: ['Here', 'you', 'are.'],
      keyWords: ['here'],
      alsoAccept: ['hair', 'her'],
    },
    {
      id: '6-9.shopping.phrase.4',
      en: "Where's my wallet?",
      zh: '我的錢包在哪裡？',
      emoji: '👛❓',
      tokens: ["Where's", 'my', 'wallet?'],
      keyWords: ['wallet'],
      alsoAccept: ['wall', 'valley', 'violet'],
    },
    {
      id: '6-9.shopping.phrase.5',
      en: 'I want this one, please.',
      zh: '我要這個，謝謝。',
      emoji: '👉🙏',
      tokens: ['I', 'want', 'this', 'one,', 'please.'],
      keyWords: ['want'],
      alsoAccept: ['what', 'swan'],
    },
    {
      id: '6-9.shopping.phrase.6',
      en: 'Can I buy a drink, please?',
      zh: '我可以買飲料嗎？',
      emoji: '🥤🙏',
      tokens: ['Can', 'I', 'buy', 'a', 'drink,', 'please?'],
      keyWords: ['drink'],
      alsoAccept: ['ring', 'think'],
    },
    {
      id: '6-9.shopping.phrase.7',
      en: "Let's go to the store!",
      zh: '我們去商店吧！',
      emoji: '🏪🚶',
      tokens: ["Let's", 'go', 'to', 'the', 'store!'],
      keyWords: ['store'],
      alsoAccept: ['star', 'stall'],
    },
    {
      id: '6-9.shopping.phrase.8',
      en: "I don't need a bag, thank you.",
      zh: '我不用袋子，謝謝。',
      emoji: '🛍️🙅',
      tokens: ['I', "don't", 'need', 'a', 'bag,', 'thank', 'you.'],
      keyWords: ['need', 'bag'],
      alsoAccept: ['back', 'bad', 'beg', 'big', 'bug', 'bat', 'knee'],
    },
  ],

  dialogues: [
    {
      // 第 1 段：在家裡，只用本主題單字和第 1–5 句。小美當客人、爸爸當老闆玩開商店。
      id: '6-9.shopping.dialogue.1',
      title_zh: '跟爸爸玩開店',
      scene_zh: '家裡的客廳，玩開商店遊戲',
      roles: [
        { key: 'kid', emoji: '👧', name_en: 'Amy', name_zh: '小美', kid: true },
        { key: 'dad', emoji: '👨', name_en: 'Dad', name_zh: '爸爸' },
      ],
      lines: [
        { role: 'dad', en: 'Welcome to my store!', zh: '歡迎光臨我的商店！' },
        { role: 'kid', en: 'How much is this toy?', zh: '這個玩具多少錢？' },
        { role: 'dad', en: 'Ten dollars.', zh: '十塊。' },
        { role: 'kid', en: "It's too expensive!", zh: '太貴了！' },
        { role: 'dad', en: 'This one is five dollars.', zh: '這個五塊。' }, // 不示範殺價：太貴就換一個便宜的
        { role: 'kid', en: 'I want this one, please.', zh: '我要這個，謝謝。' },
        { role: 'dad', en: 'Okay! Here you are.', zh: '好！給你。' },
        { role: 'kid', en: "Here's my money. Thank you, Dad!", zh: '錢給你，謝謝爸爸！' },
      ],
    },
    {
      // 第 2 段：在外面（便利商店）。對方只帶進一個新字 change（從中文「找你的錢」看得懂）。
      id: '6-9.shopping.dialogue.2',
      title_zh: '去便利商店買糖果',
      scene_zh: '家樓下的便利商店',
      roles: [
        { key: 'kid', emoji: '👧', name_en: 'Amy', name_zh: '小美', kid: true },
        { key: 'clerk', emoji: '🧑', name_en: 'Clerk', name_zh: '店員' },
      ],
      lines: [
        { role: 'kid', en: 'Excuse me. How much is this candy?', zh: '不好意思，這個糖果多少錢？' },
        { role: 'clerk', en: 'This one? Five dollars.', zh: '這個嗎？五塊。' },
        { role: 'kid', en: 'Okay. This one, please.', zh: '好，我要這個。' },
        { role: 'clerk', en: 'Do you need a bag?', zh: '需要袋子嗎？' },
        { role: 'kid', en: "I don't need a bag, thank you.", zh: '我不用袋子，謝謝。' },
        { role: 'clerk', en: 'Okay. Five dollars, please.', zh: '好，總共五塊。' },
        { role: 'kid', en: 'Here you are. Thank you!', zh: '給你，謝謝！' },
        { role: 'clerk', en: "Here's your change. Goodbye!", zh: '這是找你的錢，再見！' },
      ],
    },
  ],
};
