const PERIOD_OPENING = {
  1: "你踏入秦漢時空裂縫，法令與鐵騎的壓迫迎面而來。",
  2: "你抵達唐宋都城，繁華市集下暗藏權力試煉。",
  3: "草原與海路交織的元明時代，新的對手現身。",
  4: "紫禁城陰影籠罩，你必須看穿清代權力脈絡。",
  5: "最終關卡開啟，所有時代的知識將在此匯流。"
};

const ANSWER_TRAIT = {
  A: "brave",
  B: "wise",
  C: "balanced",
  D: "cautious"
};

const CORRECT_LINES = {
  brave: "你果斷出手，歷史殘影被你一劍斬開。",
  wise: "你憑精準判斷洞悉史實，敵陣瞬間崩解。",
  balanced: "你穩住節奏，步步為營地瓦解敵方防線。",
  cautious: "你冷靜觀察後反擊，成功掌握戰場主導權。"
};

const WRONG_LINES = {
  brave: "你衝得太快，遭到敵軍伏擊。",
  wise: "你一時判讀失誤，讓敵人搶下先機。",
  balanced: "你的保守策略被敵人看穿，陷入苦戰。",
  cautious: "你猶豫片刻，敵方率先發動重擊。"
};

export function getLevelOpening(level) {
  return PERIOD_OPENING[level] || "新的歷史場景展開。";
}

export function getStoryAfterAnswer({ answer, isCorrect }) {
  const trait = ANSWER_TRAIT[answer] || "balanced";
  return isCorrect ? CORRECT_LINES[trait] : WRONG_LINES[trait];
}

export function updateBranchScore(branchScore, answer) {
  const trait = ANSWER_TRAIT[answer] || "balanced";
  const next = { ...branchScore };
  next[trait] += 1;
  return next;
}

export function decideEnding({ accuracy, playerHp, branchScore }) {
  if (playerHp <= 0) {
    return {
      key: "fail",
      title: "失敗結局：時空迷失",
      description: "你在歷史洪流中倒下，未能修復時空裂縫。請重整知識再戰。"
    };
  }

  const dominant = Object.entries(branchScore).sort((a, b) => b[1] - a[1])[0][0];

  if (accuracy >= 0.8 && playerHp >= 40) {
    return {
      key: "perfect",
      title: "完美結局：史官傳承者",
      description: `你以高正確率通關，並展現${dominant === "wise" ? "睿智" : "沉著"}決策，成功守護歷史真相。`
    };
  }

  return {
    key: "middle",
    title: "中等結局：歷史修補者",
    description: "你雖歷經波折，仍成功完成部分修復。再精進關鍵知識可達完美結局。"
  };
}
