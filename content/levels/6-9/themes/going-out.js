// 主題 9／13：出門與交通。只有資料，沒有程式邏輯。規格見 docs/content-schema.md。
export default {
  id: 'going-out',
  level: '6-9',
  zh: '出門與交通',
  en: 'Going Out & Transport',
  emoji: '🚌',

  // 單字 A（1–6）：交通工具；單字 B（7–12）：安全裝備與路上的口令。由最具體排到最抽象。
  words: [
    { id: '6-9.going-out.word.1', en: 'bus', zh: '公車', emoji: '🚌', quizzable: true },
    { id: '6-9.going-out.word.2', en: 'MRT', zh: '捷運', emoji: '🚇', quizzable: true, ttsOverride: 'M R T' },
    { id: '6-9.going-out.word.3', en: 'train', zh: '火車', emoji: '🚂', quizzable: true },
    { id: '6-9.going-out.word.4', en: 'car', zh: '汽車', emoji: '🚗', quizzable: true },
    { id: '6-9.going-out.word.5', en: 'scooter', zh: '機車', emoji: '🛵', quizzable: true },
    { id: '6-9.going-out.word.6', en: 'bike', zh: '腳踏車', emoji: '🚲', quizzable: true },
    { id: '6-9.going-out.word.7', en: 'helmet', zh: '安全帽', emoji: '⛑️', quizzable: true },
    { id: '6-9.going-out.word.8', en: 'seat belt', zh: '安全帶', emoji: '💺', quizzable: false },
    { id: '6-9.going-out.word.9', en: 'red light', zh: '紅燈', emoji: '🚦', quizzable: true },
    { id: '6-9.going-out.word.10', en: 'stop', zh: '停', emoji: '🛑', quizzable: false }, // 跟紅燈 🚦 都是「紅色的停」，一起當選項會混
    { id: '6-9.going-out.word.11', en: 'go', zh: '走', emoji: '🚶', quizzable: false },
    { id: '6-9.going-out.word.12', en: 'wait', zh: '等一下', emoji: '⏳', quizzable: false },
  ],

  // 第 1–4 句 2–4 個字，第 5–8 句 5–8 個字。小孩真的會說的話，或爸媽在路上對他說的口令。
  phrases: [
    {
      id: '6-9.going-out.phrase.1',
      en: "Let's go!",
      zh: '我們走吧！',
      emoji: '🚶💨',
      tokens: ["Let's", 'go!'],
      keyWords: ['let'],
      alsoAccept: ['lets go', 'let go', 'legs go', 'less go'],
    },
    {
      id: '6-9.going-out.phrase.2',
      en: 'Hold my hand.',
      zh: '牽我的手。',
      emoji: '👩✋👧',
      tokens: ['Hold', 'my', 'hand.'],
      keyWords: ['hold', 'hand'],
      alsoAccept: ['whole', 'hands', 'old my hand'],
    },
    {
      id: '6-9.going-out.phrase.3',
      en: 'Stop! Red light.',
      zh: '停！紅燈！',
      emoji: '🛑🚦',
      tokens: ['Stop!', 'Red', 'light.'],
      keyWords: ['stop', 'light'],
      alsoAccept: ['stock', 'top', 'lights', 'red lights'],
    },
    {
      id: '6-9.going-out.phrase.4',
      en: 'Are we there yet?',
      zh: '到了沒？',
      emoji: '🚗🤔',
      tokens: ['Are', 'we', 'there', 'yet?'],
      keyWords: ['there', 'yet'],
      alsoAccept: ['their', "they're", 'are we they yet'],
    },
    {
      id: '6-9.going-out.phrase.5',
      en: 'Wait for the green light.',
      zh: '等綠燈再走。',
      emoji: '⏳🚦',
      tokens: ['Wait', 'for', 'the', 'green', 'light.'],
      keyWords: ['wait', 'green'],
      alsoAccept: ['weight', 'white', 'greenlight', 'green lights'],
    },
    {
      id: '6-9.going-out.phrase.6',
      en: 'Put on your seat belt.',
      zh: '安全帶繫好。',
      emoji: '🚗💺',
      tokens: ['Put', 'on', 'your', 'seat', 'belt.'],
      keyWords: ['seat', 'belt'],
      alsoAccept: ['seatbelt', 'sit belt', 'see belt', 'seat built'],
    },
    {
      id: '6-9.going-out.phrase.7',
      en: 'Can we take the MRT?',
      zh: '我們可以搭捷運嗎？',
      emoji: '🚇🙋',
      tokens: ['Can', 'we', 'take', 'the', 'MRT?'],
      keyWords: ['take', 'mrt'],
      alsoAccept: ['m r t', 'empty', 'em are tea'],
      ttsOverride: 'Can we take the M R T?',
    },
    {
      id: '6-9.going-out.phrase.8',
      en: 'Mom, the bus is here!',
      zh: '媽媽，公車來了！',
      emoji: '👩🚌',
      tokens: ['Mom,', 'the', 'bus', 'is', 'here!'],
      keyWords: ['bus', 'here'],
      alsoAccept: ['buzz', 'boss', 'bust', 'mum the bus is here'],
    },
  ],

  dialogues: [
    // 第 1 段：家裡門口，早上要出門上學（只用本主題的單字＋第 1–5 句）。
    {
      id: '6-9.going-out.dialogue.1',
      title_zh: '騎機車上學',
      scene_zh: '早上，家裡門口',
      roles: [
        { key: 'kid', emoji: '👧', name_en: 'Amy', name_zh: '小美', kid: true },
        { key: 'dad', emoji: '👨', name_en: 'Dad', name_zh: '爸爸' },
      ],
      lines: [
        { role: 'dad', en: 'Time to go to school!', zh: '該去上學了！' },
        { role: 'kid', en: 'Can I ride my bike?', zh: '我可以騎腳踏車去嗎？' },
        { role: 'dad', en: "No. Let's take the scooter.", zh: '不行，我們騎機車去吧！' },
        { role: 'kid', en: "Okay. Where's my helmet?", zh: '好，我的安全帽在哪裡？' },
        { role: 'dad', en: 'Here you are. Put it on.', zh: '給你，戴好。' },
        { role: 'kid', en: "Thank you! Let's go!", zh: '謝謝！我們走吧！' },
        { role: 'dad', en: 'Stop! Wait for me.', zh: '停！等等我。' },
        { role: 'kid', en: 'Okay! Go, go, go!', zh: '好！走走走！' },
      ],
    },
    // 第 2 段：外面——過馬路（這個主題最重要的安全口令：stop／wait／hold my hand 都在這裡用到）。
    {
      id: '6-9.going-out.dialogue.2',
      title_zh: '過馬路去搭火車',
      scene_zh: '火車站前的路口',
      roles: [
        { key: 'kid', emoji: '👧', name_en: 'Amy', name_zh: '小美', kid: true },
        { key: 'mom', emoji: '👩', name_en: 'Mom', name_zh: '媽媽' },
      ],
      lines: [
        { role: 'kid', en: "Mom, let's go!", zh: '媽媽，我們走吧！' },
        { role: 'mom', en: 'Stop! Red light.', zh: '停！紅燈！' },
        { role: 'kid', en: 'Can we go now?', zh: '現在可以走了嗎？' },
        { role: 'mom', en: 'No. A car! Wait for the green light.', zh: '不行，有車！等綠燈再走。' },
        { role: 'kid', en: "Green light! Let's go!", zh: '綠燈了！我們走吧！' },
        { role: 'mom', en: 'Wait. Hold my hand.', zh: '等一下，牽我的手。' },
        { role: 'kid', en: "Okay! Where's the train?", zh: '好！火車在哪裡？' },
        { role: 'mom', en: 'Okay! The train is here!', zh: '好！火車來了！' },
      ],
    },
  ],
};
