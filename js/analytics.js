export function buildKnowledgeStats(answers) {
  const stats = {};

  answers.forEach((item) => {
    const key = item.category;
    if (!stats[key]) {
      stats[key] = { total: 0, correct: 0, wrong: 0 };
    }
    stats[key].total += 1;
    if (item.isCorrect) {
      stats[key].correct += 1;
    } else {
      stats[key].wrong += 1;
    }
  });

  return stats;
}

export function buildRecommendations({ knowledgeStats, wrongQuestions }) {
  const weakAreas = Object.entries(knowledgeStats)
    .filter(([, value]) => value.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong);

  if (!weakAreas.length) {
    return [
      "本次全對！請從第 1～5 關各挑 1 題重做，確認你能在不同朝代都穩定答對。",
      "接著做一張「秦漢→唐宋→元明→清代」時間軸，標上每關最重要的 2 個制度關鍵詞。"
    ];
  }

  const topWeakAreas = weakAreas.slice(0, 3).map(([category, value]) => {
    const relatedWrong = wrongQuestions.filter((item) => item.category === category);
    const periods = [...new Set(relatedWrong.map((item) => item.period))];
    const periodHint = periods.length ? `先複習 ${periods.join("、")} 的重點整理` : "先重讀課本該章節重點";
    return `【${category}】你錯了 ${value.wrong} 題：${periodHint}，再做 3 題同類題目，並把每題錯因寫成一句話。`;
  });

  const recommendations = [...topWeakAreas];
  const wrongPeriods = [...new Set(wrongQuestions.map((item) => item.period))];

  if (wrongPeriods.length >= 2) {
    recommendations.push(`跨朝代比較：請用 10 分鐘比較「${wrongPeriods[0]}」與「${wrongPeriods[1]}」在制度或對外政策上的差異，至少列出 2 點。`);
  }

  recommendations.push("最後重練本次全部錯題；若同一知識點再錯一次，立刻回頭重讀該段概念摘要後再作答。");

  return recommendations.slice(0, 5);
}

export function summarizeResult({ answers, wrongQuestions }) {
  const total = answers.length;
  const correct = answers.filter((item) => item.isCorrect).length;
  const accuracy = total ? correct / total : 0;

  return {
    total,
    correct,
    wrong: wrongQuestions.length,
    accuracy
  };
}
