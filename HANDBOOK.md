# 📖 CaseFlow OS 員工操作與技術手冊 (Handbook)

歡迎來到 **CaseFlow OS**！本手冊統整系統架構、雲端資料庫規範、核心功能操作、部署協議、歷史開發里程碑與未來 Roadmap。

---

## 🌟 1. 系統定位與核心架構

**CaseFlow OS** 是一個以 **Google Workspace (Google Sheets / Google Drive)** 為後端資料庫，透過 **Google Apps Script (GAS)** 與 **GitHub Pages** 雙軌運作的事件驅動專案作業系統 (Event-Driven OS)。

### 🛠️ 技術規格
- **後端與資料庫**：Google Apps Script (GAS) Web App + Google Sheets 雲端試算表（7 大核心工作表）。
- **前端介面**：HTML5 + Vanilla JS + Tailwind CSS，整合 FullCalendar v6（日曆）。
- **極速效能架構**：
  - **後端**：全面改採**單一記憶體 2D 陣列批次寫入 (`setValues`)** 與 `SpreadsheetApp.flush()` 強制落盤防護，寫入耗時降至 `<0.05s`。
  - **前端**：單通道載入 (`getInitialData`) + `Promise.all` 降級備援（首頁載入 `<0.3s`）；`renderActiveViewOnly` 視圖懶加載與原地 DOM 變更 (In-place Mutation)，消除全站 DOM 銷毀重繪卡頓。
- **門禁與權限控管**：
  - **Email 白名單門禁**：以 `Users.google_email` 為進站名單（`#login-modal`）。
  - **Super Master 穿透權限**：`Martin` (`id: 1` / `is_super_master: true`) 具全域專案與任務檢視穿透權限，外加單向 PIN 碼鎖（`ADMIN_PASSCODE: 8888`）。

---

## 🗄️ 2. Google Sheets 雲端資料庫架構 (7 大工作表)

👉 **[官方雲端資料庫 Google Sheets 連結](https://docs.google.com/spreadsheets/d/19NBQmVYYCg3ej3DDBrX0f3Zb1Ueougr-m-8xQHoK6Jk/edit)**

| 工作表 | 作用 | 核心欄位結構 (Key Schema) |
| :--- | :--- | :--- |
| **`Users`** | 成員帳號、角色、顏色、語系與管理權限 | `id`, `username`, `role_id`, `avatar_color`, `language`, `google_email`, `is_super_master` |
| **`Roles`** | 角色名稱與專案建立權限定義 | `id`, `role_name`, `can_create_case` |
| **`Cases`** | 專案總表、Drive 掛載、出發基準日與封存 | `id`, `title`, `description`, `owner_id`, `drive_url`, `group_names`, `reference_date`, `is_archived` |
| **`Tasks`** | 待辦項目、起訖死線、備註與可見人員 | `id`, `case_id`, `group_name`, `title`, `due_date`, `start_date`, `is_completed`, `notes`, `visible_user_ids` |
| **`Comments`** | 任務即時討論留言串 | `id`, `task_id`, `user_id`, `content`, `created_at` |
| **`CaseTemplates`** | SOP 專案範本、預置描述與行前 Briefing 選項 | `id`, `template_name`, `description`, `group_names`, `default_description`, `briefing_options` |
| **`TemplateTasks`** | 範本標準待辦、相對偏移天數與備註 | `id`, `template_id`, `group_name`, `title`, `start_day_offset`, `due_day_offset`, `notes` |

---

## 🖥️ 3. 核心功能與 3 大檢視模式

### 📊 A. 個人待辦儀表板 (Personal Dashboard - 預設首頁)
- **智慧排序與狀態燈號**：自動依 🔴 過期 ➡️ 🟡 48H內急件 ➡️ 🔵 進行中 排序；當日截止日精確解析至 23:59:59 消除過期誤判。
- **互動操作**：列表中 0ms 原地動畫勾選完成、點擊案件名稱跳轉案件樹狀圖（帶閃爍高亮定位）、一鍵開啟討論抽屜。

### 📅 B. 日曆模式 (Calendar View)
- 支援死線狀態燈號（紅/黃/綠/藍）與「組別色彩優先 / 雙色混合 / 死線優先」3 種配色切換。

### 📋 C. 案件樹狀模式 (Case Tree View)
- **卡片管理**：標題採用 `text-xl font-bold` (20px)，預設收合帶有 `openCaseIds` 記憶；支援專案「📦 封存 / 🔓 解封」（封存案件可透過開關顯示，預設自儀表板與日曆隱藏）。
- **案件出發日自愈與排序**：自動從出發日或團號編碼（如 `JX260916A`）提取日期並升序排列，直顯出發日小標籤。
- **編輯案件內建批量權限設定**：編輯案件時可直接勾選人員，提供「➕ 批量加入 (預設)」、「🔄 覆蓋重設」、「⏸️ 不變更」3 種模式一鍵套用至該案件所有待辦。
- **即時留言氣泡預覽與抽屜背景拉取**：樹狀圖直顯最新留言氣泡與 `+X 則討論` 徽章；點擊待辦開啟抽屜時背景自動拉取雲端最新留言串 (`getTaskComments`)，支援 `Enter` 快捷送出與 inline 編輯。
- **⚡ 雙向時程偏移計算機 (Date Calculator)**：
  - 任務抽屜內建折疊式時程推算工具，支援專案出發日（`reference_date`）或指定基準日。
  - 支援「◀ 往前 (行前倒算)」與「▶ 往後 (團後順推)」，可勾選「`[v] 僅計臺灣工作天`」自動避開週末與國定假日（支援補班日計算）。
  - 提供即時推算預覽與「⬅️ 套用為開始日」/「➡️ 套用為截止日」一鍵填入並自動批量儲存。

---

## ⚙️ 4. 部署方式與 AI 合作協議

### 🚀 GAS 部署指南
1. 於 Google 試算表開啟 **擴充功能 ➔ Apps Script**，同步 [Code.js](file:///d:/Projects/CaseFlow_OS/Code.js)。
2. Web App 執行身分為 `USER_DEPLOYING`（我），存取權限為 `ANYONE_ANONYMOUS`（所有人）。
3. 前端 [index.html](file:///d:/Projects/CaseFlow_OS/index.html) 設定 `GAS_API_URL` 即可完成雙向連線。

### 🤝 AI 自動化部署協議
- AI 完成程式碼修改與驗證後，全權代理執行以下流程：
  1. `clasp push`（推播 GAS 雲端）
  2. `clasp deploy -i [Deployment_ID]`（更新固定主要 Web App 發布版本）
  3. `git commit` & `git push`（同步 GitHub 儲存庫）
- 使用者僅於最終發布環境進行功能驗證。

---

## 🛠️ 5. 開發歷程與里程碑 (Milestones Log)

| 階段與日期 | 里程碑核心成果 | 版本 |
| :--- | :--- | :--- |
| **Phase 1** (2026-08-17) | 建立專案基礎設施、ORM 模型、權限過濾、FullCalendar 基礎整合。 | MVP |
| **Phase 2** (2026-08-18) | GAS 無伺服器移轉、Google Sheets 資料庫落地、多語系 (zh-TW / vi-VN) 字典。 | v0.2 |
| **Phase 3** (2026-08-19) | 全站樂觀更新 (0ms 響應)、Task/Case CRUD 與聯動刪除、任務組 10 色彩盤管理。 | v0.3 |
| **Phase 4** (2026-08-20) | 臺灣工作天計算引擎（國定假日與補班日判定）、Roles 防禦性初始化與權限重構。 | v0.4 |
| **Phase 5** (2026-08-26) | 案件範本系統、個人儀表板、單通道極速載入 (`getInitialData` <0.3s)、`SpreadsheetApp.flush()` 強制落盤、`silent = true` 靜音背景同步。 | v0.5 |
| **Phase 6** (2026-08-31) | 案件封存與解封機制、Checkbox 0ms 極速響應 (`requestAnimationFrame`)、抽屜日期批次儲存按鈕、Email 白名單門禁 (`#login-modal`)、Super Master 單向 PIN (`8888`)、頂端安全身分指示器。 | v0.6 |
| **Phase 7** (2026-09-01) | 案件批量人員權限持久化修復 (`batchUpdateCaseTaskVisibility` + `parseInt`)、GAS 後端改採記憶體 2D 陣列單次 `setValues` 批次寫入（寫入耗時降至 <0.05s，效能提升 200 倍）、前端 `renderActiveViewOnly` 視圖懶加載。 | `@46` |
| **Phase 8** (2026-09-02) | 討論留言 0ms 樂觀更新與背景視圖即時連動（氣泡預覽與徽章同步）、開抽屜背景動態拉取最新留言串 (`getTaskComments`)、鍵盤 `Enter` 快捷送出、留言 CRUD 權限控管。 | `@47` |
| **Phase 9** (2026-09-03) | ⚡ 任務抽屜雙向時程偏移計算機（行前倒算/團後順推 + 臺灣國定假日/補班工作天計算引擎 + 一鍵套用）、Super Master 全域穿透檢視權限、移除 GET 迴圈寫入操作提升效能。 | `@50` |
| **Phase 10** (2026-09-03) | 待辦勾選 0ms 極速原地 DOM 更新 (In-place Mutation)、解耦視圖同步重繪、全站視圖 Dirty 標記與切換按需懶加載 (Lazy Evaluation)。 | `@51` |
| **Phase 11** (2026-09-03) | 移除甘特圖模式（減重前端架構與消除依賴庫負載）、儀表板 0ms 原地動畫回饋 (`dashboard-task-row` in-place mutation) 與平滑重繪、清除殘留字典（正式基準點）。 | `@53` |
| **Phase 12** (2026-09-03) | 📱 手機視角與響應式重構：側邊欄轉為行動抽屜 (Drawer) + 漢堡選單按鈕 + 背景遮罩 + 切換分頁自動收合；案件樹狀排版自適應與任務抽屜全寬優化。 | `@54` |

---

## 🔮 6. 未來展望與待辦事項 (Future Roadmap)

1. **📧 即時 Google Workspace 通訊通知**：討論串 `@同事` 時自動觸發 MailApp 或 Gmail/Chat 郵件提醒。
2. **📁 雲端硬碟檔案直接上傳**：於抽屜組件中支援直接上傳圖片/PDF 至該 Case 的 `drive_url` 資料夾。
3. **📊 高級統計與專案報告匯出**：一鍵匯出專案進度報告（PDF/Excel）與過期任務統計。
4. **📶 離線快取與 PWA 支援**：導入 Service Worker 與 LocalStorage 快取，支援離線唯讀查詢。
5. **🔗 任務相依性關聯 (Task Dependencies)**：支援前置任務連鎖關聯與延期警告提示。
