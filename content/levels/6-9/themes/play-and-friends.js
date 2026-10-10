// 主題 8：一起玩（Play & Friends）｜6–9 歲
// 公園、客廳、下課：跟朋友搶著玩的時候真的會講的話——加入遊戲、輪流、等等我。
// 單字從最具體（球、拼圖）排到最抽象（一起、好玩）；抽象詞 quizzable:false，不會進聽聽看當選項。
export default {
  id: 'play-and-friends',
  level: '6-9',
  zh: '一起玩',
  en: 'Play & Friends',
  emoji: '⚽',

  words: [
    { id: '6-9.play-and-friends.word.1', en: 'ball', zh: '球', emoji: '⚽', quizzable: true },
    { id: '6-9.play-and-friends.word.2', en: 'puzzle', zh: '拼圖', emoji: '🧩', quizzable: true },
    { id: '6-9.play-and-friends.word.3', en: 'game', zh: '遊戲', emoji: '🎲', quizzable: true },
    { id: '6-9.play-and-friends.word.4', en: 'draw', zh: '畫畫', emoji: '🎨', quizzable: true },
    { id: '6-9.play-and-friends.word.5', en: 'hide-and-seek', zh: '躲貓貓', emoji: '🙈', quizzable: true },
    { id: '6-9.play-and-friends.word.6', en: 'run', zh: '跑', emoji: '🏃', quizzable: true },
    { id: '6-9.play-and-friends.word.7', en: 'jump', zh: '跳', emoji: '🦘', quizzable: false },
    { id: '6-9.play-and-friends.word.8', en: 'win', zh: '贏', emoji: '🏆', quizzable: true },
    { id: '6-9.play-and-friends.word.9', en: 'play', zh: '玩', emoji: '🎠', quizzable: false },
    { id: '6-9.play-and-friends.word.10', en: 'turn', zh: '輪流', emoji: '👉', quizzable: false },
    { id: '6-9.play-and-friends.word.11', en: 'together', zh: '一起', emoji: '🤝', quizzable: false },
    { id: '6-9.play-and-friends.word.12', en: 'fun', zh: '好玩', emoji: '😄', quizzable: false },
  ],

  phrases: [
    {
      id: '6-9.play-and-friends.phrase.1',
      en: "Let's play!",
      zh: '我們來玩吧！',
      emoji: '⚽🎲',
      tokens: ["Let's", 'play!'],
      keyWords: ['play'],
      alsoAccept: ['pray', 'played', 'plate'],
    },
    {
      id: '6-9.play-and-friends.phrase.2',
      en: "It's my turn.",
      zh: '換我了。',
      emoji: '🙋👉',
      tokens: ["It's", 'my', 'turn.'],
      keyWords: ['turn'],
      alsoAccept: ['ten', 'torn', 'turned', 'turns'],
    },
    {
      id: '6-9.play-and-friends.phrase.3',
      en: 'Wait for me!',
      zh: '等等我！',
      emoji: '✋🏃',
      tokens: ['Wait', 'for', 'me!'],
      keyWords: ['wait'],
      alsoAccept: ['weight', 'white', 'wet', 'way'],
    },
    {
      id: '6-9.play-and-friends.phrase.4',
      en: 'I can jump high!',
      zh: '我會跳很高！',
      emoji: '🦘⬆️',
      tokens: ['I', 'can', 'jump', 'high!'],
      keyWords: ['jump', 'high'],
      alsoAccept: ['junk', 'jumped', 'chump'],
    },
    {
      id: '6-9.play-and-friends.phrase.5',
      en: 'Can I play too, please?',
      zh: '我也可以玩嗎？',
      emoji: '⚽🙏',
      tokens: ['Can', 'I', 'play', 'too,', 'please?'],
      keyWords: ['play', 'please'],
      alsoAccept: ['pray', 'plate', 'police', 'pleas'],
    },
    {
      id: '6-9.play-and-friends.phrase.6',
      en: "Let's take turns with the ball.",
      zh: '我們輪流玩球吧！',
      emoji: '⚽🔄',
      tokens: ["Let's", 'take', 'turns', 'with', 'the', 'ball.'],
      keyWords: ['turns', 'ball'],
      alsoAccept: ['terms', 'turn', 'bowl', 'bull', 'paul'],
    },
    {
      id: '6-9.play-and-friends.phrase.7',
      en: 'Do you want to play hide-and-seek?',
      zh: '要不要玩躲貓貓？',
      emoji: '🙈🌳',
      tokens: ['Do', 'you', 'want', 'to', 'play', 'hide-and-seek?'],
      keyWords: ['hide', 'seek'],
      alsoAccept: ['hiding', 'hike', 'sick', 'seat', 'cheek'],
    },
    {
      id: '6-9.play-and-friends.phrase.8',
      en: "Let's do the puzzle together.",
      zh: '我們一起拼拼圖吧！',
      emoji: '🧩🤝',
      tokens: ["Let's", 'do', 'the', 'puzzle', 'together.'],
      keyWords: ['puzzle', 'together'],
      alsoAccept: ['muscle', 'puzzles', 'puddle', 'forever'],
    },
  ],

  dialogues: [
    {
      // 第 1 段：家裡，只用本主題單字＋第 1–5 句。下雨不能出門，媽媽陪玩桌遊，講好誰先。
      id: '6-9.play-and-friends.dialogue.1',
      title_zh: '下雨天在家玩',
      scene_zh: '下雨的下午，家裡客廳',
      roles: [
        { key: 'kid', emoji: '👦', name_en: 'Ben', name_zh: '小斌', kid: true },
        { key: 'mom', emoji: '👩', name_en: 'Mom', name_zh: '媽媽' },
      ],
      lines: [
        { role: 'kid', en: "Mom, let's play!", zh: '媽媽，我們來玩吧！' },
        { role: 'mom', en: 'Sure! Do you want to draw?', zh: '好啊！要不要畫畫？' },
        { role: 'kid', en: 'No, I want to play a game.', zh: '不要，我想玩遊戲。' },
        { role: 'mom', en: "Okay! Let's take turns.", zh: '好！我們輪流吧！' },
        { role: 'kid', en: 'Can I play first, please?', zh: '我可以先玩嗎？' },
        { role: 'mom', en: "Sure! Then it's my turn.", zh: '好啊！然後換我。' },
        { role: 'kid', en: 'Yay! This is so fun!', zh: '耶！好好玩！' },
        { role: 'mom', en: "Okay, you win! Let's draw now.", zh: '好，你贏了！現在來畫畫吧！' },
      ],
    },
    {
      // 第 2 段：公園，可以用前面主題的東西（Hi、Thank you、one、Here you are）。
      // 只有一顆球 → 小孩自己提議輪流 → 球滾走了兩個人追。
      id: '6-9.play-and-friends.dialogue.2',
      title_zh: '公園玩球',
      scene_zh: '公園的草地上',
      roles: [
        { key: 'kid', emoji: '👦', name_en: 'Ben', name_zh: '小斌', kid: true },
        { key: 'friend', emoji: '👧', name_en: 'Amy', name_zh: '小美' },
      ],
      lines: [
        { role: 'kid', en: 'Hi! Can I play too, please?', zh: '你好！我也可以玩嗎？' },
        { role: 'friend', en: 'Sure! But we have one ball.', zh: '好啊！可是只有一顆球。' },
        { role: 'kid', en: "Let's take turns!", zh: '我們輪流吧！' },
        { role: 'friend', en: 'Okay! You go first.', zh: '好！你先。' },
        { role: 'kid', en: "Thank you! Let's play together!", zh: '謝謝！我們一起玩吧！' },
        { role: 'friend', en: 'Oh no! The ball! Run!', zh: '啊！球跑掉了！快跑！' },
        { role: 'kid', en: 'Wait for me!', zh: '等等我！' },
        { role: 'friend', en: 'Here you are! Your turn!', zh: '給你！換你了！' },
      ],
    },
  ],
};
