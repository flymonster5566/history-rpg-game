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

const PERIOD_DATE_RANGES = {
  "秦漢時期": "西元前221年～西元220年",
  "唐宋時期": "618年～1279年",
  "元明時期": "1271年～1644年",
  "清代時期": "1644年～1912年",
  "綜合知識": "秦至清（西元前221年～1912年）"
};
const PERIOD_ORDER = ["秦漢時期", "唐宋時期", "元明時期", "清代時期", "綜合知識"];

function buildCategoryAction(category, value) {
  const drills = Math.max(4, value.wrong * 2);
  const templates = {
    "政治制度": `把本次答錯的制度整理成「目的→做法→影響」三欄表，今天內重讀一次，並完成 ${drills} 題制度判斷練習。`,
    "經濟文化": `回看課本中該時期經濟政策段落，畫出政策前後差異，再完成 ${drills} 題經濟文化題。`,
    "思想文化": `重讀思想主張與代表人物摘要，寫下 3 組「人物→主張→影響」配對，再完成 ${drills} 題概念題。`,
    "對外交流": `比較兩個朝代對外政策（開放/保守）差異，整理 3 點對照表，並完成 ${drills} 題交流題。`,
    "經濟發展": `重讀商業與貨幣演變段落，按時間排出關鍵名詞，再完成 ${drills} 題經濟發展題。`,
    "邊疆治理": `重讀邊疆治理機構與職責，整理「地區→官職/制度→目的」表格後，完成 ${drills} 題邊疆治理題。`,
    "對外政策": `把閉關與開放政策的背景、影響各寫 2 點，明天前完成 ${drills} 題對外政策練習。`,
    "制度比較": `選兩個朝代做制度比較（選官、中央與地方），列出至少 3 個異同，再完成 ${drills} 題比較題。`,
    "歷史理解": `重讀該章概念總結，寫出 5 句因果鏈（事件→原因→影響），再完成 ${drills} 題歷史理解題。`
  };

  return templates[category] || `重讀【${category}】概念摘要，整理關鍵名詞後，完成 ${drills} 題該類型練習。`;
}

export function buildRecommendations(knowledgeStats, wrongQuestions = []) {
  const weakAreas = Object.entries(knowledgeStats)
    .filter(([, value]) => value.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong);

  if (!weakAreas.length) {
    return [
      "本次全對：請在 15 分鐘內比較「秦漢 vs 唐宋」的選官制度，寫出 3 點差異，並自擬 3 題綜合題下次練習。"
    ];
  }

  const periodWrongCounts = wrongQuestions.reduce((acc, item) => {
    const key = item.period;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const weakestPeriod = Object.entries(periodWrongCounts).sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }
    return PERIOD_ORDER.indexOf(a[0]) - PERIOD_ORDER.indexOf(b[0]);
  })[0];

  const recommendations = [];
  if (weakestPeriod) {
    const [period, wrongCount] = weakestPeriod;
    const range = PERIOD_DATE_RANGES[period];
    const periodText = range ? `${period}（${range}）` : period;
    recommendations.push(`先花 15 分鐘重讀 ${periodText} 章節摘要，特別訂正你在此時期答錯的 ${wrongCount} 題。`);
  }

  weakAreas.slice(0, 3).forEach(([category, value]) => {
    const accuracy = Math.round((value.correct / value.total) * 100);
    recommendations.push(`【${category}】正確率 ${accuracy}%：${buildCategoryAction(category, value)}`);
  });

  return recommendations;
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
