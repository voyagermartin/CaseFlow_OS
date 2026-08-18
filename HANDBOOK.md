# 📖 CaseFlow OS 員工操作手冊 (Employee Handbook)

歡迎來到 **CaseFlow OS**！本手冊旨在幫助新進夥伴、實習生與工讀生在「第一天第一小時」就能光速上手。這套系統是我們團隊高效協作的秘密武器，請務必詳細閱讀以下指南。

---

## 🌟 1. 什麼是 CaseFlow OS？

### 💡 核心定位與設計理念
**CaseFlow OS** 是一個以 **Google Workspace (Google Sheets / Google Drive)** 為底層雲端資料庫、並以 **GitHub Pages** 為前端介面的「事件驅動作業系統 (Event-Driven OS)」。

> 🛠️ **技術與架構規格 (Phase 3 Checkpoint)**
> 本系統採用 **Google Apps Script (GAS)** 作為後端核心 API 框架，底層使用 **Google Sheets (試算表)** 進行雲端資料儲存與權限隔離設計。前端架構採用 **Tailwind CSS**，並深度整合 **FullCalendar v6** (日曆模式) 與 **Frappe Gantt** (甘特圖模式)，可直接部署於 **GitHub Pages** 提供無伺服器 (Serverless) 的流暢單頁應用 (SPA) 體驗。

我們不用傳統的 LINE 群組或紙本流水帳，因為 LINE 容易洗版、文件會過期、責任歸屬模糊；而流水帳缺乏結構，無法一眼看出優先順序。CaseFlow OS 透過自動化的網頁視圖，將所有資料與進度即時呈現在你的眼前，並嚴格遵循以下三大鐵律：

| 鐵律名稱 | 核心精神 | 具體表現 |
| :--- | :--- | :--- |
| **1. 不漏球 (Zero-Miss)** | 凡事有交代，件件有落地。 | 每個待辦細項都有明確的 **截止日 (Due Date)** 與狀態燈號，絕對不遺漏任何細節。 |
| **2. 責任明確 (Clarity)** | 誰能看、誰負責，一目了然。 | 任務狀態透明。可指定特定可見成員，進行**任務級的權限隔離**，避免無關資訊轟炸或洩密。 |
| **3. 視圖自由 (Flexibility)** | 不同角色，看他最需要的畫面。 | 提供**日曆模式**抓今日死線、**樹狀案件**處理細節，以及**甘特圖**掌控專案整體進度。 |

---

## 🗄️ 2. 官方雲端資料庫（Google Sheets 架構）

本系統所有資料皆安全地儲存在我們的官方 Google 試算表中：
👉 **[官方雲端資料庫 Google Sheets 連結](https://docs.google.com/spreadsheets/d/19NBQmVYYCg3ej3DDBrX0f3Zb1Ueougr-m-8xQHoK6Jk/edit?gid=0#gid=0)**

試算表內包含以下 **4 張核心工作表**，它們共同組成了系統的資料引擎：

### ① `Users` (成員與語系)
* **作用**：管理系統使用者帳號、角色、識別顏色與介面語系。
* **欄位結構**：`id` (編號)、`username` (姓名/代號)、`role` (角色職位)、`avatar_color` (頭像顏色)、`language` (偏好語系，例如 `zh-TW` 或 `vi-VN`)。

### ② `Cases` (專案總表與 Drive 掛載點)
* **作用**：記錄所有進行中的大案件/專案，並綁定對應的 Google Drive 雲端資料夾連結。
* **欄位結構**：`id` (編號)、`title` (案件名稱)、`description` (描述)、`owner_id` (負責人ID)、`drive_url` (Google Drive 資料夾連結)、`group_names` (預設任務組別，以逗號分隔)。

### ③ `Tasks` (待辦細項、死線與權限)
* **作用**：存放所有專案下的具體執行細項（To-Do）。
* **欄位結構**：`id` (編號)、`case_id` (關聯案件ID)、`group_name` (任務組別，如票務、住宿)、`title` (任務標題)、`due_date` (截止日期)、`start_date` (開始日期)、`is_completed` (是否完成，`TRUE`/`FALSE`)、`notes` (執行備註，存放廠商電話、預定代號等)、`visible_user_ids` (可見人員ID，以逗號分隔，例如 `1,2,3`)。

### ④ `Comments` (項目留言討論串)
* **作用**：任務下方的留言板，用於成員針對單一待辦細項進行精準討論。
* **欄位結構**：`id` (編號)、`task_id` (關聯任務ID)、`user_id` (留言者ID)、`content` (留言內容)、`created_at` (建立時間)。

---

## 🖥️ 3. 3 大檢視模式操作教學

系統提供三種視角，應對不同的日常工作場景：

### 📅 模式 A. 日曆模式 (Calendar View)
* **今日行動指南**：每天早上進公司第一件事，就是打開日曆模式，查看紅黃綠燈！
  * 🔴 **紅色燈號**：已過期且未完成。**請立刻處理！** 遇有困難主動向主管回報，切勿放任紅燈高掛。
  * 🟡 **黃色燈號**：今天或 48 小時內即將到期。這是你的「今日首要任務」。
  * 🟢 **綠色燈號**：已完成。代表任務已安全落地。
  * 🔵 **藍色燈號**：未完成但距離死線仍有 48 小時以上，可按計畫推進。

### 📋 模式 B. 案件模式 (Case Tree View)
* **細節處理與溝通**：
  1. **展開卡片**：點擊案件卡片標題可展開/收合。卡片內會依「任務分組」排列待辦細項。
  2. **勾選完成**：直接勾選任務旁的核取方塊，系統會即時更新狀態並同步至 Google Sheets。
  3. **快速新增**：在組別下方輸入標題與日期，點擊「新增」即可在該組別下建立新任務。
  4. **任務詳情與留言**：點擊任務文字可打開右側抽屜，在此填寫「執行備註」，或使用 **`@同事名字`** 進行精準討論，訊息不再被無關群組洗版。

### 📊 模式 C. 甘特圖模式 (Gantt View)
* **全景時程地圖**：提供日、週、月切換。主管與專案負責人可在此一目了然看清各專案的起迄時間跨度，以及深色區塊所代表的「進度百分比 (%)」。

---

## 🌐 4. 多國語言 (i18n) 與視角切換

為了支援跨國協作（例如台灣辦公室與越南當地 Local Agent 的對接），CaseFlow OS 內建了**多國語言即時翻譯引擎**：

* **身分切換**：在網頁頂端「當前人員」下拉選單中切換角色，系統會自動根據該使用者在 `Users` 表格中設定的語系切換介面。
* **自動翻譯**：
  * 當切換至 `Martin` / `OP_Ning` / `Sales_Yang` 時，介面會顯示為**繁體中文 (zh-TW)**。
  * 當切換至跨國夥伴 `Local_Nguyen` 時，介面與所有按鈕、提示將自動無縫轉換為**越南文 (Tiếng Việt)**，讓溝通零障礙！

---

## ⚙️ 5. 系統部署與 API 連線指南（管理員專用）

若您是系統管理員，欲將本系統部署至新的 Google 試算表，請遵循以下步驟：

### 第一步：貼上並部署 Apps Script 後端
1. 打開您的 Google 試算表，點選上方選單的 **「擴充功能」➔「Apps Script」**。
2. 將本專案中的 [Code.gs](file:///d:/Projects/CaseFlow_OS/Code.gs) 內容完整複製，並貼入 Apps Script 的編輯器中（覆蓋預設的 `Code.gs`）。
3. 在編輯器上方選單中，點選執行 **`initDatabase`** 函式。這會自動在試算表中建立 `Users`, `Cases`, `Tasks`, `Comments` 四張工作表並寫入示範資料。
4. 點選編輯器右上角的 **「部署」➔「新增部署」**：
   * **選取類型**：網頁應用程式 (Web App)
   * **說明**：例如 `CaseFlow API v1`
   * **將網頁應用程式執行為**：我 (您的 Google 帳號)
   * **誰有權限存取**：所有人 (Anyone)
5. 點選「部署」並授權存取。部署完成後，複製產生的 **「網頁應用程式 URL」**。

### 第二步：連接前端介面
1. 打開本系統網頁 [index.html](file:///d:/Projects/CaseFlow_OS/index.html)。
2. 在網頁頂端的「GAS API URL」輸入框中，貼上剛剛複製的網頁應用程式 URL。
3. 系統將會自動將連線切換至您真實的 Google Sheets，開始即時同步資料。
4. *註：若輸入框留空，系統將會自動運作於「內建 Demo 模式」，使用本機記憶體進行測試模擬。*

---

## 🛠️ 開發日誌 (Development Log)

### 📅 2026-08-17 - 核心 MVP 基礎建設與三視圖實作
- **專案骨架與環境搭建**：初始化 Git 儲存庫並配置 Python 3.12 虛擬環境 (`.venv`) 與 `requirements.txt`。
- **資料庫與 ORM 模型設計**：建置 `database.py` 及定義 `User`、`Case`、`TaskGroup`、`TaskItem`、`TaskComment` 及權限關聯表。
- **資料過濾與安全查詢 (CRUD)**：實作 `get_user_cases` 查詢，確保未授權成員無法讀取特定任務、備註與留言，避免資訊洩漏與超載。
- **示範資料生成器 (Seed)**：實作 `seed.py` 自動建立專案管理員 (Martin)、作業 (OP_Ning)、銷售 (Sales_Yang)、實習生 (Intern_A) 角色，並自動寫入包含 3 大任務分組與 4 項待辦細項的怡保專案出團示範資料。
- **全視圖儀表板與 API 串接**：完成 templates/index.html 的實作，整合 FullCalendar v6 與 Frappe Gantt，並透過網頁頂端「使用者切換下拉選單」動態刷新 API，達成無縫權限展示與任務狀態勾選更新。

### 📅 2026-08-18 - 無伺服器試算表資料庫移轉與多國語言 (i18n) 實作
- **後端架構移轉**：將後端 API 完全遷移至 **Google Apps Script (Code.gs)**，使用 **Google Sheets** 作為雲端資料庫，並將舊的 Python/SQLite MVP 移入 `archive_python_mvp/`。
- **資料庫初始化**：在 `Code.gs` 中實作 `initDatabase()`，自動在試算表中建立 `Users`, `Cases`, `Tasks`, `Comments` 四張工作表並寫入示範資料。
- **前端 SPA 介面現代化**：在根目錄重寫 [index.html](file:///d:/Projects/CaseFlow_OS/index.html)，支援輸入 GAS Web App URL 進行連線，並實作完整的**本機 Mock 測試引擎**（無 URL 時自動切換為本機模擬運行）。
- **多國語言 (i18n) 與身份切換**：新增繁體中文 (zh-TW) 與越南文 (vi-VN) 翻譯字典。當人員選單切換至跨國夥伴 `Local_Nguyen` 時，介面與提示自動翻譯為越南文。
- **GitHub Pages 部署優化**：移除非必要目錄，使專案可以直接透過 GitHub Pages 發佈，達成零伺服器維護成本之專案管理系統。
- **視覺與安全防護優化**：新增 AI 生成之 CaseFlow OS 專屬 Logo (`logo.jpg`)，將其設為網頁 Header 標誌與瀏覽器 Favicon，並加入 robots meta 標籤與 `robots.txt` 檔案，全面阻擋搜尋引擎與爬蟲蒐集網頁內容。
