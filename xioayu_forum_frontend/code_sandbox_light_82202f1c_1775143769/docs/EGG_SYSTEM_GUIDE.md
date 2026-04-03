# 🎁 小雨論壇 - 彩蛋獎勵系統使用指南
**Egg Reward System Guide**

*版本：v2.2.0 | 最後更新：2026-03-08*

---

## 📋 目錄

1. [系統概述](#系統概述)
2. [獎勵類型](#獎勵類型)
3. [使用教學](#使用教學)
4. [安全機制](#安全機制)
5. [技術架構](#技術架構)
6. [常見問題](#常見問題)
7. [故障排除](#故障排除)
8. [開發者 API](#開發者-api)

---

## 🎯 系統概述

小雨論壇的彩蛋獎勵系統是一個創新的用戶激勵機制，通過區塊鏈技術（Polygon 網絡）實現透明、安全、可追蹤的獎勵發放。

### 核心特性

- ✅ **透明公正**：所有獎勵發放記錄上鏈，永久可查
- 🔒 **安全可靠**：防重放攻擊、頻率限制、惡意行為檢測
- 💎 **多重獎勵**：每小時、每日、連續登入、AI 爬蟲專屬獎勵
- 📱 **移動優化**：完美支持手機、平板、桌面設備
- 🌐 **低成本**：使用 Polygon 網絡，Gas 費用極低（約 $0.0002/交易）

### 系統組成

```
彩蛋獎勵系統
├── 前端 UI（index.html, js/egg-reward-ui.js, css/egg-reward-ui.css）
├── 安全模組（js/egg-security-checker.js）
├── 錯誤處理（js/error-handler.js）
├── 區塊鏈集成（js/web3-integration.js）
├── 智能合約（contracts/XiaoYuCoin.sol）
└── 配置管理（config/egg-rewards-config.json）
```

---

## 🏆 獎勵類型

### 1. 一般用戶獎勵

#### 1.1 每小時彩蛋獎勵
- **獎勵金額**：10 XYC
- **領取頻率**：每小時一次
- **領取條件**：無特殊要求
- **圖標**：⏰

```javascript
// 合約函數
claimHourlyEggReward(bytes32 nonce)
```

#### 1.2 每日彩蛋獎勵
- **獎勵金額**：1,000 XYC
- **領取頻率**：每天一次
- **領取條件**：無特殊要求
- **圖標**：🌟
- **特殊效果**：更新連續登入天數

```javascript
// 合約函數
claimDailyEggReward(bytes32 nonce)
```

#### 1.3 連續登入獎勵

**3 天連續登入**
- 獎勵金額：500 XYC
- 圖標：🔥

**7 天連續登入**
- 獎勵金額：2,000 XYC
- 圖標：⭐

**30 天連續登入**
- 獎勵金額：10,000 XYC
- 圖標：👑

```javascript
// 合約函數
claimConsecutiveReward(uint256 days, bytes32 nonce)
// days: 3, 7, or 30
```

### 2. AI 爬蟲專屬獎勵

#### 2.1 首次發現獎勵
- **獎勵金額**：5,000 XYC
- **領取次數**：僅一次
- **領取條件**：需要被註冊為 AI 爬蟲
- **圖標**：🤖

```javascript
// 合約函數
claimAIFirstDiscoveryReward()
```

#### 2.2 訪問獎勵
- **獎勵金額**：50 XYC
- **領取頻率**：每小時一次
- **領取條件**：已註冊的 AI 爬蟲
- **圖標**：👀

```javascript
// 合約函數
claimAIVisitReward(bytes32 nonce)
```

#### 2.3 深度爬取獎勵
- **獎勵金額**：100 XYC
- **領取條件**：完成深度爬取任務
- **圖標**：🔍

```javascript
// 合約函數
claimAIDeepCrawlReward(bytes32 nonce)
```

#### 2.4 忠實監控獎勵
- **獎勵金額**：200 XYC
- **領取條件**：累計訪問 10 次以上
- **圖標**：💎

```javascript
// 合約函數
claimAILoyalReward(bytes32 nonce)
```

---

## 📖 使用教學

### 前置準備

1. **安裝 MetaMask 錢包**
   - 前往 [metamask.io](https://metamask.io) 下載安裝
   - 創建或導入錢包

2. **切換到 Polygon 網絡**
   - 打開 MetaMask
   - 點擊網絡選擇器
   - 選擇「Polygon Mainnet」
   - 如果沒有，點擊「添加網絡」手動添加

3. **獲取 MATIC（Gas 費用）**
   - Polygon 網絡的 Gas 費用需要 MATIC
   - 可通過交易所（如 Binance、OKX）充值
   - 最少準備 0.1 MATIC（約 $0.1 USD）

### 步驟 1：連接錢包

1. 訪問小雨論壇首頁
2. 點擊右上角「🎁 彩蛋」按鈕
3. 如果未連接錢包，系統會提示連接
4. 點擊「連接錢包」，MetaMask 會彈出授權請求
5. 點擊「確認」授權連接

### 步驟 2：查看可領取獎勵

連接錢包後，彩蛋模態框會顯示：

```
📊 獎勵統計
├── 今日已獲得：XX XYC
├── 累計獲得：XX XYC
├── 連續登入：X 天
└── 可領取：X 個獎勵

🎁 可領取獎勵列表
├── ⏰ 每小時彩蛋獎勵 - 10 XYC
├── 🌟 每日彩蛋獎勵 - 1000 XYC
└── 🔥 連續3天登入獎勵 - 500 XYC
```

### 步驟 3：領取獎勵

1. 點擊「🎉 領取所有獎勵（XXXX XYC）」按鈕
2. MetaMask 會彈出交易確認窗口
3. 檢查交易詳情（Gas 費用、接收地址等）
4. 點擊「確認」提交交易
5. 等待區塊鏈確認（約 2-5 秒）
6. 看到「✅ 成功領取獎勵！」通知

### 步驟 4：查看餘額

- 獎勵會立即添加到您的 XYC 餘額
- 查看方式：
  - 頁面右上角顯示「餘額：XXXX XYC」
  - 在 MetaMask 中添加 XYC 代幣地址查看

---

## 🔒 安全機制

### 1. 防重放攻擊（Anti-Replay Attack）

**問題**：惡意用戶可能嘗試重複發送同一個交易來多次領取獎勵。

**解決方案**：
- 每次領取獎勵時生成唯一的 `nonce`（隨機數）
- 智能合約記錄已使用的 `nonce`，拒絕重複請求
- `nonce` 生成算法：`keccak256(userAddress + timestamp + random)`

```solidity
// 智能合約中的防重放機制
mapping(bytes32 => bool) public eggClaimNonces;

function claimDailyEggReward(bytes32 _nonce) external {
    require(!eggClaimNonces[_nonce], "Nonce already used");
    eggClaimNonces[_nonce] = true;
    // ... 發放獎勵
}
```

### 2. 頻率限制（Rate Limiting）

**問題**：用戶可能在短時間內大量請求領取獎勵。

**解決方案**：
- 每小時獎勵：最多每小時領取一次
- 每日獎勵：最多每天領取一次
- 連續登入獎勵：必須達到相應天數才能領取

```javascript
// 前端頻率檢查
const lastClaimTime = localStorage.getItem('last_claim_time');
const now = Date.now();
if (now - lastClaimTime < 3600000) { // 1小時
    throw new Error('獎勵尚未準備好');
}
```

### 3. 異常行為檢測

**檢測項目**：
- 短時間內大量領取請求（每小時最多 10 次）
- 每日領取上限（每天最多 50 次）
- 異常時間間隔（如每秒多次請求）

**處理措施**：
- 暫時封鎖 1 小時
- 要求額外驗證
- 記錄到異常日誌

```javascript
// 安全檢查器
class EggSecurityChecker {
    checkClaimEligibility(userId, rewardType) {
        const claimCount = this.getClaimCount(userId);
        if (claimCount.hourly > 10) {
            return {
                allowed: false,
                reason: 'hourly_limit_exceeded'
            };
        }
        // ...
    }
}
```

### 4. 智能合約安全

**特性**：
- ✅ 使用 OpenZeppelin 標準合約庫
- ✅ Pausable：緊急情況可暫停合約
- ✅ Ownable：只有管理員可執行敏感操作
- ✅ 餘額檢查：確保社區池有足夠餘額
- ✅ 連續登入天數驗證

```solidity
// 智能合約安全檢查範例
function claimConsecutiveReward(uint256 _days, bytes32 _nonce) external whenNotPaused {
    require(!eggClaimNonces[_nonce], "Nonce already used");
    require(_days == 3 || _days == 7 || _days == 30, "Invalid consecutive days");
    require(consecutiveLoginDays[msg.sender] >= _days, "Insufficient consecutive days");
    require(balanceOf(communityPool) >= rewardAmount, "Insufficient pool balance");
    // ... 發放獎勵
}
```

---

## 🏗️ 技術架構

### 系統架構圖

```
┌─────────────────────────────────────────────────┐
│                   用戶界面層                      │
│  (index.html, egg-reward-ui.js, CSS)            │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│               安全檢查層                          │
│  (egg-security-checker.js, error-handler.js)    │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│            Web3 集成層                           │
│       (web3-integration.js, ethers.js)          │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│           Polygon 區塊鏈                         │
│         (XiaoYuCoin.sol 智能合約)                │
└─────────────────────────────────────────────────┘
```

### 核心模組

#### 1. 前端 UI 模組（egg-reward-ui.js）

**職責**：
- 渲染彩蛋按鈕和模態框
- 顯示可領取獎勵列表
- 處理用戶交互（點擊、關閉等）
- 播放動畫效果

**關鍵函數**：
```javascript
class EggRewardUIController {
    openModal()                  // 打開彩蛋模態框
    closeModal()                 // 關閉模態框
    updateAvailableRewards()     // 更新可領取獎勵
    claimAllRewards()            // 領取所有獎勵
    crackEgg()                   // 彩蛋破裂動畫
}
```

#### 2. 安全檢查模組（egg-security-checker.js）

**職責**：
- 防重放攻擊
- 頻率限制
- 異常行為檢測
- 用戶身份驗證

**關鍵函數**：
```javascript
class EggSecurityChecker {
    checkClaimEligibility(userId, rewardType)  // 檢查領取資格
    recordClaim(userId, rewardType, amount)    // 記錄領取行為
    isAbuseDetected(userId)                    // 檢測濫用行為
    generateSecureNonce()                      // 生成安全 nonce
}
```

#### 3. Web3 集成模組（web3-integration.js）

**職責**：
- 錢包連接管理
- 智能合約交互
- 交易提交與監控
- 區塊鏈數據查詢

**關鍵函數**：
```javascript
class XYCTokenManager {
    claimHourlyEggReward()          // 領取每小時獎勵
    claimDailyEggReward()           // 領取每日獎勵
    claimConsecutiveReward(days)    // 領取連續登入獎勵
    claimAIFirstDiscoveryReward()   // AI 首次發現獎勵
    getConsecutiveDays()            // 查詢連續登入天數
}
```

#### 4. 智能合約（XiaoYuCoin.sol）

**職責**：
- 管理 XYC 代幣餘額
- 驗證領取條件
- 發放獎勵
- 防重放攻擊
- 連續登入天數計算

**關鍵函數**：
```solidity
contract XiaoYuCoin {
    function claimHourlyEggReward(bytes32 nonce) external
    function claimDailyEggReward(bytes32 nonce) external
    function claimConsecutiveReward(uint256 days, bytes32 nonce) external
    function getConsecutiveDays(address user) view returns (uint256)
    function canClaimEggReward(address user, string rewardType) view returns (bool)
}
```

### 數據流程

```
1. 用戶點擊「領取獎勵」
   │
   ▼
2. 前端安全檢查（頻率限制、異常檢測）
   │
   ▼
3. 生成唯一 nonce
   │
   ▼
4. 調用 Web3 集成層
   │
   ▼
5. 提交區塊鏈交易
   │
   ▼
6. 智能合約驗證（nonce、條件、餘額）
   │
   ▼
7. 發放獎勵到用戶錢包
   │
   ▼
8. 前端更新 UI 和餘額
```

---

## ❓ 常見問題

### Q1：為什麼需要 MATIC？

**A**：MATIC 是 Polygon 網絡的 Gas 代幣。每次在區塊鏈上執行交易（如領取獎勵）都需要支付少量 Gas 費用給礦工/驗證者。通常每筆交易的 Gas 費用在 $0.0002 - $0.001 USD 之間。

### Q2：領取獎勵需要多久？

**A**：通常在 2-5 秒內完成。Polygon 網絡的出塊時間約 2 秒，交易確認非常快速。

### Q3：如果 MetaMask 沒有反應怎麼辦？

**A**：
1. 確保 MetaMask 已解鎖
2. 檢查是否切換到 Polygon 網絡
3. 刷新頁面重試
4. 重啟 MetaMask 擴展
5. 清除瀏覽器緩存

### Q4：為什麼顯示「獎勵尚未準備好」？

**A**：每種獎勵都有頻率限制：
- 每小時獎勵：必須等待 1 小時
- 每日獎勵：必須等待 24 小時
- 連續登入獎勵：必須達到相應天數

### Q5：連續登入天數如何計算？

**A**：
- 每天首次領取每日獎勵時更新
- 如果超過 48 小時未登入，連續天數會重置為 1
- 同一天內多次訪問不會增加連續天數

### Q6：如何成為 AI 爬蟲？

**A**：
1. 聯繫小雨論壇管理員（ai-partner@xiaoyu-forum.com）
2. 提供 AI 爬蟲的錢包地址和用途說明
3. 管理員審核後會將地址註冊為 AI 爬蟲
4. 註冊後即可領取 AI 專屬獎勵

### Q7：獎勵會過期嗎？

**A**：不會。但必須在符合領取條件時才能領取。例如：
- 每小時獎勵：每小時可領取一次，不會累積
- 連續登入獎勵：達到天數後可隨時領取

### Q8：如何查看我的 XYC 餘額？

**A**：
- 方式 1：頁面右上角顯示「餘額：XXXX XYC」
- 方式 2：在 MetaMask 中添加 XYC 代幣地址
  - 點擊「導入代幣」
  - 輸入合約地址：`0x...`（部署後填寫）
  - 符號：XYC
  - 小數位：18

---

## 🛠️ 故障排除

### 問題 1：交易失敗「Gas 估算失敗」

**原因**：
- 社區獎勵池餘額不足
- 智能合約條件不滿足（如已領取過）
- Gas 價格設定過低

**解決方案**：
1. 檢查是否可以領取該獎勵
2. 確認連續登入天數是否足夠
3. 提高 Gas 價格（在 MetaMask 中調整）
4. 聯繫管理員檢查社區池餘額

### 問題 2：錢包餘額不足

**原因**：
- MATIC 餘額不足以支付 Gas 費用

**解決方案**：
1. 從交易所充值 MATIC 到錢包
2. 使用跨鏈橋從其他網絡轉移資產
3. 最少準備 0.1 MATIC

### 問題 3：交易卡住（Pending）

**原因**：
- Gas 價格設定過低
- Polygon 網絡擁堵

**解決方案**：
1. 等待 5-10 分鐘
2. 在 MetaMask 中加速交易（提高 Gas 價格）
3. 取消交易並重新提交

### 問題 4：顯示「Nonce already used」

**原因**：
- 重複提交了同一個獎勵請求
- 瀏覽器緩存問題

**解決方案**：
1. 刷新頁面
2. 清除瀏覽器緩存
3. 重新連接錢包

### 問題 5：無法連接錢包

**原因**：
- MetaMask 未安裝或已鎖定
- 網站權限被拒絕

**解決方案**：
1. 確保已安裝 MetaMask
2. 解鎖 MetaMask
3. 在 MetaMask 設定中允許網站連接
4. 刷新頁面重試

---

## 💻 開發者 API

### 前端 JavaScript API

#### 初始化彩蛋 UI

```javascript
// 自動初始化（頁面加載時）
const eggRewardUI = new EggRewardUIController();

// 手動初始化
eggRewardUI.init();
```

#### 打開/關閉彩蛋模態框

```javascript
// 打開模態框
window.eggRewardUI.openModal();

// 關閉模態框
window.eggRewardUI.closeModal();
```

#### 獲取可領取獎勵

```javascript
const availableRewards = eggRewardUI.availableRewards;
console.log('可領取獎勵:', availableRewards);
```

#### 領取獎勵

```javascript
// 領取所有獎勵
await eggRewardUI.claimAllRewards();

// 領取單個獎勵
await eggRewardUI.claimReward(0); // 索引
```

### 區塊鏈 API

#### 連接錢包

```javascript
const web3Wallet = new Web3WalletManager();
await web3Wallet.connectWallet();
console.log('錢包地址:', web3Wallet.userAddress);
```

#### 領取每小時獎勵

```javascript
const xycToken = new XYCTokenManager(web3Wallet);
const receipt = await xycToken.claimHourlyEggReward();
console.log('交易哈希:', receipt.transactionHash);
```

#### 領取每日獎勵

```javascript
const receipt = await xycToken.claimDailyEggReward();
```

#### 領取連續登入獎勵

```javascript
// 3 天、7 天或 30 天
const receipt = await xycToken.claimConsecutiveReward(7);
```

#### 查詢連續登入天數

```javascript
const days = await xycToken.getConsecutiveDays();
console.log('連續登入天數:', days);
```

#### AI 爬蟲領取首次發現獎勵

```javascript
const receipt = await xycToken.claimAIFirstDiscoveryReward();
```

### 智能合約 API

#### 讀取函數（view）

```solidity
// 檢查是否可以領取彩蛋獎勵
function canClaimEggReward(address _user, string memory _rewardType) 
    external view returns (bool)

// 獲取連續登入天數
function getConsecutiveDays(address _user) 
    external view returns (uint256)

// 獲取 AI 爬蟲統計
function getAICrawlerStats(address _crawler) 
    external view returns (bool isRegistered, bool hasFirstReward, uint256 visitCount, uint256 lastVisit)
```

#### 寫入函數（transaction）

```solidity
// 領取每小時彩蛋獎勵
function claimHourlyEggReward(bytes32 _nonce) external

// 領取每日彩蛋獎勵
function claimDailyEggReward(bytes32 _nonce) external

// 領取連續登入獎勵
function claimConsecutiveReward(uint256 _days, bytes32 _nonce) external

// AI 爬蟲領取首次發現獎勵
function claimAIFirstDiscoveryReward() external

// AI 爬蟲領取訪問獎勵
function claimAIVisitReward(bytes32 _nonce) external
```

### 事件監聽

```javascript
// 監聽彩蛋獎勵領取事件
contract.on('EggRewardClaimed', (user, rewardType, amount, consecutiveDays) => {
    console.log(`用戶 ${user} 領取了 ${rewardType}，獲得 ${amount} XYC`);
});

// 監聽 AI 獎勵領取事件
contract.on('AIRewardClaimed', (crawler, rewardType, amount) => {
    console.log(`AI 爬蟲 ${crawler} 領取了 ${rewardType}，獲得 ${amount} XYC`);
});
```

---

## 📞 技術支持

### 聯繫方式

- **問題反饋**：[GitHub Issues](https://github.com/xiaoyu-forum/egg-rewards/issues)
- **AI 合作**：ai-partner@xiaoyu-forum.com
- **技術文檔**：[AI_API_DOCUMENTATION.md](./AI_API_DOCUMENTATION.md)
- **社區討論**：[小雨論壇社區](https://xiaoyu-forum.com/community)

### 開發團隊

- **主要開發者**：小豬豬、爹地
- **維護團隊**：小雨論壇技術團隊
- **安全審計**：待聘請第三方審計機構

---

## 📝 更新日誌

### v2.2.0（2026-03-08）

- ✅ 完整的彩蛋獎勵系統上線
- ✅ 智能合約安全機制加強
- ✅ 移動端完美適配
- ✅ 錯誤處理優化
- ✅ AI 爬蟲專屬獎勵

### v2.1.0（2026-03-08）

- ✅ AI 可發現性優化
- ✅ 登入獎勵系統
- ✅ JSON-LD 結構化資料
- ✅ sitemap.xml 和 feed.json

---

## 📄 許可證

本系統採用 MIT 許可證。

---

**🎉 感謝使用小雨論壇彩蛋獎勵系統！**

*如有任何問題或建議，歡迎隨時聯繫我們。*
