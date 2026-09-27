export async function exportPdfReport(report) {
  if (!window.jspdf?.jsPDF || !window.html2canvas) {
    alert("PDF 套件尚未載入完成，請稍後再試。");
    return;
  }

  const container = document.createElement("section");
  container.style.width = "700px";
  container.style.padding = "12px";
  container.style.fontFamily = "\"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif";
  container.style.fontSize = "12px";
  container.style.color = "#111827";
  container.style.background = "#ffffff";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";

  const appendText = (tag, text) => {
    const node = document.createElement(tag);
    node.textContent = text;
    container.appendChild(node);
    return node;
  };

  appendText("h1", "中國古代史 RPG 學習報告");
  appendText("p", `下載時間：${new Date().toLocaleString()}`);
  appendText("p", `成績：${report.correct}/${report.total}（正確率 ${Math.round(report.accuracy * 100)}%）`);

  appendText("h2", "知識點分析");
  const knowledgeList = document.createElement("ul");
  Object.entries(report.knowledgeStats).forEach(([category, value]) => {
    const li = document.createElement("li");
    li.textContent = `${category}：答對 ${value.correct} 題，答錯 ${value.wrong} 題`;
    knowledgeList.appendChild(li);
  });
  container.appendChild(knowledgeList);

  appendText("h2", "錯題記錄");
  const wrongList = document.createElement("ul");
  if (!report.wrongQuestions.length) {
    const li = document.createElement("li");
    li.textContent = "本次無錯題，表現優秀！";
    wrongList.appendChild(li);
  } else {
    report.wrongQuestions.forEach((item, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${item.text}（你的答案：${item.userAnswer}｜正確答案：${item.answer}）`;
      wrongList.appendChild(li);
    });
  }
  container.appendChild(wrongList);

  appendText("h2", "學習建議");
  const recommendationList = document.createElement("ul");
  report.recommendations.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    recommendationList.appendChild(li);
  });
  container.appendChild(recommendationList);

  document.body.appendChild(container);

  try {
    const canvas = await window.html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const usableHeight = pageHeight - margin * 2;

    let heightLeft = imgHeight;
    let offsetY = margin;
    pdf.addImage(imgData, "PNG", margin, offsetY, imgWidth, imgHeight);
    heightLeft -= usableHeight;

    while (heightLeft > 0) {
      pdf.addPage();
      offsetY = margin - (imgHeight - heightLeft);
      pdf.addImage(imgData, "PNG", margin, offsetY, imgWidth, imgHeight);
      heightLeft -= usableHeight;
    }

    pdf.save("history-rpg-learning-report.pdf");
  } catch {
    alert("PDF 產生失敗，請稍後再試。");
  } finally {
    container.remove();
  }
}
