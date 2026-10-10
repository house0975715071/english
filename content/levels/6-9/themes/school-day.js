// 主題：上學去（School Day）｜6–9 歲
// 只有資料，沒有程式邏輯。格式見 docs/content-schema.md；交稿前跑 node tools/lint-content.mjs school-day
export default {
  id: 'school-day',
  level: '6-9',
  zh: '上學去',
  en: 'School Day',
  emoji: '🏫',

  // 由最具體可畫 → 最抽象
  words: [
    { id: '6-9.school-day.word.1', en: 'pencil', zh: '鉛筆', emoji: '✏️', quizzable: true },
    { id: '6-9.school-day.word.2', en: 'ruler', zh: '尺', emoji: '📏', quizzable: true },
    { id: '6-9.school-day.word.3', en: 'book', zh: '書', emoji: '📖', quizzable: true },
    { id: '6-9.school-day.word.4', en: 'backpack', zh: '書包', emoji: '🎒', quizzable: true },
    { id: '6-9.school-day.word.5', en: 'lunch box', zh: '便當', emoji: '🍱', quizzable: true },
    { id: '6-9.school-day.word.6', en: 'bathroom', zh: '廁所', emoji: '🚽', quizzable: true },
    { id: '6-9.school-day.word.7', en: 'school', zh: '學校', emoji: '🏫', quizzable: true },
    { id: '6-9.school-day.word.8', en: 'homework', zh: '功課', emoji: '📝', quizzable: true },
    // 📄 跟 📝 在 Windows 上都是一張白紙，不拿去當聽聽看的選項
    { id: '6-9.school-day.word.9', en: 'page', zh: '頁', emoji: '📄', quizzable: false },
    // 👩 只是一位女生，看不出是老師 → 不考
    { id: '6-9.school-day.word.10', en: 'teacher', zh: '老師', emoji: '👩', quizzable: false },
    { id: '6-9.school-day.word.11', en: 'finished', zh: '寫完了', emoji: '✅', quizzable: false },
    { id: '6-9.school-day.word.12', en: 'help', zh: '幫忙', emoji: '🙋', quizzable: false },
  ],

  // 第 1–4 句 2–4 個字，第 5–8 句 5–8 個字
  phrases: [
    {
      id: '6-9.school-day.phrase.1',
      en: "I'm finished.",
      zh: '我寫完了。',
      emoji: '✅📝',
      tokens: ["I'm", 'finished.'],
      keyWords: ['finished'],
      alsoAccept: ['finish', 'finnish'],
    },
    {
      id: '6-9.school-day.phrase.2',
      en: 'Open your book.',
      zh: '把書打開。',
      emoji: '📖👆',
      tokens: ['Open', 'your', 'book.'],
      keyWords: ['open', 'book'],
      alsoAccept: ['books'],
    },
    {
      id: '6-9.school-day.phrase.3',
      en: "Where's my backpack?",
      zh: '我的書包在哪裡？',
      emoji: '🎒❓',
      tokens: ["Where's", 'my', 'backpack?'],
      keyWords: ['backpack'],
      alsoAccept: ['back pack', 'backpacks'],
    },
    {
      id: '6-9.school-day.phrase.4',
      en: 'Time for school!',
      zh: '該上學了！',
      emoji: '⏰🏫',
      tokens: ['Time', 'for', 'school!'],
      keyWords: ['school'],
      alsoAccept: ['schools'],
    },
    {
      id: '6-9.school-day.phrase.5',
      en: 'May I go to the bathroom?',
      zh: '我可以去廁所嗎？',
      emoji: '🙋🚽',
      tokens: ['May', 'I', 'go', 'to', 'the', 'bathroom?'],
      keyWords: ['bathroom'],
      alsoAccept: ['bath room', 'bedroom', 'baffroom'],
    },
    {
      id: '6-9.school-day.phrase.6',
      en: 'Can I borrow your ruler, please?',
      zh: '你的尺可以借我嗎？',
      emoji: '📏🙏',
      tokens: ['Can', 'I', 'borrow', 'your', 'ruler,', 'please?'],
      keyWords: ['borrow', 'ruler'],
      alsoAccept: ['rule', 'roller', 'rulers', 'barrow'],
    },
    {
      id: '6-9.school-day.phrase.7',
      en: 'What page are we on?',
      zh: '現在第幾頁？',
      emoji: '📖🔢',
      tokens: ['What', 'page', 'are', 'we', 'on?'],
      keyWords: ['page'],
      alsoAccept: ['pages', 'paige'],
    },
    {
      id: '6-9.school-day.phrase.8',
      en: 'Can you help me, please?',
      zh: '可以幫我一下嗎？',
      emoji: '🙋🤔',
      tokens: ['Can', 'you', 'help', 'me,', 'please?'],
      keyWords: ['help'],
      alsoAccept: ['health', 'helped'],
    },
  ],

  dialogues: [
    {
      // 第 1 段：學校，只用本主題單字與第 1–5 句
      id: '6-9.school-day.dialogue.1',
      title_zh: '上英文課',
      scene_zh: '學校的英文課教室',
      roles: [
        { key: 'kid', emoji: '👧', name_en: 'Amy', name_zh: '小美', kid: true },
        { key: 'teacher', emoji: '👩', name_en: 'Ms. Lin', name_zh: '林老師' },
      ],
      lines: [
        { role: 'teacher', en: 'Good morning! Open your book.', zh: '早安！把書打開。' },
        { role: 'kid', en: 'Ms. Lin, may I go to the bathroom?', zh: '林老師，我可以去廁所嗎？' },
        { role: 'teacher', en: 'Yes. Be quick, please.', zh: '可以，快去快回。' },
        { role: 'kid', en: 'Thank you, Ms. Lin.', zh: '謝謝林老師。' },
        { role: 'teacher', en: 'Okay, now do this page.', zh: '好，現在寫這一頁。' },
        { role: 'kid', en: "Ms. Lin, I'm finished!", zh: '林老師，我寫完了！' },
        { role: 'teacher', en: 'Great! Time for lunch.', zh: '太棒了！該吃午餐了。' },
        { role: 'kid', en: 'Yay! I have my lunch box!', zh: '耶！我有帶便當！' },
      ],
    },
    {
      // 第 2 段：外面（阿嬤家），可用更前面主題的東西（一天的作息：do your homework）
      id: '6-9.school-day.dialogue.2',
      title_zh: '在阿嬤家寫功課',
      scene_zh: '放學後的阿嬤家',
      roles: [
        { key: 'kid', emoji: '👧', name_en: 'Amy', name_zh: '小美', kid: true },
        { key: 'grandma', emoji: '👵', name_en: 'Grandma', name_zh: '阿嬤' },
      ],
      lines: [
        { role: 'grandma', en: 'Time to do your homework.', zh: '該寫功課了。' },
        { role: 'kid', en: 'Okay. Can I borrow a pencil, please?', zh: '好。可以借我一支鉛筆嗎？' },
        { role: 'grandma', en: 'Sure. Here you are.', zh: '好啊，給你。' },
        { role: 'kid', en: 'Thank you, Grandma.', zh: '謝謝阿嬤。' },
        { role: 'grandma', en: 'Is your teacher nice?', zh: '你的老師好不好？' },
        { role: 'kid', en: 'Yes! I like my teacher.', zh: '對啊！我很喜歡老師。' },
        { role: 'grandma', en: 'Are you finished?', zh: '寫完了嗎？' },
        { role: 'kid', en: "Yes! Here's your pencil. Thank you!", zh: '寫完了！鉛筆還你，謝謝！' },
      ],
    },
  ],
};
