import { QUESTIONS, LEVEL_ENEMIES } from "./questions.js";
import { getLevelOpening, getStoryAfterAnswer, updateBranchScore, decideEnding } from "./story.js";
import { buildKnowledgeStats, buildRecommendations, summarizeResult } from "./analytics.js";
import { exportPdfReport } from "./pdf-export.js";

const STORAGE_KEY = "historyRpgProgressV1";
const HISTORY_KEY = "historyRpgReportsV1";
const QUESTIONS_PER_RUN = 15;
const QUESTIONS_PER_LEVEL = QUESTIONS_PER_RUN / LEVEL_ENEMIES.length;
const QUESTION_MAP = new Map(QUESTIONS.map((item) => [item.id, item]));
const QUESTIONS_BY_LEVEL = LEVEL_ENEMIES.reduce((acc, enemy) => {
  acc[enemy.level] = QUESTIONS.filter((question) => question.level === enemy.level);
  return acc;
}, {});

const elements = {
  intro: document.getElementById("intro"),
  game: document.getElementById("game"),
  result: document.getElementById("result"),
  analysis: document.getElementById("analysis"),
  startGame: document.getElementById("start-game"),
  resumeGame: document.getElementById("resume-game"),
  introNote: document.getElementById("intro-note"),
  playerHp: document.getElementById("player-hp"),
  enemyName: document.getElementById("enemy-name"),
  enemyHp: document.getElementById("enemy-hp"),
  progress: document.getElementById("progress"),
  storyText: document.getElementById("story-text"),
  questionPeriod: document.getElementById("question-period"),
  questionDifficulty: document.getElementById("question-difficulty"),
  questionCategory: document.getElementById("question-category"),
  questionText: document.getElementById("question-text"),
  options: document.getElementById("options"),
  battleLog: document.getElementById("battle-log"),
  endingTitle: document.getElementById("ending-title"),
  endingDescription: document.getElementById("ending-description"),
  resultStats: document.getElementById("result-stats"),
  viewAnalysis: document.getElementById("view-analysis"),
  restartGame: document.getElementById("restart-game"),
  analysisScore: document.getElementById("analysis-score"),
  knowledgeStats: document.getElementById("knowledge-stats"),
  wrongList: document.getElementById("wrong-list"),
  recommendations: document.getElementById("recommendations"),
  exportPdf: document.getElementById("export-pdf"),
  backResult: document.getElementById("back-result")
};

let state = createInitialState();
let latestReport = null;

function createInitialState() {
  return {
    questionSet: [],
    currentQuestionIndex: 0,
    playerHp: 120,
    enemyHp: LEVEL_ENEMIES[0].maxHp,
    currentLevel: 1,
    answers: [],
    wrongQuestions: [],
    branchScore: {
      brave: 0,
      wise: 0,
      balanced: 0,
      cautious: 0
    }
  };
}

function shuffle(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function buildDeterministicFallbackSet() {
  const basePerLevel = Math.floor(QUESTIONS_PER_RUN / LEVEL_ENEMIES.length);
  const selected = [];
  const selectedIds = new Set();

  LEVEL_ENEMIES.forEach((enemy) => {
    const candidates = [...(QUESTIONS_BY_LEVEL[enemy.level] || [])].sort((a, b) => a.id - b.id);
    candidates.slice(0, basePerLevel).forEach((question) => {
      selected.push(question);
      selectedIds.add(question.id);
    });
  });

  if (selected.length < QUESTIONS_PER_RUN) {
    [...QUESTIONS]
      .sort((a, b) => a.level - b.level || a.id - b.id)
      .forEach((question) => {
        if (selected.length >= QUESTIONS_PER_RUN || selectedIds.has(question.id)) {
          return;
        }
        selected.push(question);
        selectedIds.add(question.id);
      });
  }

  return selected
    .slice(0, QUESTIONS_PER_RUN)
    .sort((a, b) => a.level - b.level || a.id - b.id);
}

function generateQuestionSet() {
  if (!Number.isInteger(QUESTIONS_PER_LEVEL)) {
    console.warn(`題庫設定不整除：${QUESTIONS_PER_RUN} 題無法平均分配到 ${LEVEL_ENEMIES.length} 關，已改用固定題序。`);
    return buildDeterministicFallbackSet();
  }

  const missingLevel = LEVEL_ENEMIES.find((enemy) => QUESTIONS_BY_LEVEL[enemy.level].length < QUESTIONS_PER_LEVEL);
  if (missingLevel) {
    console.warn(`題庫設定不足：第 ${missingLevel.level} 關少於 ${QUESTIONS_PER_LEVEL} 題，已改用固定題序補齊。`);
    return buildDeterministicFallbackSet();
  }
  return LEVEL_ENEMIES.flatMap((enemy) => shuffle(QUESTIONS_BY_LEVEL[enemy.level]).slice(0, QUESTIONS_PER_LEVEL));
}

function getCurrentQuestions() {
  if (Array.isArray(state.questionSet)) {
    const mapped = state.questionSet.map((id) => QUESTION_MAP.get(id)).filter(Boolean);
    if (mapped.length === QUESTIONS_PER_RUN) {
      return mapped;
    }
  }
  const fallback = generateQuestionSet();
  state.questionSet = fallback.map((item) => item.id);
  return fallback;
}

function getEnemyByLevel(level) {
  return LEVEL_ENEMIES.find((item) => item.level === level) || LEVEL_ENEMIES[LEVEL_ENEMIES.length - 1];
}

function showPanel(name) {
  Object.values(elements)
    .filter((node) => node?.classList?.contains("panel"))
    .forEach((panel) => panel.classList.remove("active"));
  elements[name].classList.add("active");
}

function updateIntroState() {
  const hasProgress = !!localStorage.getItem(STORAGE_KEY);
  elements.resumeGame.disabled = !hasProgress;
  elements.introNote.textContent = hasProgress ? "偵測到未完成旅程，可直接繼續挑戰。" : "目前沒有可續玩的進度。";
}

function logBattle(text, isGood = true) {
  const line = document.createElement("p");
  line.className = isGood ? "good" : "bad";
  line.textContent = text;
  elements.battleLog.prepend(line);
}

function renderStatus() {
  const currentQuestions = getCurrentQuestions();
  const enemy = getEnemyByLevel(state.currentLevel);
  elements.playerHp.textContent = `${Math.max(state.playerHp, 0)} / 120`;
  elements.enemyName.textContent = `第 ${state.currentLevel} 關・${enemy.name}`;
  elements.enemyHp.textContent = `${Math.max(state.enemyHp, 0)} / ${enemy.maxHp}`;
  elements.progress.textContent = `${Math.min(state.currentQuestionIndex + 1, currentQuestions.length)} / ${currentQuestions.length}`;
}

function renderQuestion() {
  const currentQuestions = getCurrentQuestions();
  const question = currentQuestions[state.currentQuestionIndex];
  if (!question) {
    finishGame();
    return;
  }

  elements.questionPeriod.textContent = question.period;
  elements.questionDifficulty.textContent = `難度：${question.difficulty}`;
  elements.questionCategory.textContent = `知識點：${question.category}`;
  elements.questionText.textContent = question.text;
  elements.options.innerHTML = "";

  Object.entries(question.options).forEach(([key, value]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";
    button.textContent = `${key}. ${value}`;
    button.addEventListener("click", () => handleAnswer(key));
    elements.options.appendChild(button);
  });

  renderStatus();
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

function pushReport(report) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history.unshift({ ...report, createdAt: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

function handleAnswer(answerKey) {
  const currentQuestions = getCurrentQuestions();
  const question = currentQuestions[state.currentQuestionIndex];
  if (!question) {
    return;
  }

  [...elements.options.querySelectorAll("button")].forEach((button) => {
    button.disabled = true;
  });

  const isCorrect = answerKey === question.answer;
  const difficultyFactor = question.difficulty === "困難" ? 1.2 : question.difficulty === "中等" ? 1 : 0.8;
  const enemyDamage = Math.round(28 * difficultyFactor);
  const playerDamage = Math.round(18 * difficultyFactor);

  state.branchScore = updateBranchScore(state.branchScore, answerKey);

  if (isCorrect) {
    if (state.enemyHp > 0) {
      state.enemyHp = Math.max(0, state.enemyHp - enemyDamage);
      logBattle(`答對！對敵人造成 ${enemyDamage} 點傷害。`, true);
    } else {
      logBattle("敵將已被擊破，此題成績將影響你的最終評價。", true);
    }
  } else {
    state.playerHp -= playerDamage;
    logBattle(`答錯！你受到 ${playerDamage} 點傷害。`, false);
  }

  const storyLine = getStoryAfterAnswer({ answer: answerKey, isCorrect });
  elements.storyText.textContent = storyLine;

  const answerRecord = {
    id: question.id,
    level: question.level,
    period: question.period,
    category: question.category,
    difficulty: question.difficulty,
    text: question.text,
    answer: question.answer,
    userAnswer: answerKey,
    isCorrect
  };

  state.answers.push(answerRecord);
  if (!isCorrect) {
    state.wrongQuestions.push(answerRecord);
  }

  if (state.playerHp <= 0) {
    finishGame();
    return;
  }

  const currentLevel = question.level;
  state.currentQuestionIndex += 1;

  const nextQuestion = currentQuestions[state.currentQuestionIndex];
  if (state.enemyHp <= 0 && nextQuestion && nextQuestion.level === currentLevel) {
    state.enemyHp = 0;
  } else if (nextQuestion && nextQuestion.level !== currentLevel) {
    state.currentLevel = nextQuestion.level;
    state.enemyHp = getEnemyByLevel(state.currentLevel).maxHp;
    elements.storyText.textContent = getLevelOpening(state.currentLevel);
  }

  saveProgress();

  setTimeout(() => {
    renderQuestion();
  }, 350);
}

function buildFinalReport() {
  const summary = summarizeResult({ answers: state.answers, wrongQuestions: state.wrongQuestions });
  const knowledgeStats = buildKnowledgeStats(state.answers);
  const recommendations = buildRecommendations({
    knowledgeStats,
    wrongQuestions: state.wrongQuestions
  });
  const ending = decideEnding({
    accuracy: summary.accuracy,
    playerHp: state.playerHp,
    branchScore: state.branchScore
  });

  return {
    ...summary,
    ...ending,
    playerHp: Math.max(state.playerHp, 0),
    wrongQuestions: state.wrongQuestions,
    knowledgeStats,
    recommendations
  };
}

function finishGame() {
  latestReport = buildFinalReport();
  clearProgress();
  pushReport(latestReport);

  elements.endingTitle.textContent = latestReport.title;
  elements.endingDescription.textContent = latestReport.description;
  elements.resultStats.innerHTML = "";

  [
    `總題數：${latestReport.total}`,
    `答對：${latestReport.correct}`,
    `答錯：${latestReport.wrong}`,
    `正確率：${Math.round(latestReport.accuracy * 100)}%`,
    `剩餘 HP：${latestReport.playerHp}`
  ].forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    elements.resultStats.appendChild(li);
  });

  renderAnalysis(latestReport);
  showPanel("result");
  updateIntroState();
}

function renderAnalysis(report) {
  elements.analysisScore.textContent = `成績 ${report.correct}/${report.total}，正確率 ${Math.round(report.accuracy * 100)}%。`;

  elements.knowledgeStats.innerHTML = "";
  Object.entries(report.knowledgeStats).forEach(([category, value]) => {
    const li = document.createElement("li");
    li.textContent = `${category}：共 ${value.total} 題，答對 ${value.correct} 題，答錯 ${value.wrong} 題`;
    elements.knowledgeStats.appendChild(li);
  });

  elements.wrongList.innerHTML = "";
  if (!report.wrongQuestions.length) {
    const li = document.createElement("li");
    li.textContent = "本次沒有錯題，表現優秀！";
    elements.wrongList.appendChild(li);
  } else {
    report.wrongQuestions.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.text}（你的答案：${item.userAnswer}；正解：${item.answer}）`;
      elements.wrongList.appendChild(li);
    });
  }

  elements.recommendations.innerHTML = "";
  report.recommendations.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    elements.recommendations.appendChild(li);
  });
}

function startNewGame() {
  state = createInitialState();
  state.questionSet = generateQuestionSet().map((item) => item.id);
  elements.battleLog.innerHTML = "";
  elements.storyText.textContent = getLevelOpening(1);
  saveProgress();
  renderQuestion();
  showPanel("game");
}

function resumeGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    updateIntroState();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state = {
      ...createInitialState(),
      ...parsed,
      branchScore: {
        ...createInitialState().branchScore,
        ...(parsed.branchScore || {})
      }
    };

    elements.battleLog.innerHTML = "";
    if (!Array.isArray(state.questionSet) || state.questionSet.length !== QUESTIONS_PER_RUN) {
      state.questionSet = generateQuestionSet().map((item) => item.id);
    }
    const currentLevel = getCurrentQuestions()[state.currentQuestionIndex]?.level || state.currentLevel || 1;
    state.currentLevel = currentLevel;
    elements.storyText.textContent = getLevelOpening(currentLevel);
    renderQuestion();
    showPanel("game");
  } catch {
    clearProgress();
    updateIntroState();
  }
}

function bindEvents() {
  elements.startGame.addEventListener("click", startNewGame);
  elements.resumeGame.addEventListener("click", resumeGame);
  elements.viewAnalysis.addEventListener("click", () => showPanel("analysis"));
  elements.backResult.addEventListener("click", () => showPanel("result"));
  elements.restartGame.addEventListener("click", () => {
    state = createInitialState();
    clearProgress();
    updateIntroState();
    showPanel("intro");
  });
  elements.exportPdf.addEventListener("click", () => {
    if (latestReport) {
      exportPdfReport(latestReport);
    }
  });
}

function init() {
  bindEvents();
  updateIntroState();
  showPanel("intro");
}

init();
