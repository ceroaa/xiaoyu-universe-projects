# 🔧 統一帳號系統適配器配置指南

**版本**: v4.1.0  
**日期**: 2026-04-02  
**狀態**: 可適配真實後端 API

---

## 📋 設計原則

1. ✅ **不寫死 API 路徑與字段**
2. ✅ **透過配置適配真實後端**
3. ✅ **支持模擬模式（後端未準備好時）**
4. ✅ **支持開發環境與正式環境切換**

---

## 🎯 使用方式

### 方式 1：預設配置（模擬模式）

```html
<!-- 載入適配器 -->
<script src="js/unified-auth-adapter.js"></script>

<!-- 適配器會自動初始化，使用預設配置（模擬模式） -->
```

預設配置：
```javascript
{
    mockMode: true,  // 模擬模式（後端未準備好）
    isDev: false,
    apiBaseUrl: 'https://api.xiaoyu.network',
    devApiBaseUrl: 'http://localhost:8000',
    worldUrl: 'https://world.xiaoyu.network'
}
```

---

### 方式 2：自定義配置（真實 API）

```html
<!-- 在載入適配器前，先定義配置 -->
<script>
window.XIAOYU_AUTH_CONFIG = {
    // 關閉模擬模式，使用真實 API
    mockMode: false,
    
    // 使用開發環境
    isDev: true,
    
    // API Base URL
    apiBaseUrl: 'https://api.xiaoyu.network',
    devApiBaseUrl: 'http://localhost:8000',
    
    // 世界入口 URL
    worldUrl: 'https://world.xiaoyu.network',
    
    // API 端點配置（可自定義）
    endpoints: {
        register: '/auth/register',
        login: '/auth/login',
        me: '/auth/me',
        enterWorld: '/world/enter',
        logout: '/auth/logout'
    },
    
    // 字段映射（適配真實後端字段）
    fieldMapping: {
        user: {
            id: 'id',
            email: 'email',
            displayName: 'display_name',  // 真實後端字段
            avatarUrl: 'avatar_url'
        },
        actor: {
            id: 'id',
            displayName: 'display_name',      // 真實後端字段
            currentRoomId: 'current_room_id', // 真實後端字段
            gold: 'gold',                     // 真實後端字段
            hp: 'hp',                         // 真實後端字段
            mp: 'mp',                         // 真實後端字段
            stats: 'stats'                    // 真實後端字段
        },
        token: 'token'
    },
    
    // Token 存儲 key
    tokenKey: 'xiaoyu_auth_token',
    sessionKey: 'xiaoyu_session'
};
</script>

<!-- 載入適配器 -->
<script src="js/unified-auth-adapter.js"></script>
```

---

## 🔄 模式切換

### 模擬模式（預設）

**使用時機**：
- ✅ 後端 Phase 1 接口尚未準備好
- ✅ 前端獨立開發與測試
- ✅ UI/UX 流程驗證

**特性**：
- 前端生成模擬資料
- 不調用真實後端 API
- 模擬註冊、登入、進入世界流程
- 資料存儲在 LocalStorage

**啟用方式**：
```javascript
window.XIAOYU_AUTH_CONFIG = {
    mockMode: true
};
```

---

### 真實 API 模式

**使用時機**：
- ✅ 後端 Phase 1 接口已準備好
- ✅ 真實對接測試
- ✅ 正式部署

**特性**：
- 調用真實後端 API
- 使用真實資料庫
- 真實 Token 驗證
- 真實角色資料

**啟用方式**：
```javascript
window.XIAOYU_AUTH_CONFIG = {
    mockMode: false,
    isDev: true,  // 開發環境
    devApiBaseUrl: 'http://localhost:8000'
};
```

---

## 🌐 環境配置

### 開發環境

```javascript
window.XIAOYU_AUTH_CONFIG = {
    mockMode: false,
    isDev: true,
    devApiBaseUrl: 'http://localhost:8000',
    worldUrl: 'http://localhost:3000'
};
```

### 正式環境

```javascript
window.XIAOYU_AUTH_CONFIG = {
    mockMode: false,
    isDev: false,
    apiBaseUrl: 'https://api.xiaoyu.network',
    worldUrl: 'https://world.xiaoyu.network'
};
```

---

## 📝 後端 API 對接清單

### Phase 1 待補齊接口

#### 1. POST /auth/register

**請求**：
```json
{
  "email": "test@example.com",
  "password": "password123",
  "display_name": "測試用戶",
  "auto_create_actor": true
}
```

**返回**（請適配真實結構）：
```json
{
  "user": {
    "id": "user-uuid",
    "email": "test@example.com",
    "display_name": "測試用戶",
    "avatar_url": "https://..."
  },
  "actor": {
    "id": "actor-uuid",
    "display_name": "測試用戶",
    "current_room_id": "town_square",
    "gold": 100,
    "hp": 100,
    "mp": 50,
    "stats": { "strength": 10, "intelligence": 10, "agility": 10 }
  },
  "token": "jwt-token-here"
}
```

---

#### 2. POST /auth/login

**請求**：
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**返回**：
```json
{
  "user": { /* 同上 */ },
  "actor": { /* 同上，如果有角色 */ },
  "token": "jwt-token-here"
}
```

---

#### 3. GET /auth/me

**請求 Header**：
```
Authorization: Bearer {jwt-token}
```

**返回**：
```json
{
  "user": { /* 同上 */ },
  "actor": { /* 同上，如果有角色 */ }
}
```

---

#### 4. POST /world/enter

**請求 Header**：
```
Authorization: Bearer {jwt-token}
```

**請求**：
```json
{}
```

**返回**：
```json
{
  "actor": {
    "id": "actor-uuid",
    "display_name": "測試用戶",
    "current_room_id": "town_square",
    "gold": 100,
    "hp": 100,
    "mp": 50,
    "stats": { "strength": 10, "intelligence": 10, "agility": 10 }
  },
  "world_entry_url": "https://world.xiaoyu.network?entry_token=xxx",
  "is_first_time": true
}
```

---

#### 5. POST /auth/logout

**請求 Header**：
```
Authorization: Bearer {jwt-token}
```

**返回**：
```json
{
  "success": true
}
```

---

## 🔧 字段映射配置

如果後端使用不同的字段名稱，可以透過 `fieldMapping` 配置適配：

### 範例：後端使用不同字段名

假設後端使用：
- `username` 而非 `display_name`
- `room_id` 而非 `current_room_id`

配置：
```javascript
window.XIAOYU_AUTH_CONFIG = {
    fieldMapping: {
        user: {
            id: 'id',
            email: 'email',
            displayName: 'username',  // 映射到後端的 username
            avatarUrl: 'avatar_url'
        },
        actor: {
            id: 'id',
            displayName: 'username',
            currentRoomId: 'room_id',  // 映射到後端的 room_id
            gold: 'gold',
            hp: 'hp',
            mp: 'mp',
            stats: 'stats'
        }
    }
};
```

---

## 🧪 測試流程

### Step 1: 模擬模式測試（當前）

```bash
# 1. 使用預設配置（模擬模式）
# 2. 測試註冊/登入/進入世界流程
# 3. 驗證 UI 與用戶體驗
```

### Step 2: 開發環境對接

```bash
# 1. 啟動後端開發服務器
cd xiaoyu-world-backend
python -m uvicorn main:app --reload --port 8000

# 2. 修改前端配置
window.XIAOYU_AUTH_CONFIG = {
    mockMode: false,
    isDev: true,
    devApiBaseUrl: 'http://localhost:8000'
};

# 3. 測試真實 API 調用
```

### Step 3: 正式環境部署

```bash
# 1. 部署後端到 api.xiaoyu.network
# 2. 部署世界前端到 world.xiaoyu.network
# 3. 修改論壇前端配置
window.XIAOYU_AUTH_CONFIG = {
    mockMode: false,
    isDev: false,
    apiBaseUrl: 'https://api.xiaoyu.network',
    worldUrl: 'https://world.xiaoyu.network'
};
```

---

## 📊 前端使用範例

### 註冊

```javascript
try {
    const result = await window.unifiedAuth.register(
        'test@example.com',
        'password123',
        '測試用戶',
        true  // 自動創建角色
    );
    
    console.log('註冊成功:', result);
    // result = { user, actor, token }
} catch (error) {
    console.error('註冊失敗:', error);
}
```

### 登入

```javascript
try {
    const result = await window.unifiedAuth.login(
        'test@example.com',
        'password123'
    );
    
    console.log('登入成功:', result);
    // result = { user, actor, token }
} catch (error) {
    console.error('登入失敗:', error);
}
```

### 檢查登入狀態

```javascript
const status = await window.unifiedAuth.getCurrentUser();
console.log('登入狀態:', status);
// status = { isLoggedIn, user, actor, hasActor }
```

### 進入世界

```javascript
try {
    const result = await window.unifiedAuth.enterWorld();
    
    console.log('準備進入世界:', result);
    // result = { actor, worldUrl, isFirstTime }
    
    // 跳轉到世界
    window.open(result.worldUrl, '_blank');
} catch (error) {
    console.error('進入世界失敗:', error);
}
```

### 登出

```javascript
await window.unifiedAuth.logout();
// 自動清除 Token 並刷新頁面
```

---

## 🔍 除錯模式

在瀏覽器 Console 可以查看詳細日誌：

```javascript
// 查看當前配置
console.log(window.unifiedAuth.config);

// 查看當前用戶
console.log(window.unifiedAuth.currentUser);

// 查看當前角色
console.log(window.unifiedAuth.currentActor);

// 查看 Token
console.log(window.unifiedAuth.loadToken());

// 查看 API Base URL
console.log(window.unifiedAuth.getApiBaseUrl());
```

---

## 📞 後端對接步驟

### Step 1: 後端實現 Phase 1 接口

實現以下 5 個接口：
- [ ] `POST /auth/register`
- [ ] `POST /auth/login`
- [ ] `GET /auth/me`
- [ ] `POST /world/enter`
- [ ] `POST /auth/logout`

### Step 2: 提供 API 文檔

提供真實的：
- 請求格式
- 返回格式
- 字段說明
- 錯誤處理

### Step 3: 前端適配

根據真實 API 調整配置：
```javascript
window.XIAOYU_AUTH_CONFIG = {
    mockMode: false,
    endpoints: { /* 真實端點 */ },
    fieldMapping: { /* 真實字段映射 */ }
};
```

### Step 4: 測試驗證

執行完整測試流程：
1. 註冊新用戶
2. 登入
3. 檢查當前用戶
4. 進入世界
5. 登出

---

## ✅ 當前狀態

- ✅ 前端適配器已完成（可配置）
- ✅ 模擬模式已實現（可獨立測試）
- ⏳ 等待後端補齊 Phase 1 接口
- ⏳ 等待真實 API 對接測試

---

## 📝 下一步

1. **後端團隊**：實現 Phase 1 的 5 個接口
2. **前端團隊**：使用模擬模式完成 UI 開發
3. **對接測試**：後端準備好後，切換到真實 API 模式
4. **正式部署**：測試通過後部署到正式環境

---

**©️ 2026 小雨論壇 - 統一帳號系統適配器 v4.1.0**
