// 主題 6：家人與家裡（Family & Home）。只有資料，沒有程式邏輯。
// 檢查：node tools/lint-content.mjs family-and-home
export default {
  id: 'family-and-home',
  level: '6-9',
  zh: '家人與家裡',
  en: 'Family & Home',
  emoji: '🏠',

  // 單字 A（1–6）：家人；單字 B（7–12）：寶寶、家、房間、家人（最抽象的放最後）
  words: [
    // mom／dad 從第 1 主題起就一直是對話裡的角色（👩 媽媽、👨 爸爸），小孩早就認得；
    // 檢查器把 👩/👧、👨/👦 列為長得像，不能同時當聽聽看選項，所以把考題讓給新學的 brother／sister。
    { id: '6-9.family-and-home.word.1', en: 'mom', zh: '媽媽', emoji: '👩', quizzable: false },
    { id: '6-9.family-and-home.word.2', en: 'dad', zh: '爸爸', emoji: '👨', quizzable: false },
    { id: '6-9.family-and-home.word.3', en: 'grandma', zh: '阿嬤', emoji: '👵', quizzable: true },
    { id: '6-9.family-and-home.word.4', en: 'grandpa', zh: '阿公', emoji: '👴', quizzable: true },
    { id: '6-9.family-and-home.word.5', en: 'brother', zh: '哥哥、弟弟', emoji: '👦', quizzable: true },
    { id: '6-9.family-and-home.word.6', en: 'sister', zh: '姊姊、妹妹', emoji: '👧', quizzable: true },
    { id: '6-9.family-and-home.word.7', en: 'baby', zh: '寶寶', emoji: '👶', quizzable: true },
    { id: '6-9.family-and-home.word.8', en: 'home', zh: '家', emoji: '🏠', quizzable: true },
    { id: '6-9.family-and-home.word.9', en: 'room', zh: '房間', emoji: '🛏️', quizzable: true },
    { id: '6-9.family-and-home.word.10', en: 'kitchen', zh: '廚房', emoji: '🍳', quizzable: true },
    { id: '6-9.family-and-home.word.11', en: 'living room', zh: '客廳', emoji: '🛋️', quizzable: true },
    { id: '6-9.family-and-home.word.12', en: 'family', zh: '家人', emoji: '👪', quizzable: true },
  ],

  // 第 1–4 句 2–4 個字，第 5–8 句 5–8 個字。對話 1 只用到第 1、2 句。
  phrases: [
    {
      id: '6-9.family-and-home.phrase.1',
      en: "I'm home!",
      zh: '我回來了！',
      emoji: '🎒🏠',
      tokens: ["I'm", 'home!'],
      keyWords: ['home'],
      alsoAccept: ['own'],
    },
    {
      id: '6-9.family-and-home.phrase.2',
      en: "Where's Mom?",
      zh: '媽媽在哪裡？',
      emoji: '👩❓',
      tokens: ["Where's", 'Mom?'],
      keyWords: ['mom'],
      alsoAccept: ['mama'],
    },
    {
      id: '6-9.family-and-home.phrase.3',
      en: 'This is my grandma.',
      zh: '這是我阿嬤。',
      emoji: '📱👵',
      tokens: ['This', 'is', 'my', 'grandma.'],
      keyWords: ['grandma'],
      alsoAccept: ['grandmother', 'grammar'],
    },
    {
      id: '6-9.family-and-home.phrase.4',
      en: 'I love my family.',
      zh: '我愛我的家人。',
      emoji: '❤️👪',
      tokens: ['I', 'love', 'my', 'family.'],
      keyWords: ['love', 'family'],
      alsoAccept: ['families', 'laugh'],
    },
    {
      id: '6-9.family-and-home.phrase.5',
      en: 'I have a little brother.',
      zh: '我有一個弟弟。',
      emoji: '🙋👦',
      tokens: ['I', 'have', 'a', 'little', 'brother.'],
      keyWords: ['little', 'brother'],
      alsoAccept: ['bother', 'brothers', 'litter'],
    },
    {
      id: '6-9.family-and-home.phrase.6',
      en: 'Can I go to my room?',
      zh: '我可以回房間嗎？',
      emoji: '🚪🛏️',
      tokens: ['Can', 'I', 'go', 'to', 'my', 'room?'],
      keyWords: ['room'],
      alsoAccept: ['rum'],
    },
    {
      id: '6-9.family-and-home.phrase.7',
      en: "I'm in the living room!",
      zh: '我在客廳！',
      emoji: '🛋️📺',
      tokens: ["I'm", 'in', 'the', 'living', 'room!'],
      keyWords: ['living', 'room'],
      alsoAccept: ['leaving', 'rum'],
    },
    {
      id: '6-9.family-and-home.phrase.8',
      en: "Don't wake up the baby.",
      zh: '不要吵醒寶寶。',
      emoji: '🙅👶💤',
      tokens: ["Don't", 'wake', 'up', 'the', 'baby.'],
      keyWords: ['wake', 'baby'],
      alsoAccept: ['wait', 'maybe', 'babies'],
    },
  ],

  dialogues: [
    {
      // 放學回家：只用本主題單字＋第 1、2 句；「I'm hungry」是第 2、3 主題教過的句子，照場景簡報放進來。
      id: '6-9.family-and-home.dialogue.1',
      title_zh: '放學回家',
      scene_zh: '家裡，剛放學回來',
      roles: [
        { key: 'kid', emoji: '👦', name_en: 'Ben', name_zh: '小斌', kid: true },
        { key: 'dad', emoji: '👨', name_en: 'Dad', name_zh: '爸爸' },
      ],
      lines: [
        { role: 'kid', en: "I'm home!", zh: '我回來了！' },
        { role: 'dad', en: 'Welcome home!', zh: '回來啦！' },
        { role: 'kid', en: "Where's Mom?", zh: '媽媽在哪裡？' },
        { role: 'dad', en: "Mom's in the kitchen.", zh: '媽媽在廚房。' },
        { role: 'kid', en: "Dad, I'm hungry!", zh: '爸爸，我肚子餓了！' },
        { role: 'dad', en: 'Okay. Wash your hands first.', zh: '好，先去洗手。' },
        { role: 'kid', en: 'Okay, Dad!', zh: '好，爸爸！' },
      ],
    },
    {
      // 在公園給朋友看手機裡的全家福。對方帶進的新字只有 too（我也有）。
      id: '6-9.family-and-home.dialogue.2',
      title_zh: '我的全家福',
      scene_zh: '公園，看手機裡的全家福',
      roles: [
        { key: 'kid', emoji: '👦', name_en: 'Ben', name_zh: '小斌', kid: true },
        { key: 'friend', emoji: '👧', name_en: 'Amy', name_zh: '小美' },
      ],
      lines: [
        { role: 'kid', en: 'Hey! This is my family.', zh: '你看！這是我的家人。' },
        { role: 'friend', en: 'Is this your grandpa?', zh: '這是你阿公嗎？' },
        { role: 'kid', en: 'Yes! And this is my grandma.', zh: '對！這是我阿嬤。' },
        { role: 'friend', en: 'And this?', zh: '那這個呢？' },
        { role: 'kid', en: 'My sister and the baby!', zh: '我姊姊和小寶寶！' },
        { role: 'friend', en: 'I have a little brother, too!', zh: '我也有弟弟！' },
        { role: 'kid', en: "Where's your brother?", zh: '你弟弟在哪裡？' },
        { role: 'friend', en: "At home. Let's go home!", zh: '在家。我們回家吧！' },
      ],
    },
  ],
};
