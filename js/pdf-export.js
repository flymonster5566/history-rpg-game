export function exportPdfReport(report) {
  if (!window.jspdf?.jsPDF) {
    alert("PDF 套件尚未載入，請稍後再試。");
    return;
  }

  const doc = new window.jspdf.jsPDF();
  let y = 15;

  const addLine = (text) => {
    if (y > 280) {
      doc.addPage();
      y = 15;
    }
    doc.text(text, 12, y);
    y += 8;
  };

  addLine("History RPG Learning Report");
  addLine(`Date: ${new Date().toLocaleString()}`);
  addLine(`Score: ${report.correct}/${report.total} (accuracy ${Math.round(report.accuracy * 100)}%)`);
  y += 4;

  addLine("Knowledge Stats:");
  Object.entries(report.knowledgeStats).forEach(([category, value]) => {
    addLine(`- ${category}: correct ${value.correct}, wrong ${value.wrong}`);
  });

  y += 4;
  addLine("Wrong Questions:");
  if (!report.wrongQuestions.length) {
    addLine("- None");
  } else {
    report.wrongQuestions.forEach((item, index) => {
      addLine(`${index + 1}. ${item.text}`);
      addLine(`   Correct: ${item.answer} | Your Answer: ${item.userAnswer}`);
    });
  }

  y += 4;
  addLine("Recommendations:");
  report.recommendations.forEach((item, index) => {
    addLine(`${index + 1}. ${item}`);
  });

  doc.save("history-rpg-learning-report.pdf");
}
