# CakeResume 欄位規格
- 來源：尚未確認。初版依 JSON Resume 結構列出可能的欄位，欄位名稱與字數上限需執行 `/spec-update cakeresume` 補齊。
- 最後確認：未確認

| 區塊 | 欄位 | 類型 | 字數上限 | 對應 JSON 路徑 | 備註 |
|---|---|---|---|---|---|
| 基本資料 | 姓名 | 文字 | 待確認 | `basics.name` | |
| 基本資料 | 職稱／標題 | 文字 | 待確認 | `basics.label` | |
| 基本資料 | 居住地 | 下拉 | 待確認 | `basics.location.city` | |
| 基本資料 | 個人連結 | 網址 | 待確認 | `basics.url`, `basics.profiles[]`（排除 `hidden: true`） | |
| 自我介紹 | 自我介紹 | 富文本 | 待確認 | `basics.summary` | |
| 工作經歷 | 公司名稱 | 文字 | 待確認 | `work[].name` | |
| 工作經歷 | 職稱 | 文字 | 待確認 | `work[].position` | |
| 工作經歷 | 起訖時間 | 日期 | 待確認 | `work[].startDate`, `work[].endDate` | |
| 工作經歷 | 工作內容 | 富文本 | 待確認 | `work[].summary` + `work[].highlights[]` | |
| 學歷 | 學校 | 文字 | 待確認 | `education[].institution` | |
| 學歷 | 科系 | 文字 | 待確認 | `education[].area` | |
| 學歷 | 學位 | 下拉 | 待確認 | `education[].studyType` | |
| 學歷 | 起訖時間 | 日期 | 待確認 | `education[].startDate`, `education[].endDate` | |
| 技能 | 技能 | 標籤 | 待確認 | `skills[].keywords[]` | |
| 作品／專案 | 名稱 | 文字 | 待確認 | `projects[].name` | |
| 作品／專案 | 說明 | 富文本 | 待確認 | `projects[].description` + `projects[].highlights[]` | |
| 作品／專案 | 連結 | 網址 | 待確認 | `projects[].url` | |
| 語言能力 | 語言／程度 | 下拉 | 待確認 | `languages[].language`, `languages[].fluency` | |
