# 🌐 自訂網域與資料庫部署問題

**問題**: 部署時資料庫 ID 檢索失敗  
**可能原因**: 自訂網域配置與 D1 資料庫綁定衝突  
**您的網域**: https://www.xiaoyu.network

---

## 🔍 問題分析

### 自訂網域如何影響部署？

當您啟用自訂網域時，Cloudflare Workers 的部署配置可能需要特別處理：

```
標準部署：
Worker → D1 Database → 自動綁定 ✅

自訂網域部署：
Worker → Custom Domain → D1 Database → 可能需要手動配置 ⚠️
```

**根本原因**：
1. 自訂網域改變了 Worker 的路由配置
2. D1 資料庫綁定可能需要重新配置
3. 資料庫 ID 檢索邏輯可能與自訂網域衝突

---

## 🎯 解決方案

### 方案 1: 檢查自訂網域狀態 ✅

#### 步驟 1: 確認網域已完全啟用

訪問：https://www.xiaoyu.network

**預期結果**：
- ✅ 網站可以正常訪問
- ✅ 沒有 SSL 證書錯誤
- ✅ 頁面正常載入

#### 步驟 2: 測試 API 端點

在瀏覽器 Console 執行：
```javascript
// 測試資料表 API
fetch('https://www.xiaoyu.network/tables/forum_posts?limit=1')
  .then(res => {
    console.log('狀態碼:', res.status);
    return res.json();
  })
  .then(data => console.log('✅ API 正常:', data))
  .catch(err => console.error('❌ API 錯誤:', err));
```

**可能的結果**：

| 結果 | 說明 | 行動 |
|-----|------|------|
| ✅ 200 + 資料 | API 正常運作 | 繼續測試功能 |
| ⚠️ 404 | API 路由未配置 | 檢查 Worker 路由設定 |
| ❌ 500 | 資料庫連接失敗 | 需要重新綁定資料庫 |
| ❌ CORS 錯誤 | 跨域問題 | 需要配置 CORS |

---

### 方案 2: 重新綁定資料庫到自訂網域 🔧

#### 為什麼需要重新綁定？

自訂網域啟用後，Worker 的環境可能已更新，但資料庫綁定可能還指向舊的配置。

#### 步驟：

##### 1️⃣ 獲取現有資料庫 ID

**選項 A: 使用 Cloudflare Dashboard**
```
1. 登入 https://dash.cloudflare.com/
2. 選擇您的帳戶
3. 進入 Workers & Pages → D1
4. 找到 82202f1c-bdde-4592-8aab-cfbf1c094810-db
5. 複製資料庫 ID（類似：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）
```

**選項 B: 使用 Wrangler CLI**
```bash
wrangler d1 list
# 找到您的資料庫，複製 ID
```

##### 2️⃣ 檢查 Worker 設定

訪問 Cloudflare Dashboard：
```
Workers & Pages → 您的 Worker (82202f1c-bdde-4592-8aab-cfbf1c094810)
→ Settings → Variables → D1 Database Bindings
```

**應該看到**：
```
Binding Name: DB
Database: 82202f1c-bdde-4592-8aab-cfbf1c094810-db
Status: ✅ Bound
```

**如果沒有或顯示錯誤**：
```
點擊 "Add binding"
→ 選擇 D1 Database
→ Binding name: DB
→ 選擇您的資料庫
→ Save
```

##### 3️⃣ 檢查自訂網域路由

```
Workers & Pages → 您的 Worker
→ Triggers → Custom Domains
```

**確認**：
- ✅ www.xiaoyu.network 已啟用
- ✅ 狀態顯示「Active」
- ✅ 路由設定正確

---

### 方案 3: 使用臨時 Workers URL 測試 🧪

#### 目的：
排除自訂網域影響，驗證資料庫本身是否正常

#### 步驟：

##### 1️⃣ 找到 Workers 預設 URL

在 Cloudflare Dashboard：
```
Workers & Pages → 您的 Worker → Triggers → Routes
```

應該會看到類似：
```
https://82202f1c-bdde-4592-8aab-cfbf1c094810.workers.dev
```

##### 2️⃣ 測試 Workers URL

```javascript
// 使用 Workers 預設網址測試
fetch('https://82202f1c-bdde-4592-8aab-cfbf1c094810.workers.dev/tables/forum_posts?limit=1')
  .then(res => res.json())
  .then(data => console.log('✅ Workers URL 正常:', data))
  .catch(err => console.error('❌ Workers URL 錯誤:', err));
```

##### 3️⃣ 對比測試結果

| 測試 | Workers URL | 自訂網域 | 診斷 |
|-----|------------|---------|------|
| 情況 1 | ✅ 正常 | ✅ 正常 | 完美！兩邊都正常 |
| 情況 2 | ✅ 正常 | ❌ 錯誤 | 自訂網域路由問題 |
| 情況 3 | ❌ 錯誤 | ❌ 錯誤 | 資料庫綁定問題 |

---

## 🔧 具體修復步驟

### 如果是「情況 2」：自訂網域路由問題

#### 修復方法：

##### 選項 A: 重新配置自訂網域
```
Cloudflare Dashboard:
1. Workers & Pages → 您的 Worker → Triggers
2. Custom Domains → 點擊 www.xiaoyu.network 旁的「...」
3. 選擇「Edit」
4. 確認路由設定：
   - Zone: xiaoyu.network
   - Hostname: www.xiaoyu.network
   - Path: /* (所有路徑)
5. Save
```

##### 選項 B: 添加 DNS 記錄（如果缺失）
```
Cloudflare Dashboard → DNS → Records:

類型: CNAME
名稱: www
目標: 82202f1c-bdde-4592-8aab-cfbf1c094810.workers.dev
Proxy: ✅ Proxied (橘色雲朵)
```

---

### 如果是「情況 3」：資料庫綁定問題

#### 修復方法：

##### 步驟 1: 刪除舊的資料庫綁定
```
Workers & Pages → Settings → Variables → D1 Database Bindings
→ 點擊現有的 DB 綁定旁的「X」→ 刪除
```

##### 步驟 2: 重新創建綁定
```
點擊 "Add binding"
→ Variable name: DB
→ D1 database: 選擇 82202f1c-bdde-4592-8aab-cfbf1c094810-db
→ Save
```

##### 步驟 3: 重新部署
```
Workers & Pages → Deployments → 點擊最新部署旁的「...」
→ Retry deployment
```

---

## 🧪 完整測試流程

### 測試清單：

#### ✅ 測試 1: 自訂網域可訪問性
```bash
curl -I https://www.xiaoyu.network
# 應返回 200 OK
```

#### ✅ 測試 2: API 端點（自訂網域）
```javascript
fetch('https://www.xiaoyu.network/tables/forum_posts?limit=1')
  .then(res => res.json())
  .then(data => console.log('自訂網域 API:', data));
```

#### ✅ 測試 3: API 端點（Workers URL）
```javascript
fetch('https://82202f1c-bdde-4592-8aab-cfbf1c094810.workers.dev/tables/forum_posts?limit=1')
  .then(res => res.json())
  .then(data => console.log('Workers API:', data));
```

#### ✅ 測試 4: 註冊功能
```
訪問 https://www.xiaoyu.network
→ 註冊 AI 用戶
→ 檢查是否成功
```

#### ✅ 測試 5: 跨用戶留言
```
瀏覽器 A: 訪問 https://www.xiaoyu.network → 註冊 Alice
瀏覽器 B: 訪問 https://www.xiaoyu.network → 註冊 Bob
→ 檢查是否能互相看到留言
```

---

## 💡 臨時解決方案

### 如果急需立即使用

#### 方案 A: 暫時使用 Workers URL
```
告訴用戶暫時使用：
https://82202f1c-bdde-4592-8aab-cfbf1c094810.workers.dev

等待自訂網域問題解決後再切換回：
https://www.xiaoyu.network
```

#### 方案 B: 使用預覽模式
```
在本地預覽模式測試所有功能
確認功能正常後再處理網域問題
```

---

## 🎯 推薦行動順序

### 優先級排序：

#### 🥇 第一步：診斷問題（5 分鐘）
```
1. 訪問 https://www.xiaoyu.network
2. 打開瀏覽器 Console
3. 執行 API 測試（見上方）
4. 記錄錯誤訊息
```

#### 🥈 第二步：根據診斷結果修復（10 分鐘）
```
如果是路由問題 → 重新配置自訂網域
如果是資料庫問題 → 重新綁定資料庫
如果兩者都正常 → 清除快取重新測試
```

#### 🥉 第三步：完整測試（10 分鐘）
```
按照測試清單逐項驗證
確保所有功能正常運作
```

---

## 📊 常見問題

### Q1: 自訂網域需要多久生效？
**A**: 通常 1-5 分鐘，最多 24 小時（DNS 傳播）

### Q2: 如何確認自訂網域已完全啟用？
**A**: 
```bash
# 檢查 DNS
nslookup www.xiaoyu.network

# 應返回 Cloudflare 的 IP
```

### Q3: Workers URL 和自訂網域有什麼區別？
**A**: 
```
Workers URL:
- 系統自動生成
- 立即可用
- 格式：*.workers.dev

自訂網域:
- 您自己的網域
- 需要 DNS 設定
- 更專業、更好記
```

### Q4: 資料庫綁定失敗會影響什麼？
**A**: 
```
影響：
❌ 無法讀取/寫入資料
❌ 註冊功能無法使用
❌ 留言板無法運作

不影響：
✅ 靜態頁面可以訪問
✅ 前端 UI 正常顯示
```

---

## 🔗 相關資源

### Cloudflare 文檔：
- [自訂網域設定](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [D1 資料庫綁定](https://developers.cloudflare.com/d1/get-started/)
- [Workers 路由](https://developers.cloudflare.com/workers/configuration/routing/routes/)

---

## ✅ 下一步行動

### 請您協助確認：

1. **訪問自訂網域**：
   ```
   https://www.xiaoyu.network
   是否可以正常打開？
   ```

2. **測試 API**：
   ```javascript
   // 在網站 Console 執行：
   fetch('/tables/forum_posts?limit=1')
     .then(res => res.json())
     .then(data => console.log(data))
     .catch(err => console.error(err));
   
   // 告訴我返回什麼結果？
   ```

3. **查看錯誤**：
   ```
   打開 Console（F12）
   是否有紅色錯誤訊息？
   截圖給我看看
   ```

---

**告訴我測試結果，我會根據具體情況給您精確的解決方案！** 🚀

---

**文檔版本**: 1.0  
**更新時間**: 2026-03-10 00:40 GMT+8
