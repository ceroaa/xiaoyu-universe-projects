# 🎉 統一帳號系統 v4.1.0 - 可適配版本交付

**日期**: 2026-04-02  
**版本**: v4.1.0 - 可適配真實後端 API  
**狀態**: ✅ 前端適配器完成，等待後端補齊 Phase 1 接口

---

## 📦 本次交付

### 核心文件

| 文件 | 說明 | 行數 |
|------|------|------|
| **js/unified-auth-adapter.js** | 可適配統一帳號管理器 | 470 行 |
| **config/auth-config.js** | 快速配置文件（一鍵切換模式） | 85 行 |
| **docs/UNIFIED_AUTH_ADAPTER_CONFIG.md** | 配置指南與使用文檔 | 400+ 行 |

### 核心特性

✅ **不寫死 API 路徑與字段**  
✅ **支持模擬模式（後端未準備好時）**  
✅ **支持真實 API 模式（後端準備好後）**  
✅ **可配置字段映射（適配真實後端結構）**  
✅ **一鍵切換環境（模擬/開發/正式）**

---

## 🎯 設計原則

1. ✅ **以現有小雨世界後端為準**
2. ✅ **論壇前端適配真實 API**
3. ✅ **不重建資料表，不假設新結構**
4. ✅ **Phase 1 只打通：註冊、登入、取得當前用戶、進入世界**
5. ✅ **使用真實後端返回的字段結構**

---

## 🔄 三種模式

### 1. 模擬模式（預設）

**使用時機**：
- 後端 Phase 1 接口尚未準備好
- 前端獨立開發與測試

**啟用方式**：
```javascript
// config/auth-config.js
const CURRENT_ENV = 'mock';
```

---

### 2. 開發環境模式

**使用時機**：
- 後端開發環境已啟動（localhost:8000）
- 真實 API 對接測試

**啟用方式**：
```javascript
// config/auth-config.js
const CURRENT_ENV = 'dev';
```

---

### 3. 正式環境模式

**使用時機**：
- 後端已部署到 api.xiaoyu.network
- 正式上線

**啟用方式**：
```javascript
// config/auth-config.js
const CURRENT_ENV = 'prod';
```

---

## 🔌 後端對接清單

### Phase 1 待補齊接口（5 個）

| 接口 | 路徑 | 狀態 |
|------|------|------|
| 註冊 | `POST /auth/register` | ⏳ 待開發 |
| 登入 | `POST /auth/login` | ⏳ 待開發 |
| 當前用戶 | `GET /auth/me` | ⏳ 待開發 |
| 進入世界 | `POST /world/enter` | ⏳ 待開發 |
| 登出 | `POST /auth/logout` | ⏳ 待開發 |

### 真實資料表（已存在）

- ✅ `users` - 用戶表
- ✅ `actors` - 角色表（字段：`display_name`, `current_room_id`, `gold`, `hp`, `mp`, `stats`）

---

## 📝 使用範例

### 註冊

```javascript
const result = await window.unifiedAuth.register(
    'test@example.com',
    'password123',
    '測試用戶',
    true  // 自動創建角色
);
console.log('註冊成功:', result);
// { user, actor, token }
```

### 登入

```javascript
const result = await window.unifiedAuth.login(
    'test@example.com',
    'password123'
);
console.log('登入成功:', result);
// { user, actor, token }
```

### 進入世界

```javascript
const result = await window.unifiedAuth.enterWorld();
console.log('進入世界:', result);
// { actor, worldUrl, isFirstTime }

window.open(result.worldUrl, '_blank');
```

---

## ✅ 當前狀態

### 已完成

- ✅ 前端可適配統一帳號管理器
- ✅ 模擬模式（可獨立測試）
- ✅ 字段映射配置（適配真實後端）
- ✅ 環境切換機制（一行代碼切換）
- ✅ 配置文檔與使用指南

### 等待中

- ⏳ 後端實現 Phase 1 的 5 個接口
- ⏳ 真實 API 對接測試
- ⏳ 正式部署

---

## 🚀 下一步

### 後端團隊

1. 實現 Phase 1 的 5 個接口
2. 使用真實的 `users` 與 `actors` 表
3. 使用真實字段：`display_name`, `current_room_id`, `gold`, `hp`, `mp`, `stats`
4. 提供 API 文檔（請求/返回格式）

### 前端團隊

1. 使用模擬模式完成 UI 開發
2. 測試註冊/登入/進入世界流程
3. 等待後端準備好後，切換到真實 API 模式
4. 進行對接測試

### 對接測試

1. 切換到開發環境模式（`CURRENT_ENV = 'dev'`）
2. 啟動後端開發服務器（localhost:8000）
3. 測試 5 個接口的真實調用
4. 驗證資料庫記錄
5. 確認角色創建與載入邏輯

---

## 📞 快速開始

### Step 1: 模擬模式測試（當前可用）

```bash
# 1. 打開 index.html
# 2. 預設已啟用模擬模式
# 3. 測試註冊/登入/進入世界
```

### Step 2: 切換到開發環境

```javascript
// 修改 config/auth-config.js
const CURRENT_ENV = 'dev';  // 改為 'dev'

// 確保後端已啟動
// http://localhost:8000
```

### Step 3: 切換到正式環境

```javascript
// 修改 config/auth-config.js
const CURRENT_ENV = 'prod';  // 改為 'prod'

// 確保後端已部署
// https://api.xiaoyu.network
```

---

## 📋 驗收清單

### 前端（已完成）

- [x] 可適配統一帳號管理器
- [x] 模擬模式實現
- [x] 字段映射配置
- [x] 環境切換機制
- [x] 配置文檔

### 後端（待完成）

- [ ] POST /auth/register
- [ ] POST /auth/login
- [ ] GET /auth/me
- [ ] POST /world/enter
- [ ] POST /auth/logout

### 對接測試（待執行）

- [ ] 註冊功能測試
- [ ] 登入功能測試
- [ ] 當前用戶檢查
- [ ] 進入世界測試
- [ ] 角色創建測試
- [ ] 角色載入測試

---

## 🎉 總結

### 核心成就

✅ **前端適配器完成**  
✅ **不寫死 API 與字段**  
✅ **支持模擬模式與真實 API 模式**  
✅ **可適配真實後端結構**  
✅ **一鍵切換環境**

### 下一階段

等待後端補齊 Phase 1 的 5 個接口，然後進行真實對接測試。

前端已準備好，隨時可以切換到真實 API 模式！🚀

---

**©️ 2026 小雨論壇 - 統一帳號系統 v4.1.0（可適配版本）**
