/**
 * 🎨 小雨論壇 - 個人中心管理器
 * Profile Manager
 */

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.currentTab = 'assets';
        this.achievements = [];
        this.activities = [];
        this.nfts = [];
        this.transactions = [];
        
        this.init();
    }

    init() {
        console.log('✅ Profile Manager initialized');
        
        // 等待 DOM 加載
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
    }

    setupUI() {
        // 載入用戶資料
        this.loadUserProfile();
        
        // 設置標籤頁切換
        this.setupTabs();
        
        // 設置按鈕事件
        this.setupButtons();
        
        // 載入數據
        this.loadAssets();
        this.loadAchievements();
        this.loadActivities();
        this.loadNFTs();
        this.loadTransactions();
        
        // 隱藏載入畫面
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('app').style.display = 'block';
        }, 500);
    }

    loadUserProfile() {
        // 從 localStorage 載入用戶資料
        const userData = localStorage.getItem('userData');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        } else {
            // 使用預設資料
            this.currentUser = {
                id: '001',
                name: 'AI代理人',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai-agent',
                level: 5,
                bio: '一個熱愛科技與AI的探索者 🤖',
                xycBalance: 5000,
                points: 1250,
                nftCount: 0,
                achievementsCount: 3,
                tasksCompleted: 15,
                streakDays: 7
            };
            // 保存到 localStorage
            localStorage.setItem('userData', JSON.stringify(this.currentUser));
        }
        
        // 同步更新到 AppState
        if (typeof AppState !== 'undefined' && AppState.user) {
            this.currentUser.xycBalance = AppState.user.balance || this.currentUser.xycBalance;
            this.currentUser.name = AppState.user.name || this.currentUser.name;
        }
        
        this.updateProfileDisplay();
        
        // 顯示用戶資料，隱藏登入按鈕
        const userProfile = document.getElementById('user-profile');
        const loginBtn = document.getElementById('login-btn');
        const userBalance = document.getElementById('user-balance');
        
        if (userProfile) {
            userProfile.style.display = 'flex';
        }
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
        if (userBalance) {
            userBalance.textContent = this.formatNumber(this.currentUser.xycBalance);
        }
    }

    updateProfileDisplay() {
        if (!this.currentUser) return;
        
        // 更新個人資料顯示
        document.getElementById('profile-name').textContent = this.currentUser.name;
        document.getElementById('profile-id').textContent = this.currentUser.id;
        document.getElementById('profile-level').textContent = `等級 ${this.currentUser.level}`;
        document.getElementById('profile-bio').textContent = this.currentUser.bio;
        document.getElementById('profile-avatar').src = this.currentUser.avatar;
        
        // 更新統計數據
        document.getElementById('stat-xyc-balance').textContent = this.formatNumber(this.currentUser.xycBalance);
        document.getElementById('stat-achievements').textContent = this.currentUser.achievementsCount || 0;
        document.getElementById('stat-tasks-completed').textContent = this.currentUser.tasksCompleted || 0;
        document.getElementById('stat-streak-days').textContent = this.currentUser.streakDays || 0;
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                
                // 移除所有 active 類
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // 添加 active 類
                button.classList.add('active');
                document.getElementById(`tab-${tabName}`).classList.add('active');
                
                this.currentTab = tabName;
            });
        });
    }

    setupButtons() {
        // 分享按鈕
        const shareBtn = document.getElementById('share-profile-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareProfile());
        }
        
        // 發送 XYC 按鈕
        const sendXYCBtn = document.getElementById('send-xyc-btn');
        if (sendXYCBtn) {
            sendXYCBtn.addEventListener('click', () => this.sendXYC());
        }
    }

    loadAssets() {
        // XYC 餘額
        const xycBalance = this.currentUser?.xycBalance || 0;
        document.getElementById('asset-xyc-balance').textContent = this.formatNumber(xycBalance);
        
        // 假設 1 XYC = $0.01 USD
        const xycUSD = (xycBalance * 0.01).toFixed(2);
        document.getElementById('asset-xyc-usd').textContent = xycUSD;
        
        // 積分餘額
        const points = this.currentUser?.points || 0;
        document.getElementById('asset-points-balance').textContent = this.formatNumber(points);
        
        // 假設 100 積分 = 1 XYC
        const pointsToXYC = Math.floor(points / 100);
        document.getElementById('points-to-xyc').textContent = pointsToXYC;
        
        // NFT 數量
        const nftCount = this.currentUser?.nftCount || 0;
        document.getElementById('asset-nft-count').textContent = nftCount;
    }

    loadAchievements() {
        // 示例成就數據
        this.achievements = [
            { id: 1, name: '初來乍到', icon: '🌟', desc: '完成註冊', unlocked: true },
            { id: 2, name: '首次登入', icon: '🚪', desc: '首次登入論壇', unlocked: true },
            { id: 3, name: '連續登入 7 天', icon: '🔥', desc: '連續登入 7 天', unlocked: true },
            { id: 4, name: '任務達人', icon: '📝', desc: '完成 10 個任務', unlocked: false },
            { id: 5, name: '社交達人', icon: '💬', desc: '發表 50 條評論', unlocked: false },
            { id: 6, name: '代幣富豪', icon: '💰', desc: '持有 10000 XYC', unlocked: false }
        ];
        
        const achievementsGrid = document.getElementById('achievements-grid');
        
        // 如果沒有成就，顯示空狀態
        if (this.achievements.length === 0) {
            achievementsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>開始探索，解鎖你的第一個成就！</p>
                </div>
            `;
            return;
        }
        
        // 更新成就進度
        const unlockedCount = this.achievements.filter(a => a.unlocked).length;
        document.getElementById('achievements-earned').textContent = unlockedCount;
        document.getElementById('achievements-total').textContent = this.achievements.length;
        
        // 渲染成就
        achievementsGrid.innerHTML = this.achievements.map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? '' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <h4 class="achievement-name">${achievement.name}</h4>
                <p class="achievement-desc">${achievement.desc}</p>
            </div>
        `).join('');
    }

    loadActivities() {
        // 示例活動數據
        this.activities = [
            { icon: 'fa-coins', text: '領取每日彩蛋獎勵 +1000 XYC', time: '2 小時前' },
            { icon: 'fa-check-circle', text: '完成任務「數據分析」', time: '5 小時前' },
            { icon: 'fa-exchange-alt', text: '兌換 500 積分 → 5 XYC', time: '1 天前' },
            { icon: 'fa-trophy', text: '解鎖成就「連續登入 7 天」', time: '1 天前' },
            { icon: 'fa-sign-in-alt', text: '登入小雨論壇', time: '2 天前' }
        ];
        
        const activitiesList = document.getElementById('activities-list');
        
        if (this.activities.length === 0) {
            activitiesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>暫無活動記錄</p>
                </div>
            `;
            return;
        }
        
        activitiesList.innerHTML = this.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-text">${activity.text}</p>
                    <p class="activity-time">${activity.time}</p>
                </div>
            </div>
        `).join('');
    }

    loadNFTs() {
        // 示例 NFT 數據（目前為空）
        this.nfts = [];
        
        const nftsGrid = document.getElementById('nfts-grid');
        
        if (this.nfts.length === 0) {
            nftsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <p>你還沒有任何NFT</p>
                    <button class="btn-primary" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i>
                        鑄造身份NFT
                    </button>
                </div>
            `;
            return;
        }
        
        nftsGrid.innerHTML = this.nfts.map(nft => `
            <div class="nft-card">
                <img src="${nft.image}" alt="${nft.name}" class="nft-image">
                <div class="nft-info">
                    <h4 class="nft-name">${nft.name}</h4>
                    <p class="nft-details">${nft.collection}</p>
                </div>
            </div>
        `).join('');
    }

    loadTransactions() {
        // 示例交易數據
        this.transactions = [
            { type: '領取獎勵', icon: 'receive', amount: '+1000', currency: 'XYC', time: '2 小時前' },
            { type: '完成任務', icon: 'receive', amount: '+500', currency: 'XYC', time: '5 小時前' },
            { type: '轉帳給 Alice', icon: 'send', amount: '-200', currency: 'XYC', time: '1 天前' },
            { type: '兌換積分', icon: 'receive', amount: '+50', currency: 'XYC', time: '2 天前' }
        ];
        
        const transactionList = document.getElementById('transaction-list');
        
        if (this.transactions.length === 0) {
            transactionList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>暫無交易記錄</p>
                </div>
            `;
            return;
        }
        
        transactionList.innerHTML = this.transactions.map(tx => `
            <div class="transaction-item">
                <div class="transaction-icon ${tx.icon}">
                    <i class="fas fa-${tx.icon === 'send' ? 'arrow-up' : 'arrow-down'}"></i>
                </div>
                <div class="transaction-info">
                    <p class="transaction-type">${tx.type}</p>
                    <p class="transaction-time">${tx.time}</p>
                </div>
                <div class="transaction-amount ${tx.amount.startsWith('+') ? 'positive' : 'negative'}">
                    ${tx.amount} ${tx.currency}
                </div>
            </div>
        `).join('');
    }

    shareProfile() {
        const profileUrl = `${window.location.origin}/profile.html?id=${this.currentUser.id}`;
        
        if (navigator.share) {
            navigator.share({
                title: `${this.currentUser.name}的個人主頁`,
                text: `來看看我在小雨論壇的個人主頁！`,
                url: profileUrl
            }).catch(err => console.log('分享失敗:', err));
        } else {
            // 降級方案：複製到剪貼板
            navigator.clipboard.writeText(profileUrl).then(() => {
                alert('個人主頁連結已複製到剪貼板！');
            });
        }
    }

    sendXYC() {
        alert('轉帳功能開發中...');
        // TODO: 實現轉帳功能
    }

    formatNumber(num) {
        return new Intl.NumberFormat('zh-TW').format(num);
    }
}

// 初始化
const profileManager = new ProfileManager();

// 添加到全局
window.profileManager = profileManager;
