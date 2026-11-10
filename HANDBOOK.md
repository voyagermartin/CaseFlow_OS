# 📖 CaseFlow OS 員工操作與技術手冊 (Handbook)

歡迎來到 **CaseFlow OS**！本手冊統整系統架構、雲端資料庫規範、核心功能操作、部署協議、歷史開發里程碑與未來 Roadmap。

---

## 🌟 1. 系統定位與核心架構

**CaseFlow OS** 是一個以 **Supabase Cloud PostgreSQL** 為核心即時雲端資料庫，透過 **Supabase Client-side SDK (JavaScript)** 與 **GitHub Pages** 雙軌運作的事件驅動專案作業系統 (Event-Driven OS)。

### 🛠️ 技術規格
- **後端與資料庫**：Supabase Cloud PostgreSQL 雲端資料庫（7 大核心資料表：`roles`, `users`, `cases`, `tasks`, `comments`, `case_templates`, `template_tasks`）。
- **前端介面**：HTML5 + Vanilla JS + Tailwind CSS + `@supabase/supabase-js v2`，整合 FullCalendar v6（日曆）。
- **輔助後端服務**：Google Apps Script (GAS) Web App 負責自動化串接（如 Google Drive 資料夾建立、檔案處理）。
- **極速效能與 Realtime 架構**：
  - **資料層與歷史資料備份**：淘汰原本 GAS Web App 之 HTTP Table Lock 與寫入延遲，改採 **Supabase Client SDK 直接讀寫 PostgreSQL**，具備 ACID 特性與外鍵級聯刪除 (`ON DELETE CASCADE`)；原試算表歷史案件、待辦與留言已完整無損匯入。
  - **即時連線 (WebSocket Realtime)**：掛載 Supabase Realtime 頻道監聽 (`tasks`, `cases`, `comments`)，團隊成員異動資料時自動無感刷新全站視圖。
  - **主鍵序號自愈與容錯寫入 (`safeInsert`)**：內建 `safeInsert` 自動捕捉 `23505 duplicate key` 錯誤，0ms 動態以 `max(id) + 1` 恢復重試，確保留言與任務寫入 100% 成功。
  - **前端效能**：`Promise.all` 7 表併行載入 (`loadSupabaseData`)；`renderActiveViewOnly` 視圖懶加載與原地 DOM 變更 (In-place Mutation)，待辦勾選 0ms 立即響應。
- **行動優先與自適應字級架構 (Mobile-First UX)**：
  - **行動抽屜選單**：`<1024px` 預設隱藏側邊欄，透過頂欄 ☰ 漢堡按鈕與毛玻璃遮罩展開，切換分頁自動平滑收合。
  - **個人化字級調節器 (Font Scaler)**：動態控制根元素 `html.font-scale-*`（標準 16px / 舒適 18px / 大字 20px），透過 `localStorage` 跨裝置持久化記憶。
  - **44px 拇指友善觸控**：加大 Checkbox (`h-5 w-5`) 與按鈕熱區，輸入框防 iOS Safari 點擊自動拉近放大。
- **門禁與權限控管**：
  - **Email 白名單門禁**：以 `users.google_email` 為進站名單（`#login-modal`）。
  - **Super Master 穿透權限**：`Martin` (`id: 1` / `is_super_master: true`) 具全域穿透檢視權限與單向 PIN 碼鎖（`ADMIN_PASSCODE: 8888`）。
  - **動態 RBAC 權限體系**：由 `roles.can_create_case` 全域動態賦權，載入時由 `enrichUsersWithRoles` 動態注入使用者物件，涵蓋「新增案件」與「自由指派任務可見成員」雙重職能。
  - **案件操作安全解耦**：
    - `✏️ 編輯案件 / 批量人員指派`：開放 SuperMaster、案件建立者，以及具權限者（如 OP）。
    - `📦 封存案件 / 🔓 解除封存`：開放 SuperMaster、案件建立者，以及具權限者（如 OP）。
    - `🗑️ 永久刪除案件`：嚴格限定 SuperMaster 與案件原建立者。

---

## 🗄️ 2. Supabase Cloud PostgreSQL 資料庫架構 (7 大資料表)

👉 **Supabase Project URL**: `https://lzfiemnygaarzgvvonwt.supabase.co`  
👉 **Google Drive 母目錄 ID**: `1VH0znKP7xmG_UKF4BcqV6hb6c7c_BwMI`

| 資料表 | 作用 | 核心欄位結構 (Key Schema) |
| :--- | :--- | :--- |
| **`roles`** | 角色名稱與專案建立及成員指派權限定義 | `id`, `role_name`, `can_create_case` |
| **`users`** | 成員帳號、角色、顏色、語系與管理權限 | `id`, `username`, `role_id`, `avatar_color`, `language`, `google_email`, `is_super_master` |
| **`cases`** | 專案總表、Drive 掛載、出發基準日與封存 | `id`, `title`, `description`, `owner_id`, `drive_url`, `group_names`, `reference_date`, `is_archived` |
| **`tasks`** | 待辦項目、起訖死線、備註與可見人員 | `id`, `case_id`, `group_name`, `title`, `due_date`, `start_date`, `is_completed`, `notes`, `visible_user_ids` |
| **`comments`** | 任務即時討論留言串 | `id`, `task_id`, `user_id`, `content`, `created_at` |
| **`case_templates`** | SOP 專案範本、預置描述與行前 Briefing 選項 | `id`, `template_name`, `description`, `group_names`, `default_description`, `briefing_options` |
| **`template_tasks`** | 範本標準待辦、相對偏移天數與備註 | `id`, `template_id`, `group_name`, `title`, `start_day_offset`, `due_day_offset`, `notes` |

---

## 🖥️ 3. 核心功能與檢視模式

### 📊 A. 個人待辦儀表板 (Personal Dashboard - 預設首頁)
- **智慧排序與狀態燈號**：自動依 🔴 過期 ➡️ 🟡 48H內急件 ➡️ 🔵 進行中 排序；當日截止日精確解析至 23:59:59 消除過期誤判。
- **互動操作**：列表中 0ms 原地動畫勾選完成 (`dashboard-task-row` in-place mutation)、點擊案件名稱跳轉案件樹狀圖（帶閃爍高亮定位）、一鍵開啟討論抽屜。

### 📅 B. 日曆模式 (Calendar View)
- 支援死線狀態燈號（紅/黃/綠/藍）與「組別色彩優先 / 雙色混合 / 死線優先」3 種配色切換。

### 📋 C. 案件樹狀模式 (Case Tree View)
- **卡片管理**：標題採用自適應字級，預設收合帶有 `openCaseIds` 記憶；支援專案「📦 封存 / 🔓 解封」（封存案件可透過切換開關顯示）。
- **案件出發日自愈與排序**：自動從出發日或團號編碼提取日期並升序排列，直顯出發日大字徽章。
- **任務群組保底與即時新增**：無預設群組時自愈為「一般待辦」容器；案件底部內建「➕ 新增任務群組」即時展開式輸入工具，支援 `Enter` 快捷送出。
- **快速待辦建立**：標題與截止日支援按下 `Enter` 立即建立；OP 可自由指派「🔒 可見成員」。
- **批次人員權限**：編輯案件內建「➕ 批量加入」、「🔄 覆蓋重設」、「⏸️ 不變更」3 種模式一鍵套用至所有待辦。
- **討論抽屜與時程推算機**：任務抽屜直顯留言討論串，內建雙向時程偏移計算機（行前倒算/團後順推 + 臺灣國定假日/補班工作天計算引擎 + 一鍵套用）。
- **Google Drive 直連導航**：案件卡片「📂 雲端資料夾」按鈕與任務抽屜「📂 案件雲端資料夾」捷徑，點擊可直接在新分頁開啟該案件專屬雲端硬碟。

---

## ⚙️ 4. 部署方式與自動化協議

### 🚀 部署架構
1. **前端與靜態資源**：託管於 **GitHub Pages**，透過 `@supabase/supabase-js` 直接與 Supabase Cloud 連線。
2. **後端自動化**：託管於 **Google Apps Script**（Web App 發布），處理 Google Drive 自動化建檔與目錄建立。

### 🤝 AI 自動化部署協議
- 程式碼修改完成後，依序執行：
  1. `clasp push` 與 `clasp deploy`（若涉及後端 GAS 自動化）
  2. `git add .`
  3. `git commit -m "..."`
  4. `git push origin main`（觸發 GitHub Pages 自動部署）

---

## 🛠️ 5. 開發歷程與里程碑 (Milestones Log)

| 階段與日期 | 里程碑核心成果 | 版本 |
| :--- | :--- | :--- |
| **Phase 1~6** (2026-08) | 建立專案基礎設施、ORM 模型、多語系 (zh-TW / vi-VN)、臺灣工作天計算、個人儀表板、Email 門禁與 SuperMaster PIN 鎖。 | `v0.1` ~ `v0.6` |
| **Phase 7~11** (2026-09-01~03) | 案件批量權限持久化、討論留言 0ms 樂觀連動、雙向時程偏移計算機、待辦勾選 0ms 原地 DOM 更新、卸載甘特圖回歸輕量核心。 | `@46` ~ `@53` |
| **Phase 12~13** (2026-09-03) | 📱 手機響應式抽屜選單 (Drawer) + 漢堡按鈕；🔠 個人化字級調節器 (標準/舒適/大字) 與 44px 拇指友善觸控熱區。 | `@54` ~ `@57` |
| **Phase 14** (2026-09-27) | ⚡ 全面遷移至 Supabase PostgreSQL 雲端資料庫，無損匯入歷史資料，掛載 WebSocket Realtime 跨裝置靜默刷新。 | `v3.0` |
| **Phase 15** (2026-09-29) | 🛠️ PostgreSQL 序號自愈與 `safeInsert` 衝突容錯、群組「一般待辦」保底容器、即時「➕ 新增任務群組」與 `Enter` 快捷流。 | `v3.1` |
| **Phase 16** (2026-10-22) | 🛡️ 動態職位注入 (`enrichUsersWithRoles`)，全面落實 OP「新增案件」、「卡片編輯與批量指派」、「待辦可見人員指派」完整權限。 | `v3.2` |
| **Phase 17** (2026-11-10) | 📦 案件封存與解封權限重構：解耦「封存/解封」與「刪除」權限，正式開放 OP 執行案件封存/解封 (`canArchive`)，並加入防禦性權限檢查。 | `v3.3` |
| **Phase 18** (2026-11-10) | 📁 Google Drive 自動化目錄建置：發起新案件自動於 Drive 母目錄建立案件同名資料夾與 4 大子目錄 (`TKT`/`LOCAL`/`PP`/`INS`)，並自動回填 Supabase `drive_url`。 | `v3.4` |
| **Phase 19** (2026-11-10) | 🔐 GAS OAuth 授權鏈修復與雲端自動化實測驗證：補齊 `appsscript.json` 之 `oauthScopes`（Drive 完整讀寫與 External Request），新增 `testOrAuthorizeDrive` 診斷工具，修復 `DriveApp` 與 `UrlFetchApp` 權限阻擋，完成端點實測並為歷史案件 (Case #36) 補建資料夾。 | `v3.4.1` |

---

## 🔮 6. 未來展望與待辦事項 (Future Roadmap)

1. **📊 高級統計與專案報告匯出**：一鍵匯出專案進度報告（PDF / Excel）與逾期任務統計。
2. **📎 任務抽屜直傳檔案至 4 大子目錄**：支援於抽屜中直接上傳圖片/PDF 至該案件的 `TKT`、`LOCAL`、`PP`、`INS` 子目錄。
3. **📧 即時 Google Workspace 通訊通知**：討論串 `@同事` 時自動觸發 Gmail 郵件或 Google Chat 推播提醒。
4. **📶 離線快取與 PWA 支援**：導入 Service Worker 與 LocalStorage 快取，支援離線唯讀查詢。
5. **🔗 任務相依性關聯 (Task Dependencies)**：支援前置任務連鎖關聯與延期警告提示。

---

## 🎯 7. 當前開發基準點 (Current Benchmark Milestone)

> 本區塊作為後續功能擴充與 AI 協同開發的最新穩定起點。

* **目前系統版本**：`v3.4.1`
* **資料庫環境**：Supabase Cloud PostgreSQL (`https://lzfiemnygaarzgvvonwt.supabase.co`)
* **Google Apps Script 部署**：`@63` (`AKfycbz_YCRl9tS92Y7tR1GTaVOTMEV7pDmQv3mIN7MiAYwGGDli664-lcx5mg3JonyNRjexIg`)
* **Google Drive 生產母目錄 ID**：`1VH0znKP7xmG_UKF4BcqV6hb6c7c_BwMI`
* **OAuth 授權規格 (appsscript.json)**：
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive` (完整讀寫與目錄建立)
  - `https://www.googleapis.com/auth/script.external_request` (Supabase REST API 回寫)
* **功能驗證狀態**：
  1. ✅ **Google Drive 自動建檔與回寫**：建立案件即自動在母目錄建立案件同名資料夾（`日期_案件名稱`）與 4 大標準子目錄（`TKT`、`LOCAL`、`PP`、`INS`），並自動非同步透過 REST API 回填 Supabase `drive_url`。
  2. ✅ **專案導航直連**：案件卡片「`📂 雲端資料夾`」與任務抽屜「`📂 案件雲端資料夾`」快捷鍵均正常在新分頁開啟該案件目錄。
  3. ✅ **安全防護機制**：刪除專案時僅刪除資料庫案件與關聯項目，Google Drive 上實體資料夾與檔案安全留存不誤刪。
  4. ✅ **完整 RBAC 權限鏈**：OP（如 Josie, Ning, Apple）具備新增案件、編輯案件、批量指派成員、指定可見人員與「📦 封存 / 🔓 解封」完整權限；高風險「🗑️ 永久刪除案件」限定 SuperMaster 與建立者。
  5. ✅ **基礎架構穩定性**：`safeInsert` 主鍵衝突自動自愈、視圖懶加載 (Lazy Evaluation)、原地 DOM 更新 (In-place Mutation)、3 段個人化字級調節器穩定運作。
