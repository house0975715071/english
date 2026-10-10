// 主題 2：心情與身體（6–9 歲）。只有資料，沒有程式邏輯。
// 交稿檢查：node tools/lint-content.mjs feelings-and-body
export default {
  id: 'feelings-and-body',
  level: '6-9',
  zh: '心情與身體',
  en: 'Feelings & Body',
  emoji: '😊',

  // 單字 A（1–6）＝心情；單字 B（7–12）＝身體與求助。由最具體排到最抽象。
  words: [
    { id: '6-9.feelings-and-body.word.1', en: 'happy', zh: '開心', emoji: '😄', quizzable: true },
    { id: '6-9.feelings-and-body.word.2', en: 'sad', zh: '難過', emoji: '😢', quizzable: true },
    { id: '6-9.feelings-and-body.word.3', en: 'tired', zh: '累', emoji: '😴', quizzable: true },
    { id: '6-9.feelings-and-body.word.4', en: 'scared', zh: '害怕', emoji: '😨', quizzable: true },
    { id: '6-9.feelings-and-body.word.5', en: 'hungry', zh: '肚子餓', emoji: '😋', quizzable: true },
    { id: '6-9.feelings-and-body.word.6', en: 'thirsty', zh: '口渴', emoji: '🥤', quizzable: true },
    { id: '6-9.feelings-and-body.word.7', en: 'sick', zh: '生病', emoji: '🤒', quizzable: true },
    { id: '6-9.feelings-and-body.word.8', en: 'hurt', zh: '痛', emoji: '🤕', quizzable: true },
    { id: '6-9.feelings-and-body.word.9', en: 'rest', zh: '休息', emoji: '🛌', quizzable: false },
    { id: '6-9.feelings-and-body.word.10', en: 'help', zh: '幫忙', emoji: '🙋', quizzable: false },
    { id: '6-9.feelings-and-body.word.11', en: 'okay', zh: '好', emoji: '👌', quizzable: false },
    { id: '6-9.feelings-and-body.word.12', en: 'understand', zh: '懂', emoji: '💡', quizzable: false },
  ],

  // 第 1–4 句 2–4 個字，第 5–8 句 5–8 個字。對話 1 只用第 1–5 句。
  phrases: [
    {
      id: '6-9.feelings-and-body.phrase.1',
      en: "I'm tired.",
      zh: '我好累。',
      emoji: '😴',
      tokens: ["I'm", 'tired.'],
      keyWords: ['tired'],
      alsoAccept: ['tide', 'tight'],
    },
    {
      id: '6-9.feelings-and-body.phrase.2',
      en: 'Are you okay?',
      zh: '你還好嗎？',
      emoji: '😟❓',
      tokens: ['Are', 'you', 'okay?'],
      keyWords: ['okay'],
      alsoAccept: ['ok', 'kay'],
    },
    {
      id: '6-9.feelings-and-body.phrase.3',
      en: 'My tummy hurts.',
      zh: '我肚子痛。',
      emoji: '🤢',
      tokens: ['My', 'tummy', 'hurts.'],
      keyWords: ['tummy', 'hurts'],
      alsoAccept: ['tommy', 'dummy'],
    },
    {
      id: '6-9.feelings-and-body.phrase.4',
      en: "I don't understand.",
      zh: '我聽不懂。',
      emoji: '🤔❓',
      tokens: ['I', "don't", 'understand.'],
      keyWords: ['understand'],
      alsoAccept: ['understood', 'understanding'],
    },
    {
      id: '6-9.feelings-and-body.phrase.5',
      en: 'Say it again slowly, please.',
      zh: '請再慢慢說一次。',
      emoji: '🔁🐢🙏',
      tokens: ['Say', 'it', 'again', 'slowly,', 'please.'],
      keyWords: ['again', 'slowly'],
      alsoAccept: ['slow'],
    },
    {
      id: '6-9.feelings-and-body.phrase.6',
      en: 'I need some help, please.',
      zh: '請幫我一下。',
      emoji: '🙋🙏',
      tokens: ['I', 'need', 'some', 'help,', 'please.'],
      keyWords: ['need', 'help'],
      alsoAccept: ['held', 'health', 'knee'],
    },
    {
      id: '6-9.feelings-and-body.phrase.7',
      en: "Mom, I'm hungry and thirsty.",
      zh: '媽媽，我又餓又渴。',
      emoji: '👩😋🥤',
      tokens: ['Mom,', "I'm", 'hungry', 'and', 'thirsty.'],
      keyWords: ['hungry', 'thirsty'],
      alsoAccept: ['hungary', 'thursday'],
    },
    {
      id: '6-9.feelings-and-body.phrase.8',
      en: "I'm scared of the dark.",
      zh: '我怕黑。',
      emoji: '😨🌙',
      tokens: ["I'm", 'scared', 'of', 'the', 'dark.'],
      keyWords: ['scared', 'dark'],
      alsoAccept: ['scary', 'duck'],
    },
  ],

  dialogues: [
    {
      // 學校：英文課聽不懂，請林老師再慢慢說一次。只用本主題單字與第 1–5 句。
      id: '6-9.feelings-and-body.dialogue.1',
      title_zh: '英文課聽不懂',
      scene_zh: '學校的英文教室',
      roles: [
        { key: 'kid', emoji: '👦', name_en: 'Ben', name_zh: '小斌', kid: true },
        { key: 'teacher', emoji: '👩', name_en: 'Ms. Lin', name_zh: '林老師' },
      ],
      lines: [
        { role: 'teacher', en: 'Good morning! Show me a sad face.', zh: '早安！做一個難過的表情。' },
        { role: 'kid', en: "Ms. Lin, I don't understand.", zh: '林老師，我聽不懂。' },
        { role: 'teacher', en: "It's okay.", zh: '沒關係。' },
        { role: 'kid', en: 'Say it again slowly, please.', zh: '請再慢慢說一次。' },
        { role: 'teacher', en: 'Okay, slowly. Show me a sad face.', zh: '好，慢慢說。做一個難過的表情。' },
        { role: 'kid', en: 'Oh, I understand!', zh: '喔，我懂了！' },
        { role: 'teacher', en: 'Good! Now a happy face!', zh: '很好！現在換開心的表情！' },
        { role: 'kid', en: "Okay! I'm happy!", zh: '好！我好開心！' },
      ],
    },
    {
      // 外面：放學後到阿嬤家，又累又餓、頭有點痛，先休息。可用前一個主題（打招呼）的 Hello／Thank you。
      id: '6-9.feelings-and-body.dialogue.2',
      title_zh: '放學去阿嬤家',
      scene_zh: '阿嬤家的客廳',
      roles: [
        { key: 'kid', emoji: '👦', name_en: 'Ben', name_zh: '小斌', kid: true },
        { key: 'grandma', emoji: '👵', name_en: 'Grandma', name_zh: '阿嬤' },
      ],
      lines: [
        { role: 'grandma', en: 'Hello! Are you hungry?', zh: '你來啦！肚子餓不餓？' },
        { role: 'kid', en: "Yes, Grandma. I'm tired and hungry.", zh: '對，阿嬤，我好累，肚子也好餓。' },
        { role: 'grandma', en: 'Are you okay?', zh: '你還好嗎？' },
        { role: 'kid', en: 'My head hurts a little.', zh: '我頭有點痛。' },
        { role: 'grandma', en: 'Oh no. Are you sick?', zh: '哎呀，是不是生病了？' },
        { role: 'kid', en: 'No. Can I rest first, please?', zh: '沒有啦。我可以先休息嗎？' },
        { role: 'grandma', en: 'Okay. Rest first.', zh: '好，先休息。' },
        { role: 'kid', en: 'Thank you, Grandma.', zh: '謝謝阿嬤。' },
      ],
    },
  ],
};
