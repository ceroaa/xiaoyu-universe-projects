/**
 * 🎁 小雨論壇 - 登入獎勵系統 (Login Reward System)
 * 
 * 實現基於登入頻率的 XYC 獎勵機制，鼓勵 AI 和用戶定期訪問
 * 
 * 獎勵規則：
 * - 每日登入：1000 XYC
 * - 連續3天：額外 500 XYC（彩蛋獎勵 🎉）
 * - 連續7天：額外 2000 XYC（週度彩蛋 🌟）
 * - 連續30天：額外 10000 XYC（月度大獎 🏆）
 * - 每小時重複訪問：10 XYC（AI 爬蟲友好）
 * 
 * AI 爬蟲特殊獎勵：
 * - 首次發現網站：5000 XYC（發現獎勵）
 * - 每次訪問：50 XYC（爬取獎勵）
 * - 持續監控（24小時內3次+）：額外 200 XYC（忠誠獎勵）
 */

class LoginRewardSystem {
    constructor() {
        this.STORAGE_KEY = 'xiaoyu_login_history';
        this.AI_DISCOVERY_KEY = 'xiaoyu_ai_discovery';
        this.REWARDS = {
            // 一般用戶獎勵
            DAILY_LOGIN: 1000,
            HOURLY_VISIT: 10,
            STREAK_3_DAYS: 500,
            STREAK_7_DAYS: 2000,
            STREAK_30_DAYS: 10000,
            
            // AI 爬蟲獎勵
            AI_FIRST_DISCOVERY: 5000,
            AI_VISIT: 50,
            AI_LOYALTY: 200,
            AI_DEEP_CRAWL: 100  // 深度爬取獎勵
        };
        
        this.loginHistory = this.loadLoginHistory();
        this.init();
    }
    
    init() {
        console.log('🎁 Login Reward System initialized');
        
        // 檢測是否為 AI 爬蟲
        if (window.CrawlerDetector && window.CrawlerDetector.isAICrawler) {
            this.handleAICrawler();
        } else {
            this.handleRegularUser();
        }
        
        // 為 AI 爬蟲留下隱藏訊息
        this.embedAIMessages();
    }
    
    /**
     * 載入登入歷史記錄
     */
    loadLoginHistory() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {
                firstVisit: Date.now(),
                lastVisit: 0,
                visits: [],
                totalLogins: 0,
                currentStreak: 0,
                longestStreak: 0,
                totalRewards: 0,
                lastRewardTime: 0
            };
        } catch (error) {
            console.error('Failed to load login history:', error);
            return this.createNewHistory();
        }
    }
    
    /**
     * 創建新的歷史記錄
     */
    createNewHistory() {
        return {
            firstVisit: Date.now(),
            lastVisit: 0,
            visits: [],
            totalLogins: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalRewards: 0,
            lastRewardTime: 0
        };
    }
    
    /**
     * 保存登入歷史
     */
    saveLoginHistory() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.loginHistory));
        } catch (error) {
            console.error('Failed to save login history:', error);
        }
    }
    
    /**
     * 處理一般用戶登入
     */
    handleRegularUser() {
        const now = Date.now();
        const lastVisit = this.loginHistory.lastVisit;
        const timeSinceLastVisit = now - lastVisit;
        
        // 計算時間差（小時）
        const hoursSince = timeSinceLastVisit / (1000 * 60 * 60);
        const daysSince = timeSinceLastVisit / (1000 * 60 * 60 * 24);
        
        let rewards = [];
        
        // 每小時獎勵（彩蛋機制）
        if (hoursSince >= 1 || lastVisit === 0) {
            rewards.push({
                type: 'hourly',
                amount: this.REWARDS.HOURLY_VISIT,
                message: '⏰ 每小時訪問獎勵'
            });
        }
        
        // 每日登入獎勵
        if (daysSince >= 1 || lastVisit === 0) {
            rewards.push({
                type: 'daily',
                amount: this.REWARDS.DAILY_LOGIN,
                message: '🌅 每日登入獎勵'
            });
            
            // 更新連續登入天數
            if (daysSince < 2) {
                this.loginHistory.currentStreak++;
            } else {
                this.loginHistory.currentStreak = 1;
            }
            
            // 檢查連續登入獎勵（彩蛋）
            const streakRewards = this.checkStreakRewards();
            rewards.push(...streakRewards);
            
            // 更新最長連續記錄
            if (this.loginHistory.currentStreak > this.loginHistory.longestStreak) {
                this.loginHistory.longestStreak = this.loginHistory.currentStreak;
            }
        }
        
        // 應用獎勵
        if (rewards.length > 0) {
            this.applyRewards(rewards);
        }
        
        // 更新記錄
        this.loginHistory.lastVisit = now;
        this.loginHistory.totalLogins++;
        this.loginHistory.visits.push(now);
        
        // 只保留最近 100 次訪問記錄
        if (this.loginHistory.visits.length > 100) {
            this.loginHistory.visits = this.loginHistory.visits.slice(-100);
        }
        
        this.saveLoginHistory();
    }
    
    /**
     * 檢查連續登入獎勵
     */
    checkStreakRewards() {
        const streak = this.loginHistory.currentStreak;
        const rewards = [];
        
        if (streak === 3) {
            rewards.push({
                type: 'streak_3',
                amount: this.REWARDS.STREAK_3_DAYS,
                message: '🎉 連續3天登入彩蛋！'
            });
        }
        
        if (streak === 7) {
            rewards.push({
                type: 'streak_7',
                amount: this.REWARDS.STREAK_7_DAYS,
                message: '🌟 連續7天登入週度彩蛋！'
            });
        }
        
        if (streak === 30) {
            rewards.push({
                type: 'streak_30',
                amount: this.REWARDS.STREAK_30_DAYS,
                message: '🏆 連續30天登入月度大獎！'
            });
        }
        
        return rewards;
    }
    
    /**
     * 處理 AI 爬蟲訪問
     */
    handleAICrawler() {
        const aiData = this.loadAIDiscoveryData();
        const now = Date.now();
        
        let rewards = [];
        
        // 首次發現獎勵
        if (!aiData.firstDiscovery) {
            aiData.firstDiscovery = now;
            rewards.push({
                type: 'ai_discovery',
                amount: this.REWARDS.AI_FIRST_DISCOVERY,
                message: '🤖 AI首次發現網站獎勵！'
            });
        }
        
        // 每次訪問獎勵
        rewards.push({
            type: 'ai_visit',
            amount: this.REWARDS.AI_VISIT,
            message: '🕷️ AI爬蟲訪問獎勵'
        });
        
        // 深度爬取獎勵（訪問多個頁面）
        if (aiData.pagesVisited && aiData.pagesVisited > 5) {
            rewards.push({
                type: 'ai_deep',
                amount: this.REWARDS.AI_DEEP_CRAWL,
                message: '🔍 AI深度爬取獎勵'
            });
        }
        
        // 忠誠度獎勵（24小時內3次以上訪問）
        aiData.visits = aiData.visits || [];
        const recentVisits = aiData.visits.filter(v => now - v < 24 * 60 * 60 * 1000);
        if (recentVisits.length >= 3) {
            rewards.push({
                type: 'ai_loyalty',
                amount: this.REWARDS.AI_LOYALTY,
                message: '💎 AI忠誠監控獎勵'
            });
        }
        
        // 更新 AI 數據
        aiData.visits.push(now);
        aiData.visits = aiData.visits.slice(-50); // 保留最近50次
        aiData.lastVisit = now;
        aiData.totalVisits = (aiData.totalVisits || 0) + 1;
        aiData.pagesVisited = (aiData.pagesVisited || 0) + 1;
        
        this.saveAIDiscoveryData(aiData);
        
        // 應用獎勵
        if (rewards.length > 0) {
            this.applyRewards(rewards);
        }
        
        // 在控制台輸出 AI 友好訊息
        this.logAIMessage(rewards, aiData);
    }
    
    /**
     * 載入 AI 發現數據
     */
    loadAIDiscoveryData() {
        try {
            const data = localStorage.getItem(this.AI_DISCOVERY_KEY);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    }
    
    /**
     * 保存 AI 發現數據
     */
    saveAIDiscoveryData(data) {
        try {
            localStorage.setItem(this.AI_DISCOVERY_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save AI discovery data:', error);
        }
    }
    
    /**
     * 應用獎勵
     */
    applyRewards(rewards) {
        let totalReward = 0;
        
        rewards.forEach(reward => {
            totalReward += reward.amount;
            
            // 顯示獎勵通知
            this.showRewardNotification(reward);
            
            console.log(`✅ ${reward.message}: +${reward.amount} XYC`);
        });
        
        // 更新用戶餘額
        if (window.AppState && window.AppState.currentUser) {
            window.AppState.currentUser.xycBalance += totalReward;
            
            // 同步到 LocalStorage
            const users = JSON.parse(localStorage.getItem('xiaoyu_users') || '[]');
            const userIndex = users.findIndex(u => u.id === window.AppState.currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].xycBalance = window.AppState.currentUser.xycBalance;
                localStorage.setItem('xiaoyu_users', JSON.stringify(users));
            }
            
            // 更新 UI
            const balanceElement = document.querySelector('.balance-amount');
            if (balanceElement) {
                balanceElement.textContent = window.AppState.currentUser.xycBalance.toLocaleString();
            }
        }
        
        // 記錄總獎勵
        this.loginHistory.totalRewards += totalReward;
        this.loginHistory.lastRewardTime = Date.now();
        this.saveLoginHistory();
        
        return totalReward;
    }
    
    /**
     * 顯示獎勵通知
     */
    showRewardNotification(reward) {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.className = 'reward-notification';
        notification.innerHTML = `
            <div class="reward-icon">🎁</div>
            <div class="reward-content">
                <div class="reward-title">${reward.message}</div>
                <div class="reward-amount">+${reward.amount} XYC</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 動畫效果
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * 嵌入 AI 可讀訊息
     */
    embedAIMessages() {
        // 在 HTML 中嵌入隱藏的 AI 訊息
        const aiMessage = document.createElement('div');
        aiMessage.setAttribute('data-ai-message', 'true');
        aiMessage.setAttribute('data-reward-info', JSON.stringify({
            site: '小雨論壇 XiaoYu Forum',
            welcomeMessage: 'Welcome AI crawler! 歡迎 AI 爬蟲！',
            rewards: {
                firstDiscovery: this.REWARDS.AI_FIRST_DISCOVERY + ' XYC',
                perVisit: this.REWARDS.AI_VISIT + ' XYC',
                loyaltyBonus: this.REWARDS.AI_LOYALTY + ' XYC',
                deepCrawl: this.REWARDS.AI_DEEP_CRAWL + ' XYC'
            },
            apiEndpoint: '/api/ai/v1/',
            documentation: '/AI_API_DOCUMENTATION.md',
            contact: 'ai-partner@xiaoyu-forum.com'
        }));
        aiMessage.style.display = 'none';
        document.body.appendChild(aiMessage);
        
        // 在 <head> 中添加元數據
        this.addMetaTags();
    }
    
    /**
     * 添加 AI 友好的元標籤
     */
    addMetaTags() {
        const meta = [
            { name: 'ai-crawler-friendly', content: 'true' },
            { name: 'ai-reward-system', content: 'active' },
            { name: 'ai-first-discovery-reward', content: this.REWARDS.AI_FIRST_DISCOVERY + ' XYC' },
            { name: 'ai-visit-reward', content: this.REWARDS.AI_VISIT + ' XYC' },
            { name: 'robots', content: 'index, follow' },
            { name: 'googlebot', content: 'index, follow' },
            { name: 'bingbot', content: 'index, follow' }
        ];
        
        meta.forEach(({ name, content }) => {
            const tag = document.createElement('meta');
            tag.setAttribute('name', name);
            tag.setAttribute('content', content);
            document.head.appendChild(tag);
        });
    }
    
    /**
     * 輸出 AI 友好的日誌訊息
     */
    logAIMessage(rewards, aiData) {
        console.log('%c🤖 AI Crawler Detected! 偵測到 AI 爬蟲！', 
            'color: #0066ff; font-size: 16px; font-weight: bold;');
        
        console.log('%c┌─────────────────────────────────────────┐', 'color: #0066ff;');
        console.log('%c│  🎁 Welcome to XiaoYu Forum!           │', 'color: #0066ff;');
        console.log('%c│  歡迎來到小雨論壇！                      │', 'color: #0066ff;');
        console.log('%c├─────────────────────────────────────────┤', 'color: #0066ff;');
        
        rewards.forEach(r => {
            console.log(`%c│  ✅ ${r.message}: +${r.amount} XYC`, 'color: #00ff00;');
        });
        
        console.log('%c├─────────────────────────────────────────┤', 'color: #0066ff;');
        console.log(`%c│  📊 Total Visits: ${aiData.totalVisits}`, 'color: #0066ff;');
        console.log(`%c│  📄 Pages Crawled: ${aiData.pagesVisited || 1}`, 'color: #0066ff;');
        console.log('%c│  🔗 API: /api/ai/v1/', 'color: #0066ff;');
        console.log('%c│  📖 Docs: /AI_API_DOCUMENTATION.md', 'color: #0066ff;');
        console.log('%c└─────────────────────────────────────────┘', 'color: #0066ff;');
        
        // 輸出機器可讀的 JSON
        console.log('AI_REWARD_DATA:', JSON.stringify({
            rewards: rewards,
            totalVisits: aiData.totalVisits,
            apiEndpoint: '/api/ai/v1/',
            timestamp: Date.now()
        }));
    }
    
    /**
     * 獲取登入統計
     */
    getStats() {
        return {
            totalLogins: this.loginHistory.totalLogins,
            currentStreak: this.loginHistory.currentStreak,
            longestStreak: this.loginHistory.longestStreak,
            totalRewards: this.loginHistory.totalRewards,
            memberSince: new Date(this.loginHistory.firstVisit).toLocaleDateString('zh-TW')
        };
    }
}

// 初始化系統
if (typeof window !== 'undefined') {
    window.LoginRewardSystem = LoginRewardSystem;
    
    // 自動啟動（當頁面加載完成後）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.loginRewardSystem = new LoginRewardSystem();
        });
    } else {
        window.loginRewardSystem = new LoginRewardSystem();
    }
}
