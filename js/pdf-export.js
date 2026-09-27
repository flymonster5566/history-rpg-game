export function exportPdfReport(report) {
  if (!window.jspdf?.jsPDF) {
    alert("PDF 套件尚未載入，請稍後再試。");
    return;
  }

  const doc = new window.jspdf.jsPDF();
  const container = document.createElement("section");
  container.style.width = "700px";
  container.style.padding = "12px";
  container.style.fontFamily = "\"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif";
  container.style.fontSize = "12px";
  container.style.color = "#111827";
  container.style.background = "#ffffff";

  const knowledgeRows = Object.entries(report.knowledgeStats)
    .map(([category, value]) => `<li>${category}：答對 ${value.correct} 題，答錯 ${value.wrong} 題</li>`)
    .join("");

  const wrongRows = report.wrongQuestions.length
    ? report.wrongQuestions
        .map(
          (item, index) =>
            `<li>${index + 1}. ${item.text}<br/>你的答案：${item.userAnswer}｜正確答案：${item.answer}</li>`
        )
        .join("")
    : "<li>本次無錯題，表現優秀！</li>";

  const recommendationRows = report.recommendations.map((item) => `<li>${item}</li>`).join("");

  container.innerHTML = `\n    <h1>中國古代史 RPG 學習報告</h1>\n    <p>下載時間：${new Date().toLocaleString()}</p>\n    <p>成績：${report.correct}/${report.total}（正確率 ${Math.round(report.accuracy * 100)}%）</p>\n    <h2>知識點分析</h2>\n    <ul>${knowledgeRows}</ul>\n    <h2>錯題記錄</h2>\n    <ul>${wrongRows}</ul>\n    <h2>學習建議</h2>\n    <ul>${recommendationRows}</ul>\n  `;

  document.body.appendChild(container);
  doc.html(container, {
    x: 10,
    y: 10,
    width: 190,
    windowWidth: 760,
    callback: (pdf) => {
      pdf.save("history-rpg-learning-report.pdf");
      container.remove();
    }
  });
}
