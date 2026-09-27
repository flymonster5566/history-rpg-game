# history-rpg-game

中國古代史 RPG 教育遊戲（國中三年級向），純前端（HTML/CSS/JavaScript）實作。

## 功能
- 5 關 30 題中國古代史題庫（每次隨機抽 15 題；每關隨機 3 題）
- RPG 戰鬥答題流程（答題 → 戰鬥結果 → 下一題）
- 分支故事線與多結局（完美 / 中等 / 失敗）
- 錯題記錄、知識點分析、具體行動學習建議
- PDF 學習報告下載（jsPDF + html2canvas）
- LocalStorage 保存進度與報告紀錄
- 響應式版面（手機/桌機）

## 專案結構
```
history-rpg-game/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── game.js
│   ├── questions.js
│   ├── story.js
│   ├── analytics.js
│   └── pdf-export.js
├── assets/
│   └── images/
└── .github/workflows/
    └── deploy-pages.yml
```

## 本機執行
可用任一靜態伺服器啟動，例如：

```bash
python -m http.server 8000
```

然後開啟 `http://localhost:8000`。

## GitHub Pages 部署
已提供 `.github/workflows/deploy-pages.yml`，推送到預設分支後會自動部署至 GitHub Pages。
