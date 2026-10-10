// 6–9 歲｜主題 4：一天的作息（Daily Routine）
// 只有資料，沒有程式邏輯。交稿前：node tools/lint-content.mjs daily-routine
export default {
  id: 'daily-routine',
  level: '6-9',
  zh: '一天的作息',
  en: 'Daily Routine',
  emoji: '⏰',

  // 12 個單字：照一天的順序排，前面具體好畫，最後兩個最抽象
  words: [
    { id: '6-9.daily-routine.word.1', en: 'wake up', zh: '起床', emoji: '🌅', quizzable: true },
    { id: '6-9.daily-routine.word.2', en: 'get dressed', zh: '穿衣服', emoji: '👕', quizzable: true },
    { id: '6-9.daily-routine.word.3', en: 'eat breakfast', zh: '吃早餐', emoji: '🍳', quizzable: true },
    { id: '6-9.daily-routine.word.4', en: 'brush my teeth', zh: '刷牙', emoji: '🦷', quizzable: true },
    { id: '6-9.daily-routine.word.5', en: 'wash my hands', zh: '洗手', emoji: '🧼', quizzable: true },
    { id: '6-9.daily-routine.word.6', en: 'take a bath', zh: '洗澡', emoji: '🛁', quizzable: true },
    { id: '6-9.daily-routine.word.7', en: 'do homework', zh: '寫功課', emoji: '📝', quizzable: true },
    { id: '6-9.daily-routine.word.8', en: 'story', zh: '故事', emoji: '📖', quizzable: true },
    { id: '6-9.daily-routine.word.9', en: 'go to bed', zh: '上床睡覺', emoji: '🛏️', quizzable: true },
    { id: '6-9.daily-routine.word.10', en: 'sleepy', zh: '想睡覺', emoji: '😴', quizzable: true },
    { id: '6-9.daily-routine.word.11', en: 'hurry up', zh: '快一點', emoji: '🏃', quizzable: false }, // 🏃 畫的是跑步，之後「一起玩」的 run 也用它 → 不當選項
    { id: '6-9.daily-routine.word.12', en: 'late', zh: '遲到', emoji: '⏰', quizzable: false },
  ],

  // 8 句：1–4 句 2–4 個字，5–8 句 5–8 個字
  phrases: [
    {
      id: '6-9.daily-routine.phrase.1',
      en: 'Time to wake up!',
      zh: '該起床了！',
      emoji: '🌅⏰',
      tokens: ['Time', 'to', 'wake', 'up!'],
      keyWords: ['time', 'wake'],
      alsoAccept: ['wakeup', 'week', 'way'],
    },
    {
      id: '6-9.daily-routine.phrase.2',
      en: 'Five more minutes, please.',
      zh: '再五分鐘就好，拜託！',
      emoji: '🛌🙏',
      tokens: ['Five', 'more', 'minutes,', 'please.'],
      keyWords: ['five', 'minutes'],
      alsoAccept: ['fight', 'minis'],
    },
    {
      id: '6-9.daily-routine.phrase.3',
      en: "Hurry up, we're late!",
      zh: '快一點，要遲到了！',
      emoji: '🏃⏰',
      tokens: ['Hurry', 'up,', "we're", 'late!'],
      keyWords: ['hurry', 'late'],
      alsoAccept: ['hurryup', 'light', 'let'],
    },
    {
      id: '6-9.daily-routine.phrase.4',
      en: 'Good night, Mom.',
      zh: '媽媽，晚安。',
      emoji: '🌙👩',
      tokens: ['Good', 'night,', 'Mom.'],
      keyWords: ['night'],
      alsoAccept: ['nite', 'goodnight'],
    },
    {
      id: '6-9.daily-routine.phrase.5',
      en: 'Go wash your hands first.',
      zh: '先去洗手。',
      emoji: '🧼👐',
      tokens: ['Go', 'wash', 'your', 'hands', 'first.'],
      keyWords: ['wash', 'hands'],
      alsoAccept: ['watch', 'what', 'fast'],
    },
    {
      id: '6-9.daily-routine.phrase.6',
      en: 'Time to go to bed.',
      zh: '該睡覺了。',
      emoji: '🌙🛏️',
      tokens: ['Time', 'to', 'go', 'to', 'bed.'],
      keyWords: ['time', 'bed'],
      alsoAccept: ['bad', 'bet', 'bread', 'bid', 'but'],
    },
    {
      id: '6-9.daily-routine.phrase.7',
      en: 'Tell me a story, please.',
      zh: '講一個故事給我聽，拜託！',
      emoji: '📖🙏',
      tokens: ['Tell', 'me', 'a', 'story,', 'please.'],
      keyWords: ['story'],
      alsoAccept: ['sorry', 'stories', 'store'],
    },
    {
      id: '6-9.daily-routine.phrase.8',
      en: "Don't forget to brush your teeth.",
      zh: '不要忘記刷牙喔！',
      emoji: '🦷🌙',
      tokens: ["Don't", 'forget', 'to', 'brush', 'your', 'teeth.'],
      keyWords: ['brush', 'teeth'],
      alsoAccept: ['teach', 'tea', 'tease', 'brass'],
    },
  ],

  dialogues: [
    // 第 1 段：家裡，只用本主題的單字和第 1–5 句
    {
      id: '6-9.daily-routine.dialogue.1',
      title_zh: '早上趕著上學',
      scene_zh: '早上，家裡的房間',
      roles: [
        { key: 'kid', emoji: '👦', name_en: 'Ben', name_zh: '小斌', kid: true },
        { key: 'mom', emoji: '👩', name_en: 'Mom', name_zh: '媽媽' },
      ],
      lines: [
        { role: 'mom', en: 'Good morning! Time to wake up!', zh: '早安！該起床了！' },
        { role: 'kid', en: 'Five more minutes, please.', zh: '再五分鐘就好，拜託！' },
        { role: 'mom', en: "No! Hurry up, we're late! Get dressed.", zh: '不行！快一點，要遲到了！快去穿衣服！' },
        { role: 'kid', en: "All right, I'm getting dressed.", zh: '好啦，我在穿衣服了。' },
        { role: 'mom', en: 'Good. Go wash your hands first.', zh: '好。先去洗手。' },
        { role: 'kid', en: 'Okay! Can I eat breakfast now?', zh: '好！我現在可以吃早餐了嗎？' },
        { role: 'mom', en: 'Yes. Eat, then brush your teeth.', zh: '可以。吃完再去刷牙。' },
        { role: 'kid', en: 'Okay, Mom! Eat, then brush my teeth.', zh: '好，媽媽！吃完再刷牙。' },
      ],
    },
    // 第 2 段：外面（阿嬤家過夜），可以用前面主題學過的 Thank you
    {
      id: '6-9.daily-routine.dialogue.2',
      title_zh: '阿嬤家過夜',
      scene_zh: '晚上，阿嬤家',
      roles: [
        { key: 'kid', emoji: '👦', name_en: 'Ben', name_zh: '小斌', kid: true },
        { key: 'grandma', emoji: '👵', name_en: 'Grandma', name_zh: '阿嬤' },
      ],
      lines: [
        { role: 'grandma', en: "It's 8 o'clock. Time to take a bath.", zh: '八點了，該洗澡了。' }, // 不用 It's late：單字卡的 late 是「遲到」，避免同一個字兩個意思
        { role: 'kid', en: 'Okay, Grandma. Can I do my homework first?', zh: '好，阿嬤。我可以先寫功課嗎？' },
        { role: 'grandma', en: 'Yes. Do your homework, then take a bath.', zh: '好。寫完功課再洗澡。' },
        { role: 'kid', en: "I'm finished! I'm taking a bath now.", zh: '我寫完了！我現在去洗澡。' },
        { role: 'grandma', en: 'Good. Brush your teeth, then go to bed.', zh: '好。刷完牙就去睡覺。' },
        { role: 'kid', en: "I'm sleepy. Tell me a story, please.", zh: '我想睡覺了。講一個故事給我聽，拜託！' },
        { role: 'grandma', en: 'Okay. One story, then go to bed.', zh: '好。講一個故事就去睡覺。' },
        { role: 'kid', en: 'Thank you, Grandma. Good night!', zh: '謝謝阿嬤，晚安！' },
      ],
    },
  ],
};
