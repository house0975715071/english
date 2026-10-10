// 天氣與穿衣｜6–9 歲 第 10 個主題。只放資料，不放程式邏輯。
// 交稿檢查：node tools/lint-content.mjs weather-and-clothes
export default {
  id: 'weather-and-clothes',
  level: '6-9',
  zh: '天氣與穿衣', en: 'Weather & Clothes', emoji: '☔',

  // 單字 12 個：先穿的（最具體），再天氣
  words: [
    { id: '6-9.weather-and-clothes.word.1', en: 'umbrella', zh: '雨傘', emoji: '☂️', quizzable: true }, // 撐開的傘，比收起來的 🌂 好認
    { id: '6-9.weather-and-clothes.word.2', en: 'jacket', zh: '外套', emoji: '🧥', quizzable: true },
    { id: '6-9.weather-and-clothes.word.3', en: 'shoes', zh: '鞋子', emoji: '👟', quizzable: true },
    { id: '6-9.weather-and-clothes.word.4', en: 'socks', zh: '襪子', emoji: '🧦', quizzable: true },
    { id: '6-9.weather-and-clothes.word.5', en: 'hat', zh: '帽子', emoji: '🧢', quizzable: true },
    { id: '6-9.weather-and-clothes.word.6', en: 'rain boots', zh: '雨鞋', emoji: '👢', quizzable: true },
    { id: '6-9.weather-and-clothes.word.7', en: 'sunny', zh: '出太陽', emoji: '☀️', quizzable: true },
    { id: '6-9.weather-and-clothes.word.8', en: 'rainy', zh: '下雨', emoji: '🌧️', quizzable: true },
    { id: '6-9.weather-and-clothes.word.9', en: 'windy', zh: '風好大', emoji: '🌬️', quizzable: true },
    { id: '6-9.weather-and-clothes.word.10', en: 'typhoon', zh: '颱風', emoji: '🌀', quizzable: true },
    { id: '6-9.weather-and-clothes.word.11', en: 'hot', zh: '熱', emoji: '🥵', quizzable: true },
    { id: '6-9.weather-and-clothes.word.12', en: 'cold', zh: '冷', emoji: '🥶', quizzable: true },
  ],

  // 句子 8 句：1–4 短（2–4 字），5–8 長（5–8 字）
  phrases: [
    {
      id: '6-9.weather-and-clothes.phrase.1',
      en: "Look! It's raining!",
      zh: '你看！下雨了！',
      emoji: '👀🌧️',
      tokens: ['Look!', "It's", 'raining!'],
      keyWords: ['raining'],
      alsoAccept: ['rainy', 'reigning'],
    },
    {
      id: '6-9.weather-and-clothes.phrase.2',
      en: 'Take your umbrella.',
      zh: '雨傘帶著。',
      emoji: '☂️🌧️',
      tokens: ['Take', 'your', 'umbrella.'],
      keyWords: ['take', 'umbrella'],
      alsoAccept: ['umbrellas'],
    },
    {
      id: '6-9.weather-and-clothes.phrase.3',
      en: 'Put on your jacket.',
      zh: '外套穿起來。',
      emoji: '🧥🥶',
      tokens: ['Put', 'on', 'your', 'jacket.'],
      keyWords: ['jacket'],
      alsoAccept: ['jackets'],
    },
    {
      id: '6-9.weather-and-clothes.phrase.4',
      en: "Where's my hat?",
      zh: '我的帽子在哪裡？',
      emoji: '🧢🔍',
      tokens: ["Where's", 'my', 'hat?'],
      keyWords: ['hat'],
      alsoAccept: ['hats', 'hot', 'had'],
    },
    {
      id: '6-9.weather-and-clothes.phrase.5',
      en: "I can't find my shoes.",
      zh: '我找不到鞋子。',
      emoji: '👟🤔',
      tokens: ['I', "can't", 'find', 'my', 'shoes.'],
      keyWords: ['find', 'shoes'],
      alsoAccept: ['shoe', 'shoot', 'choose'],
    },
    {
      id: '6-9.weather-and-clothes.phrase.6',
      en: "It's so hot and sunny today.",
      zh: '今天好熱，太陽好大！',
      emoji: '☀️🥵',
      tokens: ["It's", 'so', 'hot', 'and', 'sunny', 'today.'],
      keyWords: ['hot', 'sunny'],
      alsoAccept: ['sonny', 'funny'],
    },
    {
      id: '6-9.weather-and-clothes.phrase.7',
      en: 'Do we have school tomorrow?',
      zh: '明天要上學嗎？',
      emoji: '🏫🌀',
      tokens: ['Do', 'we', 'have', 'school', 'tomorrow?'],
      keyWords: ['school', 'tomorrow'],
      alsoAccept: ['schools', 'cool'],
    },
    {
      id: '6-9.weather-and-clothes.phrase.8',
      en: 'Put on your socks and shoes.',
      zh: '襪子鞋子穿好。',
      emoji: '🧦👟',
      tokens: ['Put', 'on', 'your', 'socks', 'and', 'shoes.'],
      keyWords: ['socks', 'shoes'],
      alsoAccept: ['sock', 'shoe', 'sox'],
    },
  ],

  dialogues: [
    {
      // 第 1 段：家裡門口，只用本主題單字與第 1–5 句（對方新字：door）
      id: '6-9.weather-and-clothes.dialogue.1',
      title_zh: '下雨天上學',
      scene_zh: '下雨的早上，家裡門口',
      roles: [
        { key: 'kid', emoji: '👦', name_en: 'Ben', name_zh: '小斌', kid: true },
        { key: 'mom', emoji: '👩', name_en: 'Mom', name_zh: '媽媽' },
      ],
      lines: [
        { role: 'mom', en: "It's raining! Take your umbrella.", zh: '下雨了！雨傘帶著。' },
        { role: 'kid', en: "Mom, I can't find my umbrella.", zh: '媽媽，我找不到雨傘。' },
        { role: 'mom', en: "It's by the door.", zh: '在門口啊。' },
        { role: 'kid', en: "I see it! Mom, I'm so cold.", zh: '看到了！媽媽，我好冷。' },
        { role: 'mom', en: 'Put on your jacket.', zh: '外套穿起來。' },
        { role: 'kid', en: 'Can I wear my rain boots, please?', zh: '我可以穿雨鞋嗎？' },
        { role: 'mom', en: "Okay! Let's go!", zh: '好！我們走吧！' },
      ],
    },
    {
      // 第 2 段：外面（便利商店門口），可用前面主題的字：hold my hand／noodles／home（對方新字：coming）
      id: '6-9.weather-and-clothes.dialogue.2',
      title_zh: '放颱風假',
      scene_zh: '颱風前的便利商店門口',
      roles: [
        { key: 'kid', emoji: '👦', name_en: 'Ben', name_zh: '小斌', kid: true },
        { key: 'dad', emoji: '👨', name_en: 'Dad', name_zh: '爸爸' },
      ],
      lines: [
        { role: 'kid', en: "Look! It's so windy!", zh: '你看！風好大！' },
        { role: 'dad', en: 'Yes. A typhoon is coming.', zh: '對啊，颱風要來了。' },
        { role: 'kid', en: 'Do we have school tomorrow?', zh: '明天要上學嗎？' },
        { role: 'dad', en: "No school tomorrow. It's a typhoon day.", zh: '明天不用上學，放颱風假。' },
        { role: 'kid', en: 'Yay! Typhoon day!', zh: '耶！放颱風假！' },
        { role: 'dad', en: "Let's take some noodles home.", zh: '我們帶麵回家吧！' }, // noodles 在吃飯主題固定翻「麵」，不寫泡麵
        { role: 'kid', en: "Oh no! It's raining too!", zh: '糟糕！還下雨了！' },
        { role: 'dad', en: "Okay, let's go home!", zh: '好，我們回家吧！' },
      ],
    },
  ],
};
