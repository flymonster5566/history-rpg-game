const ACTION_GUIDE = {
  政治制度: {
    events: "秦始皇推行郡縣制、隋唐三省六部、明太祖廢丞相",
    concepts: "中央集權、官僚分工、皇權與相權關係",
    compare: "比較分封制與郡縣制，以及內閣與軍機處的權力運作"
  },
  經濟文化: {
    events: "漢武帝鹽鐵官營、宋代交子、宋元羅盤航海應用",
    concepts: "國家財政、貨幣流通、技術擴散與商業網絡",
    compare: "比較漢代官營經濟與宋代市場經濟活力"
  },
  經濟發展: {
    events: "宋代交子與市鎮繁榮",
    concepts: "商品經濟、金融工具、城市商業",
    compare: "比較唐代坊市制度與宋代開放市鎮形態"
  },
  思想文化: {
    events: "漢武帝獨尊儒術、宋代理學興起、戰國百家爭鳴",
    concepts: "官方意識形態、士人價值、學術與政治互動",
    compare: "比較儒家在漢代與宋代的角色差異"
  },
  對外交流: {
    events: "唐代絲路與遣唐使、鄭和下西洋、元代驛站交通",
    concepts: "朝貢體系、海陸貿易網絡、文化傳播",
    compare: "比較唐代開放交流與明清海上政策轉變"
  },
  對外政策: {
    events: "清前期海禁與通商口岸限制",
    concepts: "國防安全、邊疆治理、對外貿易管理",
    compare: "比較清代海禁政策與唐宋較開放的對外互動"
  },
  邊疆治理: {
    events: "清朝設駐藏大臣、宋遼澶淵之盟",
    concepts: "多民族統治、藩屬關係、邊防與外交平衡",
    compare: "比較軍事控制與條約協商兩種治理手段"
  },
  制度比較: {
    events: "察舉制到科舉制、明代內閣到清代軍機處",
    concepts: "選官標準、行政效率、制度延續與調整",
    compare: "比較不同朝代如何用制度回應統治需求"
  },
  歷史理解: {
    events: "秦至清中央權力演變、唐明清對外政策轉向",
    concepts: "歷史脈絡、因果分析、長時段變遷",
    compare: "比較各朝在中央集權與對外互動上的連續與變化"
  }
};

function buildActionRecommendation(category) {
  const guide = ACTION_GUIDE[category] || {
    events: "該知識點代表事件與關鍵史實",
    concepts: "相關制度背景與核心概念",
    compare: "同主題在不同朝代的異同"
  };

  return `建議複習「${guide.events}」；連結「${guide.concepts}」；練習「${guide.compare}」。`;
}

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
    return `【${category}】正確率 ${accuracy}%：${buildActionRecommendation(category)}`;
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
