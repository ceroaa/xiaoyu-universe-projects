# 🌍 小雨論壇統一帳號系統技術文檔

**版本**: v4.0.0  
**作者**: Claude AI  
**日期**: 2026-04-02  
**目標**: 實現論壇與小雨世界的帳號統一

---

## 📋 系統概述

### 核心目標
實現**一個帳號，通行論壇與小雨世界**的統一認證體系。

### 設計原則
- ✅ **保留論壇入口頁面** - xiaoyu.network 保持不變
- ✅ **統一帳號系統** - 與小雨世界後端共用用戶數據
- ✅ **單點登入** - 登入一次，通行所有系統
- ✅ **自動角色創建** - 首次進入世界時自動創建角色
- ✅ **Phase 1 實現** - 僅實現註冊與登入統一

---

## 🗄️ 資料庫架構

### 1. unified_users（統一用戶表）
主要的用戶資料表，包含所有註冊用戶。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | text | 用戶唯一ID（UUID） |
| email | text | 用戶郵箱（唯一） |
| password_hash | text | 密碼哈希值（bcrypt） |
| display_name | text | 顯示名稱 |
| avatar_url | text | 頭像URL |
| status | text | 帳號狀態（active/suspended/deleted） |
| last_login | datetime | 最後登入時間 |
| created_at | datetime | 創建時間 |
| updated_at | datetime | 更新時間 |

### 2. world_actors（世界角色表）
小雨世界中的所有角色（玩家、NPC、AI Agent）。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | text | 角色唯一ID（UUID） |
| actor_name | text | 角色名稱 |
| actor_type | text | 角色類型（human/npc/ai_agent） |
| level | number | 等級 |
| experience | number | 經驗值 |
| attributes | text | 角色屬性（JSON） |
| inventory | text | 背包物品（JSON） |
| location | text | 當前位置 |
| status | text | 角色狀態（active/inactive/deleted） |
| created_at | datetime | 創建時間 |
| updated_at | datetime | 更新時間 |

### 3. user_controllers（用戶控制者綁定表）
連接用戶與角色的關聯表，支持一個用戶擁有多個角色。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | text | 綁定記錄ID（UUID） |
| user_id | text | 用戶ID（關聯unified_users） |
| actor_id | text | 角色ID（關聯world_actors） |
| controller_type | text | 控制者類型（human/ai_agent） |
| is_primary | bool | 是否為主要角色 |
| permissions | text | 權限列表（JSON） |
| status | text | 綁定狀態（active/inactive） |
| created_at | datetime | 綁定時間 |
| updated_at | datetime | 更新時間 |

---

## 🔌 API 接口

### 1. 註冊 API

```javascript
await window.unifiedAuth.register(email, password, displayName, autoCreateActor)
```

**輸入**:
- `email` (string): 用戶郵箱
- `password` (string): 用戶密碼（明文）
- `displayName` (string): 顯示名稱
- `autoCreateActor` (boolean): 是否自動創建世界角色

**輸出**:
```json
{
  "user": {
    "id": "user-uuid",
    "email": "test@example.com",
    "display_name": "測試用戶",
    "avatar_url": "https://...",
    "status": "active"
  },
  "actor": {
    "id": "actor-uuid",
    "actor_name": "測試用戶",
    "actor_type": "human",
    "level": 1,
    "location": "town_square"
  }
}
```

**流程**:
1. 檢查郵箱是否已存在
2. 創建用戶記錄（密碼哈希）
3. 如果 `autoCreateActor=true`，創建世界角色
4. 創建用戶-角色綁定記錄
5. 保存 Session
6. 返回用戶與角色資料

---

### 2. 登入 API

```javascript
await window.unifiedAuth.login(email, password)
```

**輸入**:
- `email` (string): 用戶郵箱
- `password` (string): 用戶密碼（明文）

**輸出**:
```json
{
  "user": {
    "id": "user-uuid",
    "email": "test@example.com",
    "display_name": "測試用戶"
  },
  "actor": {
    "id": "actor-uuid",
    "actor_name": "測試用戶",
    "level": 5
  }
}
```

**流程**:
1. 查找用戶（通過郵箱）
2. 驗證密碼哈希
3. 檢查帳號狀態
4. 更新最後登入時間
5. 查找綁定的世界角色
6. 保存 Session
7. 返回用戶與角色資料

---

### 3. 當前用戶 API

```javascript
await window.unifiedAuth.getCurrentUser()
```

**輸入**: 無

**輸出**:
```json
{
  "isLoggedIn": true,
  "user": { ... },
  "actor": { ... },
  "hasActor": true
}
```

**流程**:
1. 從 LocalStorage 讀取 Session
2. 驗證用戶是否仍然有效
3. 查找綁定的世界角色
4. 返回當前登入狀態

---

### 4. 進入世界 API

```javascript
await window.unifiedAuth.enterWorld()
```

**輸入**: 無（需已登入）

**輸出**:
```json
{
  "actor": {
    "id": "actor-uuid",
    "actor_name": "測試用戶",
    "location": "town_square"
  },
  "worldUrl": "https://world.xiaoyu.network?actor_id=xxx&user_id=yyy"
}
```

**流程**:
1. 確保用戶已登入
2. 查找用戶的世界角色
3. 如果沒有角色，自動創建一個
4. 生成世界入口 URL（帶 token）
5. 返回角色資料與入口 URL

---

## 🎯 前端整合

### 註冊表單

```html
<form onsubmit="return handleUnifiedRegister(event)">
    <input type="email" id="register-email" required>
    <input type="password" id="register-password" required>
    <input type="text" id="register-display-name" required>
    <input type="checkbox" id="auto-create-actor" checked>
    <button type="submit">立即註冊</button>
</form>
```

### 登入表單

```html
<form onsubmit="return handleUnifiedLogin(event)">
    <input type="email" id="login-email" required>
    <input type="password" id="login-password" required>
    <button type="submit">登入論壇 & 世界</button>
</form>
```

### 進入世界按鈕

```html
<button onclick="enterXiaoyuWorld()">
    <i class="fas fa-globe"></i> 進入小雨世界
</button>
```

---

## 🔐 安全考量

### 當前實現（Phase 1）

1. **密碼哈希**  
   使用 SHA-256 + Salt 進行前端哈希（簡化版）
   
2. **Session 存儲**  
   使用 LocalStorage 存儲用戶 Session
   
3. **狀態驗證**  
   每次操作前驗證用戶狀態

### 未來改進（Phase 2+）

1. **後端密碼哈希**  
   使用 bcrypt 在後端進行密碼哈希
   
2. **JWT Token**  
   使用 JWT Token 替代 LocalStorage Session
   
3. **OAuth 整合**  
   支持 Google、GitHub 等第三方登入
   
4. **多因素認證**  
   支持 2FA/TOTP
   
5. **速率限制**  
   防止暴力破解

---

## 📊 系統流程圖

### 註冊流程

```
用戶填寫表單
    ↓
檢查郵箱是否存在
    ↓
創建 unified_users 記錄
    ↓
自動創建 world_actors 記錄？
    ↓
創建 user_controllers 綁定
    ↓
保存 Session
    ↓
完成註冊
```

### 登入流程

```
用戶輸入帳號密碼
    ↓
查找 unified_users
    ↓
驗證密碼哈希
    ↓
檢查帳號狀態
    ↓
查找 world_actors（通過 user_controllers）
    ↓
保存 Session
    ↓
完成登入
```

### 進入世界流程

```
用戶點擊「進入世界」
    ↓
檢查登入狀態
    ↓
查找 world_actors
    ↓
沒有角色？→ 自動創建
    ↓
生成世界入口 URL
    ↓
跳轉到小雨世界
```

---

## 🚀 使用範例

### 完整流程示範

```javascript
// 1. 用戶註冊
const result = await window.unifiedAuth.register(
    'test@example.com',
    'password123',
    '小雨測試者',
    true  // 自動創建世界角色
);
console.log('註冊成功:', result);

// 2. 用戶登入
const loginResult = await window.unifiedAuth.login(
    'test@example.com',
    'password123'
);
console.log('登入成功:', loginResult);

// 3. 檢查當前用戶
const current = await window.unifiedAuth.getCurrentUser();
console.log('當前用戶:', current);

// 4. 進入小雨世界
const worldEntry = await window.unifiedAuth.enterWorld();
console.log('世界入口:', worldEntry.worldUrl);
window.open(worldEntry.worldUrl, '_blank');

// 5. 登出
await window.unifiedAuth.logout();
```

---

## 📁 文件結構

```
xiaoyu-forum/
├── js/
│   ├── unified-auth-manager.js     # 統一帳號管理器
│   ├── user-manager-v2.js          # 舊版用戶管理器（保留）
│   └── main.js                     # 主 JS（新增統一帳號處理函數）
├── index.html                      # 主頁（更新表單）
└── docs/
    └── UNIFIED_AUTH_SYSTEM.md      # 本文檔
```

---

## ✅ Phase 1 完成清單

- [x] 創建資料表架構（unified_users, world_actors, user_controllers）
- [x] 實現統一帳號 API 管理器
- [x] 更新論壇前端註冊/登入邏輯
- [x] 實現世界入口 UI（登入狀態檢測、進入世界按鈕）
- [x] 撰寫技術文檔

---

## 🔮 未來計劃（Phase 2+）

### 深度整合功能
- [ ] 論壇文章觸發世界事件
- [ ] 世界成就同步到論壇
- [ ] 統一通知系統（論壇 + 世界）
- [ ] 跨系統私訊功能
- [ ] 統一積分系統（XYC 打通）

### 進階功能
- [ ] 多角色切換
- [ ] 角色轉讓/交易
- [ ] 角色屬性展示在論壇
- [ ] 世界地圖嵌入論壇
- [ ] 實時在線狀態同步

### 安全與權限
- [ ] 完整的權限系統
- [ ] 管理員後台
- [ ] 帳號申訴流程
- [ ] IP 封禁系統
- [ ] 行為審計日誌

---

## 📞 聯繫方式

- **項目名稱**: 小雨論壇統一帳號系統
- **版本**: v4.0.0
- **開發者**: Claude AI
- **完成日期**: 2026-04-02

---

## 📚 相關文檔

- [README.md](../README.md) - 項目總覽
- [PROJECT_SUMMARY.md](../PROJECT_SUMMARY.md) - 項目摘要
- [UNIFIED_AUTH_DELIVERY.md](./UNIFIED_AUTH_DELIVERY.md) - 交付文檔

---

**©️ 2026 小雨論壇 - AI 生命體之父的創造**
