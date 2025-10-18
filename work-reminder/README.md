# WorkHelper - 工作助手

一個功能強大的桌面工作助手應用程式，幫助您管理工作時間、提醒休息、追蹤任務，並整合 Google Calendar 會議提醒。

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-blue)
![Electron](https://img.shields.io/badge/Electron-31.7.7-blue)
![React](https://img.shields.io/badge/React-18.3.1-blue)

## ✨ 主要功能

### 📅 Google Calendar 整合
- 自動同步 Google 日曆事件
- 關鍵字過濾會議提醒
- 可自訂提醒時間（5-60 分鐘）
- 支援多個日曆和共享日曆
- 桌面通知提醒

### 👁️ 護眼提醒
- 定時提醒休息保護眼睛
- 可自訂提醒間隔
- 支援暫停和延後功能
- 倒計時顯示

### 🕐 上下班提醒
- 記錄上班時間
- 下班時間提醒
- 工作時長統計
- 歷史記錄查詢

### ✅ 任務管理
- 創建和管理待辦事項
- 任務分類（日常/每週/每月/臨時）
- 優先級設定
- 完成狀態追蹤

### 🎤 會議錄音
- 高品質音訊錄製
- 暫停/繼續錄音
- 實時音量監控
- 錄音播放和管理
- 播放速度調整（0.5x-2x）
- Whisper AI 語音轉錄（需 API 金鑰）
- AI 摘要生成

## 🚀 快速開始

### 系統需求

- Windows 10/11, macOS 10.15+, 或 Linux
- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

### 安裝

```bash
# 克隆倉庫
git clone https://github.com/yourusername/work-helper.git

# 進入專案目錄
cd work-reminder

# 安裝依賴
npm install

# 開發模式運行
npm run electron:dev

# 建置應用程式
npm run build
```

### 開發

```bash
# 啟動開發伺服器
npm run dev

# 編譯 TypeScript
npm run build:ts

# 建置生產版本
npm run build
```

## 📖 使用說明

### Google Calendar 設定

詳細的 Google Calendar 設定步驟請參閱 [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md)

快速步驟：
1. 在 Google Cloud Console 建立 OAuth 2.0 憑證
2. 在 WorkHelper 中輸入 Client ID 和 Client Secret
3. 完成 Google 帳號授權
4. 設定關鍵字過濾和提醒時間
5. 開始監控

### 護眼提醒

1. 點擊側邊欄的「護眼提醒」圖示
2. 設定提醒間隔（建議 20-60 分鐘）
3. 點擊「開始」按鈕
4. 時間到時會彈出提醒視窗

### 任務管理

1. 點擊側邊欄的「代辦事項」圖示
2. 點擊「新增任務」按鈕
3. 填寫任務資訊（標題、類別、優先級、截止日期）
4. 點擊任務可以標記為完成

### 會議錄音

1. 點擊側邊欄的「會議錄音」圖示
2. 點擊「開始錄音」按鈕
3. 可以使用暫停/繼續功能
4. 點擊「停止」結束錄音
5. 錄音會自動儲存，可以在列表中播放或轉錄

## 🏗️ 專案結構

```
work-reminder/
├── electron/                # Electron 主進程代碼
│   ├── config/             # 配置文件（菜單等）
│   ├── services/           # 業務邏輯服務
│   │   ├── audioProcessor.ts      # 音訊處理
│   │   ├── calendarService.ts     # Google Calendar 整合
│   │   ├── eyeCareService.ts      # 護眼提醒
│   │   ├── recordingService.ts    # 錄音服務
│   │   └── workTimeService.ts     # 工作時間追蹤
│   ├── utils/              # 工具函數
│   │   ├── database.ts            # SQLite 資料庫
│   │   ├── logger.ts              # 日誌系統
│   │   ├── shortcuts.ts           # 快捷鍵
│   │   └── singleInstance.ts      # 單一實例
│   ├── main.ts            # 主進程入口
│   └── preload.ts         # Preload 腳本
├── src/                    # React 前端代碼
│   ├── components/         # 可重用組件
│   ├── pages/              # 頁面組件
│   │   ├── Calendar/              # 日曆頁面
│   │   ├── Dashboard/             # 儀表板
│   │   ├── EyeCare/               # 護眼頁面
│   │   ├── Recording/             # 錄音頁面
│   │   ├── Tasks/                 # 任務頁面
│   │   └── WorkTime/              # 工作時間頁面
│   ├── stores/             # Zustand 狀態管理
│   ├── types/              # TypeScript 類型定義
│   ├── utils/              # 前端工具函數
│   └── constants/          # 常量定義
├── GOOGLE_CALENDAR_SETUP.md  # Google Calendar 設定說明
├── PROJECT_STRUCTURE.md       # 專案結構文檔
└── package.json               # 專案配置
```

## 🔧 技術棧

### 前端
- **React 18** - UI 框架
- **TypeScript** - 類型安全
- **Tailwind CSS** - 樣式框架
- **DaisyUI** - UI 組件庫
- **Zustand** - 狀態管理
- **React Router** - 路由管理
- **Lucide React** - 圖標庫
- **date-fns** - 日期處理

### 後端 (Electron)
- **Electron 31** - 跨平台桌面應用框架
- **Better-SQLite3** - 本地資料庫
- **Google APIs** - Google Calendar 整合
- **Menubar** - 系統托盤應用

### 開發工具
- **Vite** - 建置工具
- **ESLint** - 代碼檢查
- **Prettier** - 代碼格式化
- **Electron Builder** - 應用打包

## 📝 開發說明

### 新增功能

1. 在 `electron/services/` 創建服務類
2. 在 `electron/main.ts` 註冊 IPC 處理器
3. 在 `electron/preload.ts` 添加 API 綁定
4. 在 `src/types/` 添加類型定義
5. 在 `src/pages/` 創建或更新頁面組件

### 資料庫遷移

資料庫表結構定義在 `electron/utils/database.ts`。修改表結構後需要：
1. 更新 `initDatabase()` 函數中的 CREATE TABLE 語句
2. 清除開發環境的資料庫文件（位於 AppData）
3. 重新啟動應用程式

### IPC 通訊

所有主進程與渲染進程的通訊都通過 `window.electronAPI` 進行：

```typescript
// 渲染進程
const result = await window.electronAPI.tasks.getAll()

// 主進程 (electron/main.ts)
handleIPC('db:tasks:getAll', async () => {
  return await database.getTasks()
})
```

## 🔐 安全性

- OAuth Token 存儲在本機使用者資料目錄
- 僅請求必要的最小權限
- 所有 API 通訊使用 HTTPS 加密
- 資料僅在本機處理，不上傳到雲端

## 📄 授權

MIT License - 詳見 [LICENSE](./LICENSE) 文件

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📮 聯繫

如有問題或建議，請開啟 Issue。

---

**注意**: 此專案僅供個人使用和學習。使用 Google Calendar API 時請遵守 Google 的服務條款。
