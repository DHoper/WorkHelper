# Google Calendar 整合計劃

## 🎯 功能需求

### 功能 1：行事曆提醒
- 獲取與用戶相關的所有會議
- 支援關鍵字過濾提醒
- 提前通知即將到來的會議
- 顯示會議詳情

### 功能 2：AI 助手操作
- 自然語言創建會議
- 自然語言查詢會議
- 自然語言修改/刪除會議
- 智能時間解析

## 🏗️ 技術架構

### 1. Google Calendar API 整合

#### 認證流程
```typescript
// OAuth 2.0 認證
1. 用戶點擊「連結 Google 日曆」
2. 打開瀏覽器進行 OAuth 授權
3. 獲取 access_token 和 refresh_token
4. 存儲在本地加密數據庫
5. 使用 refresh_token 自動更新 access_token
```

#### API 端點
- `GET /calendars` - 獲取日曆列表
- `GET /events` - 獲取事件列表
- `POST /events` - 創建新事件
- `PUT /events/{eventId}` - 更新事件
- `DELETE /events/{eventId}` - 刪除事件

### 2. 服務層實現

```typescript
// electron/services/calendarService.ts

class CalendarService {
  // OAuth 認證
  async authenticate(): Promise<void>

  // 獲取即將到來的事件
  async getUpcomingEvents(hours: number): Promise<Event[]>

  // 根據關鍵字過濾
  async filterEventsByKeywords(keywords: string[]): Promise<Event[]>

  // 創建事件
  async createEvent(event: EventInput): Promise<Event>

  // 更新事件
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event>

  // 刪除事件
  async deleteEvent(eventId: string): Promise<void>

  // 設置提醒定時器
  startEventMonitoring(): void

  // 停止監控
  stopEventMonitoring(): void
}
```

### 3. AI 助手實現

```typescript
// electron/services/aiCalendarAssistant.ts

class AICalendarAssistant {
  // 解析自然語言指令
  async parseCommand(input: string): Promise<CalendarCommand>

  // 執行指令
  async executeCommand(command: CalendarCommand): Promise<Result>

  // 命令類型
  // - CREATE: 創建會議
  // - QUERY: 查詢會議
  // - UPDATE: 更新會議
  // - DELETE: 刪除會議
}

// 使用 OpenAI Function Calling
const functions = [
  {
    name: "create_calendar_event",
    description: "創建新的日曆事件",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "會議標題" },
        startTime: { type: "string", description: "開始時間 ISO 8601 格式" },
        endTime: { type: "string", description: "結束時間 ISO 8601 格式" },
        description: { type: "string", description: "會議描述" },
        attendees: { type: "array", items: { type: "string" } }
      }
    }
  }
]
```

### 4. 前端 UI 組件

```typescript
// src/pages/Calendar/Calendar.tsx
- 日曆視圖（月/週/日）
- 事件列表
- AI 助手對話框
- 關鍵字設置

// src/components/CalendarEventCard.tsx
- 事件卡片顯示
- 快速操作（編輯/刪除/提醒）

// src/components/AIAssistantInput.tsx
- 自然語言輸入框
- 建議命令列表
- 執行結果顯示
```

## 📦 所需套件

```json
{
  "dependencies": {
    "googleapis": "^128.0.0",        // Google API 客戶端
    "google-auth-library": "^9.0.0", // OAuth 認證
    "date-fns": "^3.0.0",            // 日期處理
    "chrono-node": "^2.7.0"          // 自然語言時間解析
  }
}
```

## 🔐 安全性考量

1. **Token 存儲**
   - 使用 Electron safeStorage 加密存儲
   - refresh_token 永久存儲
   - access_token 臨時緩存

2. **API Key 管理**
   - OpenAI API Key 用戶自行配置
   - 本地加密存儲

3. **權限範圍**
   - 只請求必要的 Calendar 權限
   - `https://www.googleapis.com/auth/calendar`

## 📅 實施階段

### Phase 1: 基礎整合（1-2 天）
- [x] Google OAuth 認證流程
- [x] 獲取事件列表
- [x] 基本的事件顯示

### Phase 2: 提醒功能（1 天）
- [x] 定時檢查即將到來的事件
- [x] 關鍵字過濾設置
- [x] 系統通知整合

### Phase 3: AI 助手（2-3 天）
- [x] 自然語言指令解析
- [x] OpenAI Function Calling 整合
- [x] 創建/查詢/更新/刪除事件
- [x] 對話式 UI

### Phase 4: UI 優化（1-2 天）
- [x] 日曆視圖
- [x] 事件詳情卡片
- [x] AI 助手對話框
- [x] 響應式設計

### Phase 5: 測試和優化（1 天）
- [x] 功能測試
- [x] 錯誤處理
- [x] 性能優化

**總計：約 6-9 天**

## 🎨 UI 設計草圖

### 主頁面佈局
```
┌─────────────────────────────────────────────┐
│  📅 Google 日曆                              │
├─────────────────────────────────────────────┤
│  [連結 Google 帳號]  [設定關鍵字]            │
├─────────────────────────────────────────────┤
│                                             │
│  今日會議 (3)                               │
│  ┌────────────────────────────────────┐   │
│  │ 🔴 09:00 - 10:00                    │   │
│  │    團隊例會                          │   │
│  │    參與者: Alice, Bob, Charlie       │   │
│  └────────────────────────────────────┘   │
│                                             │
│  ┌────────────────────────────────────┐   │
│  │ 🟢 14:00 - 15:30                    │   │
│  │    專案討論 [關鍵字匹配]            │   │
│  │    參與者: Team A                    │   │
│  └────────────────────────────────────┘   │
│                                             │
│  即將到來 (5)                               │
│  明天 09:50 - 設計評審會議                  │
│  週三 14:00 - 客戶會議                      │
│                                             │
├─────────────────────────────────────────────┤
│  💬 AI 助手                                 │
│  ┌────────────────────────────────────┐   │
│  │ 安排明天09:50分的會議，會議名稱為... │   │
│  └────────────────────────────────────┘   │
│  [發送]                                     │
└─────────────────────────────────────────────┘
```

## 💡 額外功能建議

1. **智能建議**
   - 根據歷史會議建議最佳時間
   - 避開衝突時段
   - 自動填入常用參與者

2. **會議準備**
   - 會議前自動提醒準備事項
   - 整合錄音功能（會議中錄音）
   - 會議後自動生成摘要

3. **統計分析**
   - 每週/月會議時數統計
   - 會議類型分析
   - 時間利用率報告

4. **多日曆支援**
   - 個人日曆
   - 工作日曆
   - 團隊共享日曆

## 🔄 與現有功能整合

### 與錄音功能整合
```
會議提醒 → 一鍵開始錄音 → 自動轉錄 → 生成會議記錄 → 發送給參與者
```

### 與任務功能整合
```
會議中提到的待辦事項 → 自動創建任務 → 設定期限 → 追蹤進度
```

### 與工時功能整合
```
會議時間 → 自動計入工作時數 → 生成報表
```

## ❓ 需要確認的問題

1. **MCP 相關**
   - 是否需要創建 MCP server 供 Claude Desktop 使用？
   - 還是只在應用內提供 AI 助手？

2. **關鍵字設置**
   - 關鍵字的匹配規則？（完全匹配/部分匹配/正則表達式）
   - 是否需要支援多組關鍵字？

3. **提醒設置**
   - 提前多久提醒？（可設定多個時間點）
   - 週末是否需要提醒？

4. **隱私權設置**
   - 是否需要過濾私人事件？
   - 是否需要設定可見度？

## 📝 開發檢查清單

### 後端 (Electron)
- [ ] Google OAuth 認證服務
- [ ] Calendar API 客戶端
- [ ] 事件監控服務
- [ ] AI 助手服務
- [ ] 關鍵字過濾邏輯
- [ ] 通知系統整合
- [ ] 數據持久化

### 前端 (React)
- [ ] OAuth 授權頁面
- [ ] 日曆視圖組件
- [ ] 事件列表組件
- [ ] 事件詳情卡片
- [ ] AI 助手對話框
- [ ] 關鍵字設置頁面
- [ ] 提醒設置頁面

### 測試
- [ ] OAuth 流程測試
- [ ] API 調用測試
- [ ] AI 指令解析測試
- [ ] 通知觸發測試
- [ ] 錯誤處理測試

### 文檔
- [ ] 用戶使用手冊
- [ ] API 文檔
- [ ] 開發者文檔
