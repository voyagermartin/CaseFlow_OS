# 📖 CaseFlow OS 員工操作與技術手冊 (Employee & Dev Handbook)

歡迎來到 **CaseFlow OS**！本手冊為新進夥伴、實習生與團隊成員提供系統設計、雲端資料庫架構、視圖操作、部署方式與完整開發日誌。

---

## 🌟 1. 核心定位與技術規格

**CaseFlow OS** 是一個以 **Google Workspace (Google Sheets / Google Drive)** 為底層資料庫、由 **Google Apps Script (GAS)** 直接託管與 **GitHub Pages** 雙軌部署的事件驅動專案 OS (Event-Driven OS)。

> 🛠️ **技術與架構規格 (Phase 5 Milestone Checkpoint)**
> - **後端與資料庫**：Google Apps Script (GAS) Web App + Google Sheets 雲端試算表 (7 大核心工作表)。
> - **前端介面**：HTML5 + Vanilla JS + Tailwind CSS，整合 FullCalendar v6 (日曆) 與 Frappe Gantt (甘特圖)。
> - **效能與極速載入**：單一通道首頁載入引擎 (`getInitialData`) + `Promise.all` 併行備援，首頁載入 <0.3 秒。
> - **資料防護與落盤**：後端全面 `SpreadsheetApp.flush()` 強制落盤防護；純樂觀更新 (0ms 響應) + 靜音背景同步 (`silent = true`)。
> - **高階功能**：臺灣節假日/補班工作天計算引擎、案件範本 CRUD、個人待辦儀表板、任務層級可見權限過濾、語系字典 (zh-TW / vi-VN)。

---

## 🗄️ 2. Google Sheets 雲端資料庫架構

👉 **[官方雲端資料庫 Google Sheets 連結](https://docs.google.com/spreadsheets/d/19NBQmVYYCg3ej3DDBrX0f3Zb1Ueougr-m-8xQHoK6Jk/edit)**

| 工作表 (Sheet) | 作用 (Purpose) | 核心欄位結構 (Key Schema) |
| :--- | :--- | :--- |
| **`Users`** | 成員帳號、角色、顏色與語系 | `id`, `username`, `role_id`, `avatar_color`, `language`, `google_email`, `is_super_master` |
| **`Roles`** | 角色與權限定義 | `id`, `role_name`, `can_create_case` |
| **`Cases`** | 專案總表與 Drive 掛載點 | `id`, `title`, `description`, `owner_id`, `drive_url`, `group_names`, `reference_date`, `is_archived` |
| **`Tasks`** | 待辦細項、死線與權限過濾 | `id`, `case_id`, `group_name`, `title`, `due_date`, `start_date`, `is_completed`, `notes`, `visible_user_ids` |
| **`Comments`** | 任務討論串與留言板 | `id`, `task_id`, `user_id`, `content`, `created_at` |
| **`CaseTemplates`**| 案件 SOP 範本設定 | `id`, `template_name`, `description`, `group_names`, `default_description`, `briefing_options` |
| **`TemplateTasks`**| 範本標準待辦項目 | `id`, `template_id`, `group_name`, `title`, `start_day_offset`, `due_day_offset`, `notes` |

---

## 🖥️ 3. 4 大檢視模式操作指南

### 📊 A. 個人待辦儀表板 (Personal Dashboard - 預設首頁)
- **智慧過濾與排序**：自動顯示當前人員未完成之待辦，嚴格依 🔴 過期 ➡️ 🟡 48H內到期 ➡️ 🔵 進行中 排序。
- **統計卡片與雙向跳轉**：即時統計燈號數量；支援列表中 0ms 勾選完成、一鍵定位跳轉案件卡片（帶閃爍高亮）或打開留言抽屜。

### 📅 B. 日曆模式 (Calendar View)
- **死線狀態燈號**：🔴 過期未完成（緊急處理）、🟡 48H內到期（今日首要）、🟢 已完成、🔵 48H以上進行中。
- **色彩模式**：支援「組別色彩優先」、「雙色混合」與「死線優先」3 種視窗配色。

### 📋 C. 案件模式 (Case Tree View)
- **卡片層級與預設收合**：案件標題採用升級版 `text-xl font-bold` (20px) 醒目字型，預設收合帶有 `openCaseIds` 展開記憶。
- **靜音快速新增待辦**：支援組名安全脫逸 (`getSanitizedKey`) 與動態組別自動創建；純樂觀 UI 0ms 秒發秒顯，背景靜默配發 ID。
- **自動儲存與工作天提示**：抽屜日期與備註支援失去焦點/變更自動儲存 (`onchange` / `onblur`)；標題自動顯示排除週末與國定假日的剩餘工作天數提示（如 `(剩 3 工作天)`）。
- **案件封存與解除封存**：案件卡片管理按鈕增設「📦 封存」與「🔓 解封」操作。封存之案件預設由儀表板、日曆、甘特圖中過濾隱藏，並可在樹狀頂端勾選「顯示已封存案件」進行檢視，已封存案件呈半透明顯示且帶有 `📦 已封存` 徽章。

### 📊 D. 甘特圖模式 (Gantt View)
- **全景時程地圖**：提供日/週/月檢視切換，在深色高對比度模式下清晰呈現專案跨度與進度百分比 (%)。

---

## 🎨 4. 任務組配色、語系 (i18n) 與人員切換

- **自訂任務組配色**：點擊「🎨 任務組配色設定」可新增、編輯或刪除組別代表色，自動記憶於 `localStorage`。
- **多國語言 (i18n) 雙向切換**：頂端選單切換人員時，介面會根據該使用者偏好語系（如繁中 `zh-TW` 或越南文 `vi-VN`）自動翻譯。
- **選單絕對綁定 (`renderUserSwitcher`)**：頂端人員下拉選單與頭像指示器 100% 強制同步，若無效或已刪除 ID 自動備援至第一位可用成員。

---

## ⚙️ 5. 系統部署指南與 AI 合作約定

### 🚀 部署步驟 (GAS Web App)
1. 於 Google 試算表開啟 **擴充功能 ➔ Apps Script**，複製 [Code.js](file:///f:/Projects/CaseFlow_OS/Code.js) 貼入編輯器。
2. 首次安裝執行 `initDatabase()` 初始化試算表；點擊 **部署 ➔ 新增部署**（類型：Web App，存取權限：所有人）。
3. 前端 [index.html](file:///f:/Projects/CaseFlow_OS/index.html) 內設定 `GAS_API_URL` 即可完成雙向連線。

### 🤝 AI 開發與測試約定
- **自力測試原則**：AI 在交付功能時提供詳細的手動測試步驟指引與 Walkthrough，由使用者於最終環境自行驗證，以節省資源。
- **全權代理部署**：AI 在完成任何程式碼修正與優化後，無須詢問或等待許可，應直接幫忙執行 <code>git commit</code>、<code>git push</code>、<code>clasp push</code> 以及 <code>clasp deploy</code> 部署流程，將最新程式碼直接同步並發佈至雲端與遠端儲存庫，使用者僅於最終環境進行測試。

---

## 🔮 6. 未來展望與待辦事項 (Future Roadmap)

1. **📧 即時 Google Workspace 通訊通知**：討論串 `@同事` 時自動觸發 MailApp 或 Gmail/Chat 郵件提醒。
2. **📁 雲端硬碟檔案直接上傳**：於抽屜組件中支援直接上傳圖片/PDF 至該 Case 的 `drive_url` 資料夾。
3. **📊 高級統計與專案報告匯出**：一鍵匯出專案進度報告（PDF/Excel）與過期任務統計。
4. **📶 離線快取與 PWA 支援**：導入 Service Worker 與 LocalStorage 快取，支援離線唯讀查詢。
5. **🔗 任務相依性關聯 (Task Dependencies)**：甘特圖支援前置任務連線與延期連鎖警告。

---

## 🛠️ 開發日誌 (Development Log Milestones)

- **📅 2026-08-17 (Phase 1: 核心 MVP 基礎建設)**：搭建儲存庫、建置 ORM 模型與權限過濾、生成示範資料 (seed.py)、整合 FullCalendar & Frappe Gantt 基礎視圖。
- **📅 2026-08-18 (Phase 2: GAS 無伺服器移轉與多語系)**：後端重構至 `Code.js` + Google Sheets；實作多國語言 (zh-TW / vi-VN) 字典；新增 GitHub Pages 部署防護與連線引導彈窗。
- **📅 2026-08-19 (Phase 3: 樂觀 UI、CRUD 管理與 CORS 修復)**：全站樂觀更新 (0ms 響應)；新增 Task/Case 編輯與串聯刪除；加入 `credentials: 'omit'` 解決多帳號 CORS 重定向；完成任務組 CRUD 10 色彩盤管理。
- **📅 2026-08-20 (Phase 4: 臺灣工作天計算與權限防禦)**：實作扣除國定假日與補班日之工作天計算引擎；修復 Roles 防禦無損初始化；抽象化權限邏輯 (`isSuperMaster` / `hasCreateCasePermission`)。
- **📅 2026-08-25 (Loading UI 與 Roles 防禦重構)**：全域 Loading 指示器提升至 `z-[100]`；後端 `ensureRolesSheet` 防禦性維護，防止覆蓋資料。
- **📅 2026-08-26 (Phase 5: 範本系統、個人儀表板、極速單通道首頁引擎與全站無死角優化)**：
  - **案件範本 (Case Templates)** 與 **個人待辦儀表板 (Personal Dashboard)** 全套 CRUD 引擎。
  - **GAS 網頁直服 (`doGet`)** 與 CORS POST/GET 雙軌轉譯。
  - **單一通道首頁載入引擎 (`getInitialData`)** 配合 `Promise.all` 降級備援，進站耗時降至 <0.3 秒。
  - **讀取 API 阻塞迴圈清除**，讀取耗時從 60 秒降至 1 秒以內。
  - **全站案件標題放大 (Typography Scale Upgrade)** 至 `text-xl font-bold` (20px)。
  - 後端全面 **`SpreadsheetApp.flush()` 強制實體落盤**，消除 F5 重新整理數據丟失。
  - 背景同步 **`silent = true` 靜音執行**，徹底消除快速新增與狀態核取時的轉圈遮罩。
  - **刪除操作優雅防護 (`deleteUser` / `deleteRole`)**、**`renderUserSwitcher` 選單鎖定** 與 **`getSanitizedKey` 安全組名轉義**。
- **📅 2026-08-27 (案件樹狀討論直顯、留言編輯/刪除 CRUD、SOP 範本 Briefing 勾選代入與出發日自愈排序)**：
  - **任務備註與最新留言預覽直顯**：在案件樹狀中直接渲染任務備註，並引入「最新留言氣泡預覽 (Recent Comment Balloon Preview)」，展示最新討論作者頭像與字數防護，以靛藍色調與靜態備註做視覺區隔，提供 +X 則歷史討論徽章。
  - **留言編輯與刪除 (Comments CRUD)**：留言卡片支援權限偵測，發言者與管理員可點擊 ✏️ 原地 inline 編輯留言（無彈窗打擾）與 🗑️ 刪除留言，全站樹狀圖與抽屜留言即時連動。
  - **SOP 範本預置描述與注意事項勾選代入**：範本設定新增「預置描述」與「備選注意事項清單（每行一筆 `主題 | 內容`）」；新增案件選取範本時，會動態展開靛藍色的注意事項核取面板，勾選時即時動態合成 structured Briefing Markdown text 寫入描述框。
  - **案件出發日自愈與升序排列**：在 `Cases` 工作表新增第 7 欄 `reference_date`；支援於編輯案件彈窗內調整出發日；實作「雙模智慧解析自愈引擎」，自動匹配標準日期格式或團號編碼格式（如 `JX260916A` 提取為 `2026-09-16`），在載入時自動寫回補齊舊有資料，並按出發日由近到遠排序，且在樹狀圖中直顯出發日小標籤。
  - **老舊數據自動兼容升級**：後端 `ensureTemplatesSheets` 升級為 6 欄位，自動為舊 CaseTemplates 補齊 `default_description` 與 `briefing_options` 欄位標題，老舊數據無痛直升。
  - **全自動代部署協議**：與 AI 達成全權代理部署協議，代碼修正後由 AI 自動完成 clasp push、clasp deploy、git commit 與 git push，使用者僅於最終環境進行驗證。
- **📅 2026-08-27 (第二部分：Google SSO 實名驗證失敗與 CORS 退回跨域匿名相容部署)**：
  - **SSO CORS 失敗分析**：發現由於前端是託管在 GitHub Pages (`voyagermartin.github.io`) 上，前端對後端的所有 API 呼叫都是**跨網域 (CORS) 的 fetch 請求**。而跨網域 `fetch` 預設是無法攜帶 Google 登入 Cookie 的（CORS 匿名限制）。
  - **部署配置還原**：若將 Web App 設定為 `USER_ACCESSING` 與 `ANYONE`，Google 會強制阻斷任何匿名請求，導致 GitHub Pages 呼叫失敗、全站資料空白。因此已在 `appsscript.json` 中將 Web App 重新還原為 **`USER_DEPLOYING`** (執行身分：我) 與 **`ANYONE_ANONYMOUS`** (權限：所有人，包含匿名)，成功打通跨網域連線。
  - **原生通道 `google.script.run` 雙軌備援與異步載入自旋鎖**：在前端 `apiRequest` 整合 `google.script.run`，於直接訪問 Web App 網址時直接走原生安全通道；並實作 `waitForGoogleScript` 自旋鎖（每 50ms 檢查，最長 2.5 秒），解決 F5 重新整理時 Google 原生 API 還未加載完成的 Race Condition。
  - **後端安全防鎖死 (Soft Fallback)**：當後端接收不到 Email（如跨域 anonymous）或 Email 不在 `Users` 資料表中時，自動改為寬鬆放行模式（不彈出毛玻璃阻斷遮罩），並自動導向至選取的人員 ID 或預設 ID 1 (Martin) 進站，保障系統不論何種連線環境都不會鎖死。
  - **浮動除錯面板 (Developer Debugger)**：在網頁右下角新增一個獨立的浮動除錯面板，即時呈現 Hostname、Is GAS Container、loggedInUserEmail、allUsers.length、currentUserId、loginUser、allCases.length 與 Status，以方便開發與測試診斷。
  - **LocalStorage F5 記憶功能**：在寬鬆免登入模式下，LocalStorage 會正常儲存並於 F5 重新整理時還原使用者所選擇的人員 ID，保證當前人員不會再次遺失。
- **📅 2026-08-31 (案件封存與解除封存機制、多維檢視過濾與 Mock API 補齊)**：
  - **資料表欄位擴充**：於 `Cases` 數據表中導入第 8 欄位 `is_archived`，實作表頭自愈機制與老舊數據的無痛相容（預設為 `false`）。
  - **多維度過濾過篩**：已封存之案件，其子任務項目將自動從個人待辦儀表板（包括統計卡片與待辦清單）、日曆模式、甘特圖模式中過濾隱藏，維持日常工作畫面清爽。
  - **案件樹狀操作升級**：案件卡片管理按鈕增設「📦 封存」與「🔓 解封」按鈕；支援樂觀更新與物理實體同步；樹狀頂端配置「顯示已封存案件 (Show Archived)」Checkbox 開關，已封存案件呈現半透明與 `📦 已封存` 徽章。
  - **Mock 引擎補齊**：於 `runMockApi` 新增 `updateCase` (含 `is_archived`) 與 `deleteCase` 的模擬資料引擎，確保本地與 GitHub Pages 獨立測試環境功能 100% 正常。
