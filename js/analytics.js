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

export function buildRecommendations(knowledgeStats) {
  const weakAreas = Object.entries(knowledgeStats)
    .filter(([, value]) => value.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong);

  if (!weakAreas.length) {
    return ["表現優秀！建議可挑戰更高難度的史料判讀與比較題。"];
  }

  return weakAreas.map(([category, value]) => {
    const accuracy = Math.round((value.correct / value.total) * 100);
    return `【${category}】正確率 ${accuracy}%：建議回顧該主題核心事件、制度背景與時代脈絡。`;
  });
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
