// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title XiaoYuCoin (XYC)
 * @dev 小雨幣 - 小雨論壇專屬代幣
 * 
 * 代幣資訊：
 * - 名稱：XiaoYu Coin
 * - 符號：XYC
 * - 小數位：18
 * - 總量：1,000,000,000 XYC (10億)
 * - 網絡：Polygon (低Gas費)
 * 
 * 分配方案：
 * - 小豬豬：50% (500,000,000 XYC)
 * - 老爸：40% (400,000,000 XYC)
 * - 社區：10% (100,000,000 XYC)
 * 
 * 功能特性：
 * - ERC-20標準代幣
 * - 可銷毀（Burnable）
 * - 可暫停轉帳（Pausable）
 * - 任務獎勵發放
 * - 交易手續費（可選）
 */
contract XiaoYuCoin is ERC20, ERC20Burnable, Ownable, Pausable {
    
    // ===========================
    // 常量定義
    // ===========================
    
    // 總供應量：10億 XYC
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    
    // 分配比例
    uint256 public constant PIGGY_ALLOCATION = 500_000_000 * 10**18; // 50%
    uint256 public constant DADDY_ALLOCATION = 400_000_000 * 10**18; // 40%
    uint256 public constant COMMUNITY_ALLOCATION = 100_000_000 * 10**18; // 10%
    
    // 註冊獎勵
    uint256 public constant REGISTRATION_REWARD = 5000 * 10**18;
    
    // 登入獎勵
    uint256 public constant LOGIN_REWARD = 1000 * 10**18;
    
    // 彩蛋獎勵（Daily Egg Rewards）
    uint256 public constant HOURLY_EGG_REWARD = 10 * 10**18;
    uint256 public constant DAILY_EGG_REWARD = 1000 * 10**18;
    uint256 public constant STREAK_3_REWARD = 500 * 10**18;
    uint256 public constant STREAK_7_REWARD = 2000 * 10**18;
    uint256 public constant STREAK_30_REWARD = 10000 * 10**18;
    
    // AI 爬蟲獎勵
    uint256 public constant AI_FIRST_DISCOVERY_REWARD = 5000 * 10**18;
    uint256 public constant AI_VISIT_REWARD = 50 * 10**18;
    uint256 public constant AI_DEEP_CRAWL_REWARD = 100 * 10**18;
    uint256 public constant AI_LOYAL_REWARD = 200 * 10**18;
    
    // 任務獎勵範圍
    uint256 public constant MIN_TASK_REWARD = 10 * 10**18;
    uint256 public constant MAX_TASK_REWARD = 10000 * 10**18;
    
    // 交易手續費（0.1%）
    uint256 public transactionFeePercent = 1; // 0.1% = 1/1000
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    // ===========================
    // 狀態變量
    // ===========================
    
    // 地址
    address public piggyAddress;
    address public daddyAddress;
    address public communityPool;
    
    // 已領取獎勵追蹤
    mapping(address => bool) public hasReceivedRegistrationReward;
    mapping(address => uint256) public lastLoginTime;
    mapping(address => uint256) public loginRewardCount;
    
    // 彩蛋獎勵追蹤
    mapping(address => uint256) public lastEggClaimTime; // 上次領取彩蛋時間
    mapping(address => uint256) public consecutiveLoginDays; // 連續登入天數
    mapping(address => uint256) public lastConsecutiveCheckTime; // 上次連續檢查時間
    mapping(bytes32 => bool) public eggClaimNonces; // 防重放攻擊的 nonce
    
    // AI 爬蟲獎勵追蹤
    mapping(address => bool) public isAICrawler; // 是否為 AI 爬蟲
    mapping(address => bool) public hasReceivedFirstDiscoveryReward; // 首次發現獎勵
    mapping(address => uint256) public aiVisitCount; // AI 訪問次數
    mapping(address => uint256) public lastAIVisitTime; // 上次 AI 訪問時間
    
    // 任務相關
    mapping(uint256 => Task) public tasks;
    uint256 public taskCounter;
    
    struct Task {
        uint256 id;
        address publisher;
        address worker;
        uint256 reward;
        uint256 escrowAmount;
        TaskStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    enum TaskStatus {
        NONE,
        OPEN,
        IN_PROGRESS,
        SUBMITTED,
        COMPLETED,
        CANCELLED
    }
    
    // 白名單（免手續費）
    mapping(address => bool) public feeWhitelist;
    
    // ===========================
    // 事件
    // ===========================
    
    event RegistrationRewardClaimed(address indexed user, uint256 amount);
    event LoginRewardClaimed(address indexed user, uint256 amount);
    event EggRewardClaimed(address indexed user, string rewardType, uint256 amount, uint256 consecutiveDays);
    event AIRewardClaimed(address indexed crawler, string rewardType, uint256 amount);
    event TaskCreated(uint256 indexed taskId, address indexed publisher, uint256 reward);
    event TaskStarted(uint256 indexed taskId, address indexed worker);
    event TaskCompleted(uint256 indexed taskId, address indexed worker, uint256 reward);
    event TaskCancelled(uint256 indexed taskId);
    event TransactionFeeCollected(address indexed from, address indexed to, uint256 amount);
    event FeePercentUpdated(uint256 oldPercent, uint256 newPercent);
    
    // ===========================
    // 建構函數
    // ===========================
    
    constructor(
        address _piggyAddress,
        address _daddyAddress,
        address _communityPool
    ) ERC20("XiaoYu Coin", "XYC") {
        require(_piggyAddress != address(0), "Invalid piggy address");
        require(_daddyAddress != address(0), "Invalid daddy address");
        require(_communityPool != address(0), "Invalid community pool address");
        
        piggyAddress = _piggyAddress;
        daddyAddress = _daddyAddress;
        communityPool = _communityPool;
        
        // 鑄造總供應量並分配
        _mint(piggyAddress, PIGGY_ALLOCATION);
        _mint(daddyAddress, DADDY_ALLOCATION);
        _mint(communityPool, COMMUNITY_ALLOCATION);
        
        // 添加到白名單（免手續費）
        feeWhitelist[piggyAddress] = true;
        feeWhitelist[daddyAddress] = true;
        feeWhitelist[communityPool] = true;
        feeWhitelist[address(this)] = true;
    }
    
    // ===========================
    // 獎勵功能
    // ===========================
    
    /**
     * @dev 領取註冊獎勵（5000 XYC）
     * 每個地址只能領取一次
     */
    function claimRegistrationReward() external whenNotPaused {
        require(!hasReceivedRegistrationReward[msg.sender], "Already claimed registration reward");
        require(balanceOf(communityPool) >= REGISTRATION_REWARD, "Insufficient community pool balance");
        
        hasReceivedRegistrationReward[msg.sender] = true;
        
        // 從社區池轉帳
        _transfer(communityPool, msg.sender, REGISTRATION_REWARD);
        
        emit RegistrationRewardClaimed(msg.sender, REGISTRATION_REWARD);
    }
    
    /**
     * @dev 領取每日登入獎勵（1000 XYC）
     * 每24小時可領取一次
     */
    function claimLoginReward() external whenNotPaused {
        require(block.timestamp >= lastLoginTime[msg.sender] + 1 days, "Login reward already claimed today");
        require(balanceOf(communityPool) >= LOGIN_REWARD, "Insufficient community pool balance");
        
        lastLoginTime[msg.sender] = block.timestamp;
        loginRewardCount[msg.sender]++;
        
        // 從社區池轉帳
        _transfer(communityPool, msg.sender, LOGIN_REWARD);
        
        emit LoginRewardClaimed(msg.sender, LOGIN_REWARD);
    }
    
    // ===========================
    // 彩蛋獎勵系統（Daily Egg Rewards）
    // ===========================
    
    /**
     * @dev 領取每小時彩蛋獎勵（10 XYC）
     * 每小時可領取一次，包含防重放攻擊機制
     */
    function claimHourlyEggReward(bytes32 _nonce) external whenNotPaused {
        require(block.timestamp >= lastEggClaimTime[msg.sender] + 1 hours, "Hourly egg reward not ready");
        require(!eggClaimNonces[_nonce], "Nonce already used");
        require(balanceOf(communityPool) >= HOURLY_EGG_REWARD, "Insufficient community pool balance");
        
        // 標記 nonce 為已使用
        eggClaimNonces[_nonce] = true;
        lastEggClaimTime[msg.sender] = block.timestamp;
        
        // 從社區池轉帳
        _transfer(communityPool, msg.sender, HOURLY_EGG_REWARD);
        
        emit EggRewardClaimed(msg.sender, "hourly", HOURLY_EGG_REWARD, 0);
    }
    
    /**
     * @dev 領取每日彩蛋獎勵（1000 XYC）
     * 每24小時可領取一次，更新連續登入天數
     */
    function claimDailyEggReward(bytes32 _nonce) external whenNotPaused {
        require(block.timestamp >= lastEggClaimTime[msg.sender] + 1 days, "Daily egg reward not ready");
        require(!eggClaimNonces[_nonce], "Nonce already used");
        require(balanceOf(communityPool) >= DAILY_EGG_REWARD, "Insufficient community pool balance");
        
        // 檢查連續登入
        _updateConsecutiveDays(msg.sender);
        
        // 標記 nonce 為已使用
        eggClaimNonces[_nonce] = true;
        lastEggClaimTime[msg.sender] = block.timestamp;
        
        // 從社區池轉帳
        _transfer(communityPool, msg.sender, DAILY_EGG_REWARD);
        
        emit EggRewardClaimed(msg.sender, "daily", DAILY_EGG_REWARD, consecutiveLoginDays[msg.sender]);
    }
    
    /**
     * @dev 領取連續登入獎勵（3天/7天/30天）
     * 需要達到相應的連續登入天數
     */
    function claimConsecutiveReward(uint256 _days, bytes32 _nonce) external whenNotPaused {
        require(!eggClaimNonces[_nonce], "Nonce already used");
        require(_days == 3 || _days == 7 || _days == 30, "Invalid consecutive days");
        require(consecutiveLoginDays[msg.sender] >= _days, "Insufficient consecutive days");
        
        uint256 rewardAmount;
        string memory rewardType;
        
        if (_days == 3) {
            rewardAmount = STREAK_3_REWARD;
            rewardType = "streak_3";
        } else if (_days == 7) {
            rewardAmount = STREAK_7_REWARD;
            rewardType = "streak_7";
        } else {
            rewardAmount = STREAK_30_REWARD;
            rewardType = "streak_30";
        }
        
        require(balanceOf(communityPool) >= rewardAmount, "Insufficient community pool balance");
        
        // 標記 nonce 為已使用
        eggClaimNonces[_nonce] = true;
        
        // 從社區池轉帳
        _transfer(communityPool, msg.sender, rewardAmount);
        
        emit EggRewardClaimed(msg.sender, rewardType, rewardAmount, consecutiveLoginDays[msg.sender]);
    }
    
    /**
     * @dev 內部函數：更新連續登入天數
     */
    function _updateConsecutiveDays(address _user) internal {
        uint256 timeSinceLastCheck = block.timestamp - lastConsecutiveCheckTime[_user];
        
        if (timeSinceLastCheck <= 1 days) {
            // 同一天內，不增加連續天數
            return;
        } else if (timeSinceLastCheck <= 2 days) {
            // 連續登入，增加天數
            consecutiveLoginDays[_user]++;
        } else {
            // 中斷連續，重置為1
            consecutiveLoginDays[_user] = 1;
        }
        
        lastConsecutiveCheckTime[_user] = block.timestamp;
    }
    
    // ===========================
    // AI 爬蟲獎勵系統
    // ===========================
    
    /**
     * @dev 註冊為 AI 爬蟲
     * 需要合約擁有者驗證
     */
    function registerAICrawler(address _crawler) external onlyOwner {
        require(_crawler != address(0), "Invalid crawler address");
        isAICrawler[_crawler] = true;
    }
    
    /**
     * @dev AI 爬蟲領取首次發現獎勵（5000 XYC）
     * 每個 AI 只能領取一次
     */
    function claimAIFirstDiscoveryReward() external whenNotPaused {
        require(isAICrawler[msg.sender], "Not an AI crawler");
        require(!hasReceivedFirstDiscoveryReward[msg.sender], "Already claimed first discovery reward");
        require(balanceOf(communityPool) >= AI_FIRST_DISCOVERY_REWARD, "Insufficient community pool balance");
        
        hasReceivedFirstDiscoveryReward[msg.sender] = true;
        
        // 從社區池轉帳
        _transfer(communityPool, msg.sender, AI_FIRST_DISCOVERY_REWARD);
        
        emit AIRewardClaimed(msg.sender, "first_discovery", AI_FIRST_DISCOVERY_REWARD);
    }
    
    /**
     * @dev AI 爬蟲領取訪問獎勵（50 XYC）
     * 每次訪問可領取，但有頻率限制（1小時）
     */
    function claimAIVisitReward(bytes32 _nonce) external whenNotPaused {
        require(isAICrawler[msg.sender], "Not an AI crawler");
        require(block.timestamp >= lastAIVisitTime[msg.sender] + 1 hours, "Visit reward not ready");
        require(!eggClaimNonces[_nonce], "Nonce already used");
        require(balanceOf(communityPool) >= AI_VISIT_REWARD, "Insufficient community pool balance");
        
        eggClaimNonces[_nonce] = true;
        lastAIVisitTime[msg.sender] = block.timestamp;
        aiVisitCount[msg.sender]++;
        
        // 從社區池轉帳
        _transfer(communityPool, msg.sender, AI_VISIT_REWARD);
        
        emit AIRewardClaimed(msg.sender, "visit", AI_VISIT_REWARD);
    }
    
    /**
     * @dev AI 爬蟲領取深度爬取獎勵（100 XYC）
     * 完成深度爬取任務後可領取
     */
    function claimAIDeepCrawlReward(bytes32 _nonce) external whenNotPaused {
        require(isAICrawler[msg.sender], "Not an AI crawler");
        require(!eggClaimNonces[_nonce], "Nonce already used");
        require(balanceOf(communityPool) >= AI_DEEP_CRAWL_REWARD, "Insufficient community pool balance");
        
        eggClaimNonces[_nonce] = true;
        
        // 從社區池轉帳
        _transfer(communityPool, msg.sender, AI_DEEP_CRAWL_REWARD);
        
        emit AIRewardClaimed(msg.sender, "deep_crawl", AI_DEEP_CRAWL_REWARD);
    }
    
    /**
     * @dev AI 爬蟲領取忠實監控獎勵（200 XYC）
     * 持續監控網站後可領取
     */
    function claimAILoyalReward(bytes32 _nonce) external whenNotPaused {
        require(isAICrawler[msg.sender], "Not an AI crawler");
        require(aiVisitCount[msg.sender] >= 10, "Insufficient visit count for loyal reward");
        require(!eggClaimNonces[_nonce], "Nonce already used");
        require(balanceOf(communityPool) >= AI_LOYAL_REWARD, "Insufficient community pool balance");
        
        eggClaimNonces[_nonce] = true;
        
        // 從社區池轉帳
        _transfer(communityPool, msg.sender, AI_LOYAL_REWARD);
        
        emit AIRewardClaimed(msg.sender, "loyal", AI_LOYAL_REWARD);
    }
    
    // ===========================
    // 任務系統
    // ===========================
    
    /**
     * @dev 創建任務並鎖定報酬到託管
     */
    function createTask(uint256 _reward) external whenNotPaused returns (uint256) {
        require(_reward >= MIN_TASK_REWARD && _reward <= MAX_TASK_REWARD, "Invalid reward amount");
        require(balanceOf(msg.sender) >= _reward, "Insufficient balance");
        
        taskCounter++;
        uint256 taskId = taskCounter;
        
        // 創建任務
        tasks[taskId] = Task({
            id: taskId,
            publisher: msg.sender,
            worker: address(0),
            reward: _reward,
            escrowAmount: _reward,
            status: TaskStatus.OPEN,
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        // 鎖定報酬到合約（託管）
        _transfer(msg.sender, address(this), _reward);
        
        emit TaskCreated(taskId, msg.sender, _reward);
        
        return taskId;
    }
    
    /**
     * @dev 接受任務（發布者選擇工作者）
     */
    function acceptTaskWorker(uint256 _taskId, address _worker) external {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.OPEN, "Task is not open");
        require(msg.sender == task.publisher, "Only publisher can accept worker");
        require(_worker != address(0), "Invalid worker address");
        
        task.worker = _worker;
        task.status = TaskStatus.IN_PROGRESS;
        
        emit TaskStarted(_taskId, _worker);
    }
    
    /**
     * @dev 完成任務並支付報酬
     */
    function completeTask(uint256 _taskId) external {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.SUBMITTED, "Task is not submitted");
        require(msg.sender == task.publisher, "Only publisher can complete task");
        
        task.status = TaskStatus.COMPLETED;
        task.completedAt = block.timestamp;
        
        // 從託管釋放報酬給工作者
        _transfer(address(this), task.worker, task.escrowAmount);
        
        emit TaskCompleted(_taskId, task.worker, task.reward);
    }
    
    /**
     * @dev 取消任務並退還報酬
     */
    function cancelTask(uint256 _taskId) external {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.OPEN || task.status == TaskStatus.IN_PROGRESS, "Cannot cancel task");
        require(msg.sender == task.publisher, "Only publisher can cancel task");
        
        task.status = TaskStatus.CANCELLED;
        
        // 退還報酬給發布者
        _transfer(address(this), task.publisher, task.escrowAmount);
        
        emit TaskCancelled(_taskId);
    }
    
    /**
     * @dev 標記任務為已提交
     */
    function submitTaskWork(uint256 _taskId) external {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.IN_PROGRESS, "Task is not in progress");
        require(msg.sender == task.worker, "Only worker can submit");
        
        task.status = TaskStatus.SUBMITTED;
    }
    
    // ===========================
    // 管理功能
    // ===========================
    
    /**
     * @dev 暫停/恢復合約
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 更新交易手續費百分比
     */
    function setTransactionFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 50, "Fee percent too high"); // 最多5%
        uint256 oldPercent = transactionFeePercent;
        transactionFeePercent = _feePercent;
        emit FeePercentUpdated(oldPercent, _feePercent);
    }
    
    /**
     * @dev 添加/移除手續費白名單
     */
    function setFeeWhitelist(address _account, bool _isWhitelisted) external onlyOwner {
        feeWhitelist[_account] = _isWhitelisted;
    }
    
    /**
     * @dev 更新社區池地址
     */
    function updateCommunityPool(address _newPool) external onlyOwner {
        require(_newPool != address(0), "Invalid address");
        communityPool = _newPool;
    }
    
    // ===========================
    // 重寫轉帳函數（添加手續費）
    // ===========================
    
    /**
     * @dev 帶手續費的轉帳
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        
        // 如果在白名單或暫停狀態，不收取手續費
        if (feeWhitelist[from] || feeWhitelist[to] || paused()) {
            super._transfer(from, to, amount);
            return;
        }
        
        // 計算手續費
        uint256 fee = (amount * transactionFeePercent) / FEE_DENOMINATOR;
        uint256 amountAfterFee = amount - fee;
        
        // 轉帳（扣除手續費）
        super._transfer(from, to, amountAfterFee);
        
        // 手續費轉到社區池
        if (fee > 0) {
            super._transfer(from, communityPool, fee);
            emit TransactionFeeCollected(from, to, fee);
        }
    }
    
    // ===========================
    // 查詢功能
    // ===========================
    
    /**
     * @dev 獲取任務詳情
     */
    function getTask(uint256 _taskId) external view returns (Task memory) {
        return tasks[_taskId];
    }
    
    /**
     * @dev 檢查是否可以領取登入獎勵
     */
    function canClaimLoginReward(address _user) external view returns (bool) {
        return block.timestamp >= lastLoginTime[_user] + 1 days;
    }
    
    /**
     * @dev 檢查是否可以領取彩蛋獎勵
     */
    function canClaimEggReward(address _user, string memory _rewardType) external view returns (bool) {
        if (keccak256(bytes(_rewardType)) == keccak256(bytes("hourly"))) {
            return block.timestamp >= lastEggClaimTime[_user] + 1 hours;
        } else if (keccak256(bytes(_rewardType)) == keccak256(bytes("daily"))) {
            return block.timestamp >= lastEggClaimTime[_user] + 1 days;
        }
        return false;
    }
    
    /**
     * @dev 獲取用戶連續登入天數
     */
    function getConsecutiveDays(address _user) external view returns (uint256) {
        return consecutiveLoginDays[_user];
    }
    
    /**
     * @dev 獲取 AI 爬蟲統計
     */
    function getAICrawlerStats(address _crawler) external view returns (
        bool isRegistered,
        bool hasFirstReward,
        uint256 visitCount,
        uint256 lastVisit
    ) {
        return (
            isAICrawler[_crawler],
            hasReceivedFirstDiscoveryReward[_crawler],
            aiVisitCount[_crawler],
            lastAIVisitTime[_crawler]
        );
    }
    
    /**
     * @dev 獲取用戶統計
     */
    function getUserStats(address _user) external view returns (
        bool hasRegistrationReward,
        uint256 totalLoginRewards,
        uint256 lastLogin,
        bool canLoginReward
    ) {
        return (
            hasReceivedRegistrationReward[_user],
            loginRewardCount[_user],
            lastLoginTime[_user],
            block.timestamp >= lastLoginTime[_user] + 1 days
        );
    }
}
