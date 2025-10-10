# 工作提醒小幫手 - 開發路線圖

## 專案資訊
- **專案名稱**: Work Reminder (工作提醒小幫手)
- **技術棧**: Electron + React + TypeScript + Vite
- **UI 風格**: 現代簡約風格
- **狀態管理**: Zustand
- **資料庫**: SQLite (better-sqlite3)

## 核心功能需求

### 1. 護眼提醒 👁️
- 可自訂提醒間隔（預設：每 60 分鐘）
- 提醒彈窗顯示休息建議
- 暫停/延後功能
- 提醒音效（可選）
- 開關控制

### 2. 代辦事項 📝
- **分類系統**:
  - 每日任務
  - 每周任務
  - 每月任務
  - 臨時任務
- **功能**:
  - 新增/編輯/刪除
  - 完成狀態標記
  - 到期提醒
  - 優先級設定
  - 任務搜尋

### 3. 下班時間提醒 ⏰
- 手動記錄上班時間（開機後點擊按鈕）
- 自動計算下班時間（上班時間 + 9小時）
- 最早下班時間限制：17:30
- 提前提醒（例如：提前 15 分鐘）
- 上下班歷史記錄

### 4. Google Calendar 整合 📅
- **狀態**: 暫緩實作
- 待後續評估後再開發

### 5. 錄音與轉錄功能 🎙️
- **狀態**: 未來擴展功能
- **錄音功能**:
  - 會議錄音控制（開始/暫停/停止）
  - 音頻檔案管理
  - 錄音品質設定
  - 背景錄音支援
- **語音轉文字**:
  - Whisper API 整合（OpenAI 或本地模型）
  - 多語言轉錄支援
  - 即時轉錄或批次處理
  - 轉錄文字編輯與導出
  - 時間戳記標註
- **會議記錄**:
  - 會議名稱與標籤
  - 自動關聯行事曆會議
  - 會議摘要生成（AI 輔助）
  - 搜尋歷史錄音與轉錄文字

## 開發階段規劃

### ✅ Phase 0: 專案初始化 (已完成)
- [x] 建立 Electron + React + TypeScript 專案
- [x] 配置 Vite 建構工具
- [x] 設定 TypeScript 配置
- [x] 建立基礎專案結構
- [x] 實作系統托盤功能
- [x] 建立歡迎頁面

### 📋 Phase 1: UI 框架與布局 (1-2天)
- [ ] 設計整體 UI 布局（側邊欄 + 主內容區）
- [ ] 實作導航系統
- [ ] 建立各功能模組的頁面框架
- [ ] 實作淺色/深色主題切換
- [ ] 響應式布局調整

### 📋 Phase 2: 護眼提醒功能 (1-2天)
- [ ] 建立計時器服務
- [ ] 實作提醒彈窗 UI
- [ ] 設定頁面：間隔時間設定
- [ ] 暫停/恢復功能
- [ ] 延後功能（延後 5/10/15 分鐘）
- [ ] 通知音效整合
- [ ] 提醒歷史記錄

### 📋 Phase 3: 資料庫設計與設定 (1天)
- [ ] 設計資料庫 Schema
  - tasks 表（代辦事項）
  - work_records 表（上下班記錄）
  - settings 表（應用設定）
  - reminders 表（提醒記錄）
- [ ] 實作資料庫初始化
- [ ] 建立 ORM/資料存取層
- [ ] 資料庫遷移機制

### 📋 Phase 4: 代辦事項功能 (2-3天)
- [ ] 任務資料模型設計
- [ ] 任務列表 UI
  - 分類標籤頁（每日/每周/每月/臨時）
  - 任務卡片設計
  - 完成狀態切換
- [ ] 新增任務表單
  - 任務標題
  - 描述
  - 分類選擇
  - 截止日期
  - 優先級
- [ ] 編輯/刪除功能
- [ ] 任務篩選與搜尋
- [ ] 到期檢查機制
- [ ] 任務提醒通知

### 📋 Phase 5: 下班時間提醒 (1-2天)
- [ ] 上班時間記錄 UI
  - 「開始上班」按鈕
  - 顯示目前上班時間
  - 顯示預計下班時間
- [ ] 下班時間計算邏輯
  - 上班時間 + 9小時
  - 最早 17:30 限制
- [ ] 提醒設定
  - 提前提醒時間（預設 15 分鐘）
  - 提醒方式設定
- [ ] 上下班歷史記錄頁面
  - 日期、上班時間、下班時間
  - 工時統計
  - 匯出功能

### 📋 Phase 6: 通知系統整合 (1天)
- [ ] 統一通知管理器
- [ ] 系統原生通知
- [ ] 應用內彈窗通知
- [ ] 通知音效系統
- [ ] 勿擾模式
- [ ] 通知優先級處理
- [ ] 通知中心（歷史記錄）

### 📋 Phase 7: 設定與偏好 (1天)
- [ ] 設定頁面 UI
- [ ] 一般設定
  - 語言選擇
  - 主題選擇
  - 開機自啟動
- [ ] 通知設定
  - 各功能通知開關
  - 音效設定
  - 勿擾時段
- [ ] 資料管理
  - 資料庫備份
  - 資料匯出
  - 清除所有資料
- [ ] 關於頁面

### 📋 Phase 8: 優化與測試 (1-2天)
- [ ] 效能優化
- [ ] 記憶體使用優化
- [ ] 錯誤處理完善
- [ ] 使用者體驗優化
- [ ] 功能測試
- [ ] 穩定性測試

### 📋 Phase 9: 打包與發布 (1天)
- [ ] 設計應用圖標
- [ ] Electron Builder 配置
- [ ] Windows 安裝包製作
- [ ] 安裝測試
- [ ] 撰寫使用說明
- [ ] 版本發布

## 技術細節

### 專案結構
```
work-reminder/
├── electron/          # Electron 主程序
│   ├── main.ts       # 主程序入口
│   └── preload.ts    # 預載腳本
├── src/              # React 應用
│   ├── components/   # React 元件
│   ├── pages/        # 頁面元件
│   │   ├── Dashboard/      # 儀表板
│   │   ├── EyeCare/        # 護眼提醒
│   │   ├── Tasks/          # 代辦事項
│   │   ├── WorkTime/       # 下班提醒
│   │   ├── Recording/      # 錄音功能（未來）
│   │   └── Settings/       # 設定
│   ├── services/     # 業務邏輯服務
│   ├── stores/       # 狀態管理
│   ├── types/        # TypeScript 類型
│   ├── utils/        # 工具函數
│   ├── App.tsx       # 應用根元件
│   └── main.tsx      # React 入口
├── public/           # 靜態資源
├── database/         # 資料庫檔案
├── recordings/       # 錄音檔案儲存（未來）
└── dist/            # 建構輸出
```

### 資料庫 Schema

#### tasks (任務表)
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK(category IN ('daily', 'weekly', 'monthly', 'temporary')),
  priority INTEGER DEFAULT 0,
  is_completed INTEGER DEFAULT 0,
  due_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### work_records (上下班記錄)
```sql
CREATE TABLE work_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  clock_in_time TEXT NOT NULL,
  clock_out_time TEXT,
  work_hours REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### settings (設定)
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 預計時程
- **核心功能開發**: 8-12 天
- **測試與優化**: 2-3 天
- **總計**: 10-15 天

## 風險與挑戰
1. **系統托盤在不同作業系統的表現**
2. **背景提醒服務的穩定性**
3. **資料庫遷移與升級策略**
4. **通知權限處理**

## 未來擴展

### Phase 10: 錄音與轉錄功能 (3-5天) 🎙️
- [ ] 音頻錄製模組
  - [ ] 麥克風權限處理
  - [ ] 錄音控制介面
  - [ ] 音頻格式選擇（WAV/MP3/M4A）
  - [ ] 即時音量顯示
- [ ] Whisper 整合
  - [ ] 選擇實作方式（本地 vs API）
  - [ ] Whisper API 串接
  - [ ] 轉錄進度顯示
  - [ ] 錯誤處理
- [ ] 會議記錄管理
  - [ ] 錄音列表介面
  - [ ] 轉錄文字檢視與編輯
  - [ ] 搜尋功能
  - [ ] 標籤系統
  - [ ] 導出功能（TXT/MD/DOCX）
- [ ] 資料庫擴展
  - [ ] recordings 表
  - [ ] transcriptions 表
  - [ ] 檔案索引與管理

### 其他擴展
- Google Calendar 整合
- Outlook Calendar 整合
- 番茄鐘工作法
- 統計報表與數據分析
- AI 會議摘要（結合 GPT）
- 雲端同步
- 多裝置支援
- 快捷鍵支援
- 小工具模式（Widget）
