# WorkHelper 專案結構說明

## 📁 專案結構

```
work-reminder/
├── electron/              # Electron 主進程代碼
│   ├── services/         # 業務邏輯服務
│   │   ├── audioProcessor.ts      # 音頻處理服務
│   │   ├── eyeCareService.ts      # 護眼提醒服務
│   │   ├── recordingService.ts    # 錄音管理服務
│   │   └── workTimeService.ts     # 上下班記錄服務
│   ├── utils/            # 工具函數
│   │   ├── database.ts            # 數據庫操作
│   │   ├── logger.ts              # 日誌系統
│   │   ├── shortcuts.ts           # 快捷鍵管理
│   │   └── singleInstance.ts      # 單實例控制
│   ├── config/           # 配置文件
│   │   └── menu.ts                # 應用菜單配置
│   ├── main.ts           # 主進程入口
│   └── preload.ts        # 預加載腳本
│
├── src/                  # React 前端代碼
│   ├── components/       # 可復用組件
│   │   ├── ConfirmDialog.tsx      # 確認對話框
│   │   ├── ErrorBoundary.tsx      # 錯誤邊界
│   │   ├── EyeCareReminderModal.tsx # 護眼提醒彈窗
│   │   ├── Sidebar.tsx            # 側邊欄
│   │   ├── TitleBar.tsx           # 標題欄
│   │   └── Toast.tsx              # 提示消息
│   │
│   ├── pages/            # 頁面組件
│   │   ├── Dashboard/    # 儀表板
│   │   ├── EyeCare/      # 護眼提醒
│   │   ├── Recording/    # 會議錄音
│   │   ├── Settings/     # 設置
│   │   ├── Tasks/        # 任務管理
│   │   └── WorkTime/     # 上下班記錄
│   │
│   ├── types/            # TypeScript 類型定義
│   │   ├── electron.ts   # Electron API 類型
│   │   ├── eyeCare.ts    # 護眼相關類型
│   │   ├── recording.ts  # 錄音相關類型
│   │   ├── task.ts       # 任務相關類型
│   │   ├── workTime.ts   # 上下班相關類型
│   │   └── index.ts      # 類型統一導出
│   │
│   ├── utils/            # 工具函數
│   │   ├── formatters.ts # 格式化函數（時間、大小、日期等）
│   │   ├── validators.ts # 驗證函數
│   │   └── index.ts      # 工具函數統一導出
│   │
│   ├── constants/        # 常量定義
│   │   └── index.ts      # 應用常量（優先級、分類、路由等）
│   │
│   ├── hooks/            # 自定義 Hooks（預留）
│   ├── stores/           # 狀態管理
│   │   └── useAppStore.ts # 全局應用狀態
│   │
│   ├── styles/           # 樣式文件
│   │   └── modern.css    # 現代化樣式
│   │
│   ├── App.tsx           # 應用主組件
│   ├── main.tsx          # React 入口
│   ├── global.d.ts       # 全局類型聲明
│   └── index.css         # 全局樣式
│
├── resources/            # 應用資源
│   └── tray-icon.ico     # 系統托盤圖標
│
├── .claude/              # Claude 配置
│   ├── roadmap.md        # 項目路線圖
│   └── todos.md          # 待辦事項
│
├── package.json          # 項目依賴和腳本
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
├── tailwind.config.js    # Tailwind CSS 配置
└── README.md             # 項目說明
```

## 🎯 目錄結構優化亮點

### 1. **Electron 目錄重組**
- **services/**: 所有業務邏輯服務集中管理
- **utils/**: 工具函數和底層功能分離
- **config/**: 配置文件獨立存放
- 清晰的職責劃分，便於維護和擴展

### 2. **類型定義拆分**
- 將原本集中在 `global.d.ts` 的類型定義拆分到 `types/` 目錄
- 按功能模塊組織類型文件
- 提供統一的導出接口
- 提高代碼的可維護性和可讀性

### 3. **工具函數庫**
- **formatters.ts**: 格式化相關函數（時間、大小、日期）
- **validators.ts**: 驗證相關函數（郵件、時間、日期）
- 避免代碼重複，提升復用性

### 4. **常量管理**
- 統一管理應用中的常量
- 包括任務優先級、分類、路由路徑等
- 使用 TypeScript 的 `as const` 確保類型安全

## 📦 主要功能模塊

### Electron 服務層
- **audioProcessor**: 音頻壓縮、分割、處理
- **eyeCareService**: 護眼提醒定時器和通知
- **recordingService**: 錄音文件管理、Whisper 轉錄、AI 摘要
- **workTimeService**: 上下班打卡、工時計算

### React 前端層
- **Dashboard**: 統一儀表板視圖
- **EyeCare**: 護眼提醒設置和狀態
- **Recording**: 會議錄音、轉錄、摘要功能
- **Tasks**: 任務管理（待辦事項）
- **WorkTime**: 上下班打卡記錄
- **Settings**: 應用設置

## 🛠️ 開發命令

```bash
# 安裝依賴
npm install

# 開發模式運行
npm run electron:dev

# 構建應用
npm run build

# 重建原生模塊
npm run rebuild
```

## 📝 代碼規範

### 命名規範
- **文件名**: PascalCase for components, camelCase for utils
- **變量**: camelCase
- **常量**: UPPER_SNAKE_CASE
- **類型/接口**: PascalCase

### 目錄規範
- 每個功能模塊獨立目錄
- 相關文件集中管理
- 避免過深的嵌套

### 導入規範
- 絕對路徑優先
- 統一使用 index.ts 作為導出入口
- 保持導入順序一致（第三方 > 本地模塊 > 樣式）

## 🚀 最近優化

### 錄音功能增強
- ✅ 暫停/繼續錄音
- ✅ 實時音頻級別監控
- ✅ 播放進度條和速度控制
- ✅ 標題即時編輯
- ✅ 搜索過濾功能
- ✅ 現代化 UI 設計

### 項目結構優化
- ✅ Electron 目錄重組（services/utils/config）
- ✅ 類型定義拆分和組織
- ✅ 工具函數庫創建
- ✅ 常量統一管理
- ✅ 完整的 TypeScript 類型支持

## 📄 License

MIT
