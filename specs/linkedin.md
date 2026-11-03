# LinkedIn 欄位規格
- 來源：LinkedIn 官方網域的說明文件（各列「備註」附網址）。不讀取 LinkedIn 頁面。
- 最後確認：2026-11-03

| 區塊 | 欄位 | 類型 | 字數上限 | 對應 JSON 路徑 | 備註 |
|---|---|---|---|---|---|
| Intro | Headline | 文字 | 220 字元 | `basics.label`（可結合 `basics.summary` 濃縮） | 多數位置只顯示前 60–65 字元，重點放前面。來源：https://business.linkedin.com/sell/resources/effective-sales-profile （官方銷售資源頁，非 Help 中心） |
| Intro | Location | 下拉 | — | `basics.location.city`, `basics.location.countryCode` | 選單選取，不需產出長文 |
| About | About | 文字 | 2,600 字元 | `basics.summary` | 來源：https://www.linkedin.com/business/talent/blog/product-tips/linkedin-profile-summaries-that-we-love-and-how-to-boost-your-own （官方 Talent Blog，非 Help 中心） |
| Experience | Title | 文字 | 待確認 | `work[].position` | 官方 Help 未列上限 |
| Experience | Company name | 文字／下拉 | 待確認 | `work[].name` | |
| Experience | Start date / End date | 日期（月／年） | — | `work[].startDate`, `work[].endDate` | |
| Experience | Location | 文字 | 待確認 | `work[].location` | 目前資料無此欄 |
| Experience | Description | 文字 | 待確認 | `work[].summary` + `work[].highlights[]` | 官方 Help 未列上限：https://www.linkedin.com/help/linkedin/answer/a593695 |
| Experience | Skills | 標籤 | 每段最多 5 個 | `skills[].keywords[]` 中與該段相關者 | 來源：https://business.linkedin.com/sell/resources/effective-sales-profile |
| Education | School | 文字／下拉 | 待確認 | `education[].institution` | |
| Education | Degree | 文字 | 待確認 | `education[].studyType` | |
| Education | Field of study | 文字 | 待確認 | `education[].area` | |
| Education | Start date / End date | 日期 | — | `education[].startDate`, `education[].endDate` | |
| Skills | Skill | 標籤 | 最多 100 個 | `skills[].keywords[]` | 來源：https://www.linkedin.com/help/linkedin/answer/a549047 |
| Projects | Project name | 文字 | 待確認 | `projects[].name` | |
| Projects | Description | 文字 | 待確認 | `projects[].description` + `projects[].highlights[]` | |
| Projects | Project URL | 網址 | 待確認 | `projects[].url` | |
| Languages | Language / Proficiency | 文字＋下拉 | — | `languages[].language`, `languages[].fluency` | |
