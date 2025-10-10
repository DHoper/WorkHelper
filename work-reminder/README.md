# 工作提醒小幫手 (Work Reminder)

一個現代化的桌面提醒應用程式，幫助您管理工作時間、護眼健康和日常任務。

## ✨ 功能特色

### 已實現
- ✅ 現代簡約的 UI 介面
- ✅ 系統托盤整合
- ✅ Electron + React + TypeScript 架構

### 開發中
- 🚧 護眼提醒（可自訂間隔，預設 60 分鐘）
- 🚧 代辦事項管理（每日/每周/每月/臨時）
- 🚧 下班時間提醒（彈性上下班時間計算）
- 🚧 通知系統

### 未來計畫
- 📅 Google Calendar 整合（暫緩）
- 📊 統計報表功能
- ☁️ 雲端同步

## 🛠️ 技術棧

- **框架**: Electron 31
- **前端**: React 18 + TypeScript 5
- **建構工具**: Vite 5
- **狀態管理**: Zustand
- **資料庫**: SQLite (better-sqlite3)

## 📦 安裝與運行

### 環境需求
- Node.js >= 18
- npm >= 9

### 開發模式

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（僅 Web 模式）
npm run dev

# 啟動 Electron 開發模式
npm run electron:dev
```

### 建構應用

```bash
# 建構並打包應用程式
npm run electron:build
```

## 📁 專案結構

```
work-reminder/
├── electron/              # Electron 主程序
│   ├── main.ts           # 主程序入口
│   └── preload.ts        # 預載腳本
├── src/                  # React 應用
│   ├── components/       # React 元件
│   ├── pages/           # 頁面元件
│   ├── services/        # 業務邏輯服務
│   ├── stores/          # 狀態管理
│   ├── types/           # TypeScript 類型
│   ├── utils/           # 工具函數
│   ├── App.tsx          # 應用根元件
│   └── main.tsx         # React 入口
├── .claude/             # 開發文檔
│   ├── roadmap.md       # 開發路線圖
│   └── todos.md         # 待辦清單
└── package.json
```

## 📖 開發文檔

詳細的開發路線圖和待辦清單請參閱：
- [開發路線圖](.claude/roadmap.md)
- [待辦清單](.claude/todos.md)

## 🎯 核心功能說明

### 1. 護眼提醒 👁️
- 可自訂提醒間隔（預設：每 60 分鐘）
- 支援暫停、延後、跳過功能
- 可選音效提示

### 2. 代辦事項 📝
- 分類管理：每日、每周、每月、臨時任務
- 優先級設定
- 到期提醒
- 完成狀態追蹤

### 3. 下班時間提醒 ⏰
- 手動記錄上班時間
- 自動計算下班時間（上班時間 + 9小時，最早 17:30）
- 提前提醒功能
- 上下班歷史記錄

## 🔧 開發命令

```bash
# 開發模式（Vite only）
npm run dev

# Electron 開發模式
npm run electron:dev

# TypeScript 檢查
tsc --noEmit

# 建構
npm run build

# 預覽建構結果
npm run preview
```

## 📝 授權

MIT License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

**開發狀態**: 🚧 開發中（Phase 0 已完成，Phase 1 進行中）
