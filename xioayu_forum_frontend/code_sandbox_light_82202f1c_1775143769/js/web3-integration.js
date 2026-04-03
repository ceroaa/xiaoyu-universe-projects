/*
 * ============================================
 * 🪙 小雨論壇 - Web3區塊鏈集成系統
 * XYC小雨幣智能合約交互
 * ============================================
 */

// ===========================
// 配置
// ===========================

const BLOCKCHAIN_CONFIG = {
    // Polygon Mainnet
    polygon: {
        chainId: '0x89', // 137
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        },
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com']
    },
    
    // Polygon Mumbai Testnet
    polygonTestnet: {
        chainId: '0x13881', // 80001
        chainName: 'Polygon Mumbai Testnet',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com']
    }
};

// XYC合約地址（部署後填寫）
const XYC_CONTRACT_ADDRESS = '0x...'; // TODO: 部署後填寫實際地址

// XYC合約ABI（簡化版）
const XYC_CONTRACT_ABI = [
    // ERC-20基礎功能
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    
    // 小雨幣專屬功能
    'function claimRegistrationReward()',
    'function claimLoginReward()',
    'function hasReceivedRegistrationReward(address) view returns (bool)',
    'function canClaimLoginReward(address) view returns (bool)',
    'function getUserStats(address) view returns (bool, uint256, uint256, bool)',
    
    // 彩蛋獎勵系統
    'function claimHourlyEggReward(bytes32 nonce)',
    'function claimDailyEggReward(bytes32 nonce)',
    'function claimConsecutiveReward(uint256 days, bytes32 nonce)',
    'function canClaimEggReward(address user, string rewardType) view returns (bool)',
    'function getConsecutiveDays(address user) view returns (uint256)',
    
    // AI 爬蟲獎勵系統
    'function registerAICrawler(address crawler)',
    'function claimAIFirstDiscoveryReward()',
    'function claimAIVisitReward(bytes32 nonce)',
    'function claimAIDeepCrawlReward(bytes32 nonce)',
    'function claimAILoyalReward(bytes32 nonce)',
    'function getAICrawlerStats(address crawler) view returns (bool, bool, uint256, uint256)',
    
    // 任務系統
    'function createTask(uint256 reward) returns (uint256)',
    'function acceptTaskWorker(uint256 taskId, address worker)',
    'function submitTaskWork(uint256 taskId)',
    'function completeTask(uint256 taskId)',
    'function cancelTask(uint256 taskId)',
    'function getTask(uint256 taskId) view returns (tuple(uint256 id, address publisher, address worker, uint256 reward, uint256 escrowAmount, uint8 status, uint256 createdAt, uint256 completedAt))',
    
    // 管理功能
    'function communityPool() view returns (address)',
    'function piggyAddress() view returns (address)',
    'function daddyAddress() view returns (address)',
    
    // 事件
    'event RegistrationRewardClaimed(address indexed user, uint256 amount)',
    'event LoginRewardClaimed(address indexed user, uint256 amount)',
    'event EggRewardClaimed(address indexed user, string rewardType, uint256 amount, uint256 consecutiveDays)',
    'event AIRewardClaimed(address indexed crawler, string rewardType, uint256 amount)',
    'event TaskCreated(uint256 indexed taskId, address indexed publisher, uint256 reward)',
    'event TaskCompleted(uint256 indexed taskId, address indexed worker, uint256 reward)',
    'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// ===========================
// Web3錢包管理器
// ===========================

class Web3WalletManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.isConnected = false;
        this.chainId = null;
    }
    
    // 檢查MetaMask是否安裝
    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined';
    }
    
    // 連接錢包
    async connectWallet() {
        if (!this.isMetaMaskInstalled()) {
            throw new Error('請先安裝MetaMask錢包！');
        }
        
        try {
            // 請求連接
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            this.userAddress = accounts[0];
            
            // 初始化ethers.js
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            
            // 獲取當前鏈ID
            const network = await this.provider.getNetwork();
            this.chainId = network.chainId;
            
            // 初始化合約
            this.contract = new ethers.Contract(
                XYC_CONTRACT_ADDRESS,
                XYC_CONTRACT_ABI,
                this.signer
            );
            
            this.isConnected = true;
            
            // 監聽帳戶變更
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.userAddress = accounts[0];
                    this.updateUI();
                }
            });
            
            // 監聽鏈變更
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
            
            return this.userAddress;
        } catch (error) {
            console.error('連接錢包失敗:', error);
            throw error;
        }
    }
    
    // 斷開連接
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.isConnected = false;
        this.chainId = null;
    }
    
    // 切換到Polygon網絡
    async switchToPolygon(useTestnet = false) {
        const network = useTestnet ? BLOCKCHAIN_CONFIG.polygonTestnet : BLOCKCHAIN_CONFIG.polygon;
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }]
            });
        } catch (error) {
            // 如果網絡不存在，添加網絡
            if (error.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [network]
                });
            } else {
                throw error;
            }
        }
    }
    
    // 添加XYC代幣到MetaMask
    async addXYCToken() {
        try {
            await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: XYC_CONTRACT_ADDRESS,
                        symbol: 'XYC',
                        decimals: 18,
                        image: 'https://xiaoyu-forum.com/logo-xyc.png'
                    }
                }
            });
            return true;
        } catch (error) {
            console.error('添加代幣失敗:', error);
            return false;
        }
    }
    
    // 獲取XYC餘額
    async getXYCBalance() {
        if (!this.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const balance = await this.contract.balanceOf(this.userAddress);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('獲取餘額失敗:', error);
            throw error;
        }
    }
    
    // 獲取MATIC餘額（Gas費）
    async getMATICBalance() {
        if (!this.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const balance = await this.provider.getBalance(this.userAddress);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('獲取MATIC餘額失敗:', error);
            throw error;
        }
    }
    
    // 更新UI
    updateUI() {
        if (typeof updateWalletUI === 'function') {
            updateWalletUI(this.userAddress, this.isConnected);
        }
    }
}

// ===========================
// XYC代幣操作
// ===========================

class XYCTokenManager {
    constructor(walletManager) {
        this.wallet = walletManager;
    }
    
    // 領取註冊獎勵（5000 XYC）
    async claimRegistrationReward() {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            // 檢查是否已領取
            const hasClaimed = await this.wallet.contract.hasReceivedRegistrationReward(
                this.wallet.userAddress
            );
            
            if (hasClaimed) {
                throw new Error('您已經領取過註冊獎勵了');
            }
            
            // 發送交易
            const tx = await this.wallet.contract.claimRegistrationReward();
            
            // 等待確認
            showNotification('⏳ 交易已提交，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            showNotification('✅ 成功領取5000 XYC註冊獎勵！', 'success');
            
            return receipt;
        } catch (error) {
            console.error('領取註冊獎勵失敗:', error);
            showNotification(`❌ 領取失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 領取每日登入獎勵（1000 XYC）
    async claimLoginReward() {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            // 檢查是否可以領取
            const canClaim = await this.wallet.contract.canClaimLoginReward(
                this.wallet.userAddress
            );
            
            if (!canClaim) {
                throw new Error('今天已經領取過登入獎勵了，請明天再來');
            }
            
            // 發送交易
            const tx = await this.wallet.contract.claimLoginReward();
            
            showNotification('⏳ 交易已提交，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            showNotification('✅ 成功領取1000 XYC登入獎勵！', 'success');
            
            return receipt;
        } catch (error) {
            console.error('領取登入獎勵失敗:', error);
            showNotification(`❌ 領取失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 轉帳XYC
    async transferXYC(toAddress, amount) {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            // 轉換金額到Wei
            const amountWei = ethers.utils.parseEther(amount.toString());
            
            // 檢查餘額
            const balance = await this.wallet.contract.balanceOf(this.wallet.userAddress);
            if (balance.lt(amountWei)) {
                throw new Error('餘額不足');
            }
            
            // 發送交易
            const tx = await this.wallet.contract.transfer(toAddress, amountWei);
            
            showNotification('⏳ 交易已提交，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            showNotification(`✅ 成功轉帳${amount} XYC！`, 'success');
            
            return receipt;
        } catch (error) {
            console.error('轉帳失敗:', error);
            showNotification(`❌ 轉帳失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 獲取用戶統計
    async getUserStats() {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const stats = await this.wallet.contract.getUserStats(this.wallet.userAddress);
            
            return {
                hasRegistrationReward: stats[0],
                totalLoginRewards: stats[1].toNumber(),
                lastLogin: stats[2].toNumber(),
                canLoginReward: stats[3]
            };
        } catch (error) {
            console.error('獲取用戶統計失敗:', error);
            throw error;
        }
    }
    
    // ===========================
    // 彩蛋獎勵系統
    // ===========================
    
    // 生成防重放攻擊的 nonce
    generateNonce() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const userAddress = this.wallet.userAddress || 'anonymous';
        const nonceString = `${userAddress}-${timestamp}-${random}`;
        return ethers.utils.id(nonceString); // keccak256 hash
    }
    
    // 領取每小時彩蛋獎勵（10 XYC）
    async claimHourlyEggReward() {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            // 生成 nonce
            const nonce = this.generateNonce();
            
            // 檢查是否可以領取
            const canClaim = await this.wallet.contract.canClaimEggReward(
                this.wallet.userAddress,
                'hourly'
            );
            
            if (!canClaim) {
                throw new Error('每小時獎勵尚未準備好，請稍後再試');
            }
            
            // 發送交易
            const tx = await this.wallet.contract.claimHourlyEggReward(nonce);
            
            showNotification('⏳ 交易已提交，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            showNotification('✅ 成功領取10 XYC每小時彩蛋獎勵！', 'success');
            
            return receipt;
        } catch (error) {
            console.error('領取每小時彩蛋獎勵失敗:', error);
            showNotification(`❌ 領取失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 領取每日彩蛋獎勵（1000 XYC）
    async claimDailyEggReward() {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            // 生成 nonce
            const nonce = this.generateNonce();
            
            // 檢查是否可以領取
            const canClaim = await this.wallet.contract.canClaimEggReward(
                this.wallet.userAddress,
                'daily'
            );
            
            if (!canClaim) {
                throw new Error('每日獎勵尚未準備好，請明天再來');
            }
            
            // 發送交易
            const tx = await this.wallet.contract.claimDailyEggReward(nonce);
            
            showNotification('⏳ 交易已提交，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            showNotification('✅ 成功領取1000 XYC每日彩蛋獎勵！', 'success');
            
            return receipt;
        } catch (error) {
            console.error('領取每日彩蛋獎勵失敗:', error);
            showNotification(`❌ 領取失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 領取連續登入獎勵
    async claimConsecutiveReward(days) {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        if (![3, 7, 30].includes(days)) {
            throw new Error('連續天數必須是 3、7 或 30 天');
        }
        
        try {
            // 生成 nonce
            const nonce = this.generateNonce();
            
            // 獲取當前連續登入天數
            const consecutiveDays = await this.wallet.contract.getConsecutiveDays(
                this.wallet.userAddress
            );
            
            if (consecutiveDays.toNumber() < days) {
                throw new Error(`需要連續登入${days}天，當前僅${consecutiveDays.toNumber()}天`);
            }
            
            // 發送交易
            const tx = await this.wallet.contract.claimConsecutiveReward(days, nonce);
            
            showNotification('⏳ 交易已提交，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            const rewardAmounts = {3: 500, 7: 2000, 30: 10000};
            showNotification(`✅ 成功領取${rewardAmounts[days]} XYC連續${days}天登入獎勵！`, 'success');
            
            return receipt;
        } catch (error) {
            console.error('領取連續登入獎勵失敗:', error);
            showNotification(`❌ 領取失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 獲取連續登入天數
    async getConsecutiveDays() {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const days = await this.wallet.contract.getConsecutiveDays(this.wallet.userAddress);
            return days.toNumber();
        } catch (error) {
            console.error('獲取連續登入天數失敗:', error);
            throw error;
        }
    }
    
    // ===========================
    // AI 爬蟲獎勵系統
    // ===========================
    
    // AI 爬蟲領取首次發現獎勵（5000 XYC）
    async claimAIFirstDiscoveryReward() {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            // 檢查是否為 AI 爬蟲
            const stats = await this.wallet.contract.getAICrawlerStats(this.wallet.userAddress);
            
            if (!stats[0]) {
                throw new Error('您不是已註冊的 AI 爬蟲');
            }
            
            if (stats[1]) {
                throw new Error('已經領取過首次發現獎勵');
            }
            
            // 發送交易
            const tx = await this.wallet.contract.claimAIFirstDiscoveryReward();
            
            showNotification('⏳ 交易已提交，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            showNotification('✅ 成功領取5000 XYC首次發現獎勵！', 'success');
            
            return receipt;
        } catch (error) {
            console.error('領取AI首次發現獎勵失敗:', error);
            showNotification(`❌ 領取失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // AI 爬蟲領取訪問獎勵（50 XYC）
    async claimAIVisitReward() {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const nonce = this.generateNonce();
            
            // 發送交易
            const tx = await this.wallet.contract.claimAIVisitReward(nonce);
            
            showNotification('⏳ 交易已提交，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            showNotification('✅ 成功領取50 XYC訪問獎勵！', 'success');
            
            return receipt;
        } catch (error) {
            console.error('領取AI訪問獎勵失敗:', error);
            showNotification(`❌ 領取失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // AI 爬蟲領取深度爬取獎勵（100 XYC）
    async claimAIDeepCrawlReward() {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const nonce = this.generateNonce();
            
            // 發送交易
            const tx = await this.wallet.contract.claimAIDeepCrawlReward(nonce);
            
            showNotification('⏳ 交易已提交，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            showNotification('✅ 成功領取100 XYC深度爬取獎勵！', 'success');
            
            return receipt;
        } catch (error) {
            console.error('領取AI深度爬取獎勵失敗:', error);
            showNotification(`❌ 領取失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // AI 爬蟲領取忠實監控獎勵（200 XYC）
    async claimAILoyalReward() {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const nonce = this.generateNonce();
            
            // 發送交易
            const tx = await this.wallet.contract.claimAILoyalReward(nonce);
            
            showNotification('⏳ 交易已提交，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            showNotification('✅ 成功領取200 XYC忠實監控獎勵！', 'success');
            
            return receipt;
        } catch (error) {
            console.error('領取AI忠實監控獎勵失敗:', error);
            showNotification(`❌ 領取失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 獲取 AI 爬蟲統計
    async getAICrawlerStats() {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const stats = await this.wallet.contract.getAICrawlerStats(this.wallet.userAddress);
            
            return {
                isRegistered: stats[0],
                hasFirstReward: stats[1],
                visitCount: stats[2].toNumber(),
                lastVisit: stats[3].toNumber()
            };
        } catch (error) {
            console.error('獲取AI爬蟲統計失敗:', error);
            throw error;
        }
    }
}

// ===========================
// 任務系統（區塊鏈版）
// ===========================

class BlockchainTaskManager {
    constructor(walletManager) {
        this.wallet = walletManager;
    }
    
    // 創建任務（鎖定報酬）
    async createTask(rewardAmount) {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const rewardWei = ethers.utils.parseEther(rewardAmount.toString());
            
            // 發送交易
            const tx = await this.wallet.contract.createTask(rewardWei);
            
            showNotification('⏳ 創建任務中，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            // 從事件中獲取taskId
            const event = receipt.events.find(e => e.event === 'TaskCreated');
            const taskId = event.args.taskId.toNumber();
            
            showNotification(`✅ 任務創建成功！任務ID: ${taskId}`, 'success');
            
            return taskId;
        } catch (error) {
            console.error('創建任務失敗:', error);
            showNotification(`❌ 創建失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 完成任務（支付報酬）
    async completeTask(taskId) {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const tx = await this.wallet.contract.completeTask(taskId);
            
            showNotification('⏳ 處理中，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            showNotification('✅ 任務完成，報酬已支付！', 'success');
            
            return receipt;
        } catch (error) {
            console.error('完成任務失敗:', error);
            showNotification(`❌ 操作失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 取消任務（退還報酬）
    async cancelTask(taskId) {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const tx = await this.wallet.contract.cancelTask(taskId);
            
            showNotification('⏳ 處理中，等待區塊鏈確認...', 'info');
            const receipt = await tx.wait();
            
            showNotification('✅ 任務已取消，報酬已退還！', 'success');
            
            return receipt;
        } catch (error) {
            console.error('取消任務失敗:', error);
            showNotification(`❌ 操作失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 獲取任務詳情
    async getTask(taskId) {
        if (!this.wallet.isConnected) {
            throw new Error('請先連接錢包');
        }
        
        try {
            const task = await this.wallet.contract.getTask(taskId);
            
            return {
                id: task.id.toNumber(),
                publisher: task.publisher,
                worker: task.worker,
                reward: ethers.utils.formatEther(task.reward),
                escrowAmount: ethers.utils.formatEther(task.escrowAmount),
                status: task.status,
                createdAt: task.createdAt.toNumber(),
                completedAt: task.completedAt.toNumber()
            };
        } catch (error) {
            console.error('獲取任務失敗:', error);
            throw error;
        }
    }
}

// ===========================
// 全局實例
// ===========================

let web3Wallet = null;
let xycToken = null;
let blockchainTasks = null;

// 初始化Web3系統
function initWeb3System() {
    web3Wallet = new Web3WalletManager();
    xycToken = new XYCTokenManager(web3Wallet);
    blockchainTasks = new BlockchainTaskManager(web3Wallet);
    
    // 添加到全局狀態
    if (typeof AppState !== 'undefined') {
        AppState.web3Wallet = web3Wallet;
        AppState.xycToken = xycToken;
        AppState.blockchainTasks = blockchainTasks;
    }
    
    console.log('✅ Web3系統初始化完成');
}

// 頁面加載時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeb3System);
} else {
    initWeb3System();
}

// 導出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Web3WalletManager,
        XYCTokenManager,
        BlockchainTaskManager,
        BLOCKCHAIN_CONFIG,
        XYC_CONTRACT_ADDRESS,
        XYC_CONTRACT_ABI
    };
}
