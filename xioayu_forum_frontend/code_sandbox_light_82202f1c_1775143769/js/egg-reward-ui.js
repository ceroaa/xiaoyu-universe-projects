/**
 * 🎁 小雨論壇 - 彩蛋獎勵 UI 控制器
 * Egg Reward UI Controller
 * 
 * 功能：
 * - 彩蛋按鈕點擊處理
 * - 彩蛋模態框顯示/隱藏
 * - 獎勵列表渲染
 * - 領取獎勵動畫
 * - 實時更新可領取數量
 */

class EggRewardUIController {
    constructor() {
        this.modal = null;
        this.eggButton = null;
        this.eggBadge = null;
        this.rewardsList = null;
        this.claimButton = null;
        this.isModalOpen = false;
        this.availableRewards = [];
        
        this.init();
    }

    /**
     * 初始化 UI 控制器
     */
    init() {
        // 等待 DOM 加載完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
    }

    /**
     * 設置 UI 元素和事件監聽
     */
    setupUI() {
        // 獲取 DOM 元素
        this.modal = document.getElementById('egg-reward-modal');
        this.eggButton = document.getElementById('egg-reward-btn');
        this.eggBadge = document.getElementById('egg-badge');
        this.rewardsList = document.getElementById('rewards-list');
        this.claimButton = document.getElementById('claim-rewards-btn');

        if (!this.eggButton || !this.modal) {
            console.warn('⚠️ Egg reward UI elements not found');
            return;
        }

        // 綁定事件
        this.eggButton.addEventListener('click', () => this.openModal());
        
        // 點擊彩蛋打開動畫
        const egg = document.getElementById('reward-egg');
        if (egg) {
            egg.addEventListener('click', () => this.crackEgg());
        }

        // 點擊模態框外部關閉
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // 定時更新可領取獎勵
        setInterval(() => this.updateAvailableRewards(), 5000);

        // 初始更新
        this.updateAvailableRewards();

        console.log('✅ Egg Reward UI Controller initialized');
    }

    /**
     * 打開彩蛋模態框
     */
    openModal() {
        if (!this.modal) return;

        this.modal.style.display = 'flex';
        this.isModalOpen = true;
        document.body.style.overflow = 'hidden';

        // 更新獎勵數據
        this.loadRewardStats();
        this.renderRewardsList();

        // 播放打開音效（可選）
        this.playSound('modal-open');
    }

    /**
     * 關閉彩蛋模態框
     */
    closeModal() {
        if (!this.modal) return;

        this.modal.style.display = 'none';
        this.isModalOpen = false;
        document.body.style.overflow = '';

        // 播放關閉音效（可選）
        this.playSound('modal-close');
    }

    /**
     * 彩蛋破殼動畫
     */
    crackEgg() {
        const egg = document.getElementById('reward-egg');
        if (!egg) return;

        // 添加破殼動畫
        egg.classList.add('cracking');

        setTimeout(() => {
            egg.classList.remove('cracking');
            egg.classList.add('opened');

            // 顯示獎勵
            this.showRewardExplosion();

            setTimeout(() => {
                egg.classList.remove('opened');
            }, 1000);
        }, 600);

        // 播放破殼音效
        this.playSound('egg-crack');
    }

    /**
     * 顯示獎勵爆炸效果
     */
    showRewardExplosion() {
        const container = document.querySelector('.egg-animation-container');
        if (!container) return;

        // 創建金幣飛濺效果
        for (let i = 0; i < 12; i++) {
            const coin = document.createElement('div');
            coin.className = 'coin-animation';
            coin.textContent = '🪙';
            coin.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
            coin.style.top = `${50 + (Math.random() - 0.5) * 40}%`;
            coin.style.animationDelay = `${i * 0.05}s`;

            container.appendChild(coin);

            setTimeout(() => coin.remove(), 1000);
        }
    }

    /**
     * 載入獎勵統計數據
     */
    loadRewardStats() {
        if (!window.loginRewardSystem) return;

        const stats = window.loginRewardSystem.getStats();
        const history = window.loginRewardSystem.loginHistory;

        // 更新統計顯示
        const lastLoginElement = document.getElementById('last-login-time');
        const streakElement = document.getElementById('login-streak');
        const totalRewardsElement = document.getElementById('total-rewards');

        if (lastLoginElement) {
            if (history.lastVisit > 0) {
                const lastLogin = new Date(history.lastVisit);
                const now = new Date();
                const diff = now - lastLogin;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                
                if (hours < 1) {
                    lastLoginElement.textContent = '剛才';
                } else if (hours < 24) {
                    lastLoginElement.textContent = `${hours} 小時前`;
                } else {
                    const days = Math.floor(hours / 24);
                    lastLoginElement.textContent = `${days} 天前`;
                }
            } else {
                lastLoginElement.textContent = '首次登入';
            }
        }

        if (streakElement) {
            streakElement.textContent = `${stats.currentStreak} 天`;
        }

        if (totalRewardsElement) {
            totalRewardsElement.textContent = `${stats.totalRewards.toLocaleString()} XYC`;
        }
    }

    /**
     * 更新可領取獎勵數量
     */
    updateAvailableRewards() {
        if (!window.loginRewardSystem) return;

        const history = window.loginRewardSystem.loginHistory;
        const now = Date.now();
        const timeSinceLastVisit = now - history.lastVisit;

        this.availableRewards = [];

        // ✅ 檢查冷卻時間（防止重複領取）
        const lastClaimTime = localStorage.getItem('lastEggClaimTime');
        if (lastClaimTime) {
            const timeSinceClaim = now - parseInt(lastClaimTime);
            const cooldownMs = 60 * 60 * 1000; // 1 小時冷卻
            if (timeSinceClaim < cooldownMs) {
                // 還在冷卻期間，不顯示任何獎勵
                this.updateBadge(0);
                return;
            }
        }

        // 檢查每小時獎勵
        const hoursSince = timeSinceLastVisit / (1000 * 60 * 60);
        if (hoursSince >= 1 || history.lastVisit === 0) {
            this.availableRewards.push({
                type: 'hourly',
                icon: '⏰',
                title: '每小時訪問獎勵',
                description: '距離上次登入已超過 1 小時',
                amount: 10,
                claimed: false
            });
        }

        // 檢查每日獎勵
        const daysSince = timeSinceLastVisit / (1000 * 60 * 60 * 24);
        if (daysSince >= 1 || history.lastVisit === 0) {
            this.availableRewards.push({
                type: 'daily',
                icon: '🌅',
                title: '每日登入獎勵',
                description: '今日首次登入',
                amount: 1000,
                claimed: false
            });

            // 檢查連續登入獎勵
            const currentStreak = history.currentStreak + 1;
            
            if (currentStreak === 3) {
                this.availableRewards.push({
                    type: 'streak_3',
                    icon: '🎉',
                    title: '連續 3 天登入彩蛋',
                    description: '恭喜達成 3 天連續登入',
                    amount: 500,
                    claimed: false
                });
            }
            
            if (currentStreak === 7) {
                this.availableRewards.push({
                    type: 'streak_7',
                    icon: '🌟',
                    title: '連續 7 天登入週度彩蛋',
                    description: '恭喜達成 7 天連續登入',
                    amount: 2000,
                    claimed: false
                });
            }
            
            if (currentStreak === 30) {
                this.availableRewards.push({
                    type: 'streak_30',
                    icon: '🏆',
                    title: '連續 30 天登入月度大獎',
                    description: '恭喜達成 30 天連續登入',
                    amount: 10000,
                    claimed: false
                });
            }
        }

        // 更新徽章數量
        this.updateBadge(this.availableRewards.length);

        // 如果模態框打開，更新列表
        if (this.isModalOpen) {
            this.renderRewardsList();
        }
    }

    /**
     * 更新彩蛋按鈕徽章
     */
    updateBadge(count) {
        if (!this.eggBadge) return;

        if (count > 0) {
            this.eggBadge.textContent = count;
            this.eggBadge.style.display = 'flex';
        } else {
            this.eggBadge.style.display = 'none';
        }
    }

    /**
     * 渲染獎勵列表
     */
    renderRewardsList() {
        if (!this.rewardsList) return;

        if (this.availableRewards.length === 0) {
            this.rewardsList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-clock" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <p>目前沒有可領取的獎勵</p>
                    <p style="font-size: 0.875rem;">每小時訪問或每天登入即可獲得獎勵</p>
                </div>
            `;
            
            if (this.claimButton) {
                this.claimButton.disabled = true;
                this.claimButton.querySelector('.reward-amount').textContent = '+0 XYC';
            }
            return;
        }

        // 渲染獎勵項目
        this.rewardsList.innerHTML = this.availableRewards.map((reward, index) => `
            <div class="reward-item" data-index="${index}">
                <div class="reward-info">
                    <div class="reward-icon">${reward.icon}</div>
                    <div class="reward-text">
                        <h5>${reward.title}</h5>
                        <p>${reward.description}</p>
                    </div>
                </div>
                <div class="reward-amount-badge">+${reward.amount.toLocaleString()} XYC</div>
            </div>
        `).join('');

        // 更新領取按鈕
        const totalAmount = this.availableRewards.reduce((sum, r) => sum + r.amount, 0);
        if (this.claimButton) {
            this.claimButton.disabled = false;
            this.claimButton.querySelector('.reward-amount').textContent = `+${totalAmount.toLocaleString()} XYC`;
        }
    }

    /**
     * 領取所有獎勵
     */
    async claimAllRewards() {
        if (this.availableRewards.length === 0) {
            alert('目前沒有可領取的獎勵！');
            return;
        }

        // 🔐 安全檢查
        if (window.eggSecurityChecker) {
            const userId = this.getUserId();
            const securityCheck = window.eggSecurityChecker.checkClaimEligibility(
                userId,
                'batch_claim'
            );

            if (!securityCheck.allowed) {
                this.showSecurityError(securityCheck);
                return;
            }

            // 如果需要額外驗證
            if (securityCheck.requiresVerification) {
                const confirmed = await this.requestVerification(securityCheck);
                if (!confirmed) {
                    return;
                }
            }
        }

        // ✅ 檢查是否已經領過（防重複領取）
        const lastClaimTime = localStorage.getItem('lastEggClaimTime');
        const now = Date.now();
        if (lastClaimTime) {
            const timeSinceClaim = now - parseInt(lastClaimTime);
            const cooldownMs = 60 * 60 * 1000; // 1 小時冷卻
            if (timeSinceClaim < cooldownMs) {
                const remainingMinutes = Math.ceil((cooldownMs - timeSinceClaim) / 60000);
                alert(`請稍後再試！還需等待 ${remainingMinutes} 分鐘才能再次領取。`);
                return;
            }
        }

        // 禁用按鈕
        if (this.claimButton) {
            this.claimButton.disabled = true;
        }

        // 逐個領取獎勵
        for (let i = 0; i < this.availableRewards.length; i++) {
            await this.claimReward(i);
            await this.delay(300);
        }

        // 播放完成音效
        this.playSound('claim-success');

        // ✅ 記錄領取時間（防重複領取）
        localStorage.setItem('lastEggClaimTime', now.toString());
        localStorage.setItem('totalEggClaims', (parseInt(localStorage.getItem('totalEggClaims') || '0') + 1).toString());

        // 更新系統
        if (window.loginRewardSystem) {
            if (window.CrawlerDetector && window.CrawlerDetector.isAICrawler) {
                window.loginRewardSystem.handleAICrawler();
            } else {
                window.loginRewardSystem.handleRegularUser();
            }
        }

        // 重新載入
        setTimeout(() => {
            this.availableRewards = []; // 清空可領取列表
            this.updateAvailableRewards();
            this.loadRewardStats();
            
            // 顯示成功訊息
            this.showSuccessMessage();
            
            // 關閉模態框
            if (this.modal) {
                this.modal.classList.remove('show');
            }
        }, 500);
    }

    /**
     * 領取單個獎勵
     */
    async claimReward(index) {
        const rewardItem = this.rewardsList.querySelector(`[data-index="${index}"]`);
        if (!rewardItem) return;

        // 添加領取動畫
        rewardItem.classList.add('claiming');

        // 創建飛行金幣
        const rect = rewardItem.getBoundingClientRect();
        this.createFlyingCoin(rect.left + rect.width / 2, rect.top + rect.height / 2);

        await this.delay(600);
    }

    /**
     * 創建飛行金幣動畫
     */
    createFlyingCoin(startX, startY) {
        const coin = document.createElement('div');
        coin.className = 'coin-animation';
        coin.textContent = '🪙';
        coin.style.left = `${startX}px`;
        coin.style.top = `${startY}px`;
        coin.style.position = 'fixed';

        document.body.appendChild(coin);

        setTimeout(() => coin.remove(), 1000);
    }

    /**
     * 顯示成功訊息
     */
    showSuccessMessage() {
        // 可以使用已有的 reward-notification 系統
        const totalAmount = this.availableRewards.reduce((sum, r) => sum + r.amount, 0);
        
        const notification = document.createElement('div');
        notification.className = 'reward-notification show';
        notification.innerHTML = `
            <div class="reward-icon">🎉</div>
            <div class="reward-content">
                <div class="reward-title">領取成功！</div>
                <div class="reward-amount">+${totalAmount.toLocaleString()} XYC</div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * 播放音效（可選）
     */
    playSound(soundType) {
        // 可以在這裡添加音效播放邏輯
        // 例如：new Audio(`/sounds/${soundType}.mp3`).play();
    }

    /**
     * 延遲輔助函數
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 獲取用戶 ID
     */
    getUserId() {
        // 嘗試從不同來源獲取用戶 ID
        if (window.AppState && window.AppState.currentUser) {
            return window.AppState.currentUser.id || 'anonymous';
        }
        
        // 使用瀏覽器指紋作為備用
        return this.getBrowserFingerprint();
    }

    /**
     * 獲取瀏覽器指紋
     */
    getBrowserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser Fingerprint', 2, 2);
        
        const dataURL = canvas.toDataURL();
        let hash = 0;
        
        for (let i = 0; i < dataURL.length; i++) {
            const char = dataURL.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return `fp_${Math.abs(hash)}`;
    }

    /**
     * 顯示安全錯誤
     */
    showSecurityError(securityCheck) {
        const notification = document.createElement('div');
        notification.className = 'reward-notification show security-error';
        notification.innerHTML = `
            <div class="reward-icon">🔒</div>
            <div class="reward-content">
                <div class="reward-title">安全檢查失敗</div>
                <div class="reward-amount">${securityCheck.reason}</div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        console.warn('🔒 Security check failed:', securityCheck);
    }

    /**
     * 請求額外驗證
     */
    async requestVerification(securityCheck) {
        // 顯示驗證提示
        const confirmed = confirm(
            `檢測到異常行為，需要額外驗證。\n\n原因：${securityCheck.reason}\n\n是否繼續？`
        );

        if (confirmed && window.eggSecurityChecker) {
            const userId = this.getUserId();
            window.eggSecurityChecker.logAttempt(userId, 'verification_passed', {
                success: true
            });
        }

        return confirmed;
    }
}

// 全局函數（供 HTML onclick 使用）
function closeEggModal() {
    if (window.eggRewardUI) {
        window.eggRewardUI.closeModal();
    }
}

function claimAllRewards() {
    // ⚠️ 此功能已停用 - 已改為登入自動發放獎勵
    console.warn('❌ claimAllRewards() 已停用 - 獎勵已改為登入時自動發放');
    if (typeof showNotification === 'function') {
        showNotification('⚠️ 獎勵已自動發放至您的帳戶，無需手動領取', 'info');
    }
}

// 初始化
if (typeof window !== 'undefined') {
    window.EggRewardUIController = EggRewardUIController;
    window.eggRewardUI = new EggRewardUIController();
}

// Node.js 支持
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EggRewardUIController;
}
