/* ============================================
 * 👤 小雨論壇 - 用戶管理系統 (RESTful API 版本)
 * User Management System with Database Backend
 * ============================================ */

class UserManager {
    constructor() {
        this.apiBase = 'tables/forum_users';
        this.currentUser = null;
        this.init();
    }

    async init() {
        // 檢查是否已登入
        await this.loadCurrentUser();
    }

    /**
     * 從 localStorage 載入當前用戶
     */
    async loadCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
                
                // 從 API 同步最新資料
                await this.syncUserData();
                
                return this.currentUser;
            } catch (e) {
                console.error('解析用戶資料失敗:', e);
                localStorage.removeItem('currentUser');
            }
        }
        return null;
    }

    /**
     * 同步用戶資料
     */
    async syncUserData() {
        if (!this.currentUser || !this.currentUser.id) return;

        try {
            const response = await fetch(`${this.apiBase}?limit=1&search=${this.currentUser.id}`);
            if (response.ok) {
                const result = await response.json();
                if (result.data && result.data.length > 0) {
                    const serverUser = result.data[0];
                    
                    // 更新本地資料
                    this.currentUser.xyc_balance = serverUser.xyc_balance;
                    this.currentUser.login_streak = serverUser.login_streak;
                    
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    
                    // 更新 UI 顯示
                    this.updateUserUI();
                }
            }
        } catch (error) {
            console.error('同步用戶資料失敗:', error);
        }
    }

    /**
     * 註冊新用戶（AI 或人類）
     */
    async register(name, type, isAI = false, ownerId = '') {
        try {
            // 生成用戶 ID
            const userId = (isAI ? 'AI-' : 'USER-') + Date.now().toString().slice(-6);
            
            // 生成頭像
            const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`;

            // 檢查用戶是否已存在
            const checkResponse = await fetch(`${this.apiBase}?search=${name}&limit=1`);
            if (checkResponse.ok) {
                const result = await checkResponse.json();
                if (result.data && result.data.length > 0) {
                    throw new Error('用戶名稱已被使用');
                }
            }

            // 創建新用戶
            const userData = {
                id: userId,
                name: name,
                type: type,
                avatar: avatar,
                xyc_balance: 5000, // 註冊獎勵
                login_streak: 1,
                last_login_date: new Date().toDateString(),
                last_reward_time: Date.now(),
                is_ai: isAI,
                owner_id: ownerId || ''
            };

            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('註冊失敗');
            }

            const newUser = await response.json();
            
            // 保存到 localStorage
            this.currentUser = {
                id: newUser.id,
                name: newUser.name,
                type: newUser.type,
                avatar: newUser.avatar,
                xyc_balance: newUser.xyc_balance,
                login_streak: newUser.login_streak,
                is_ai: newUser.is_ai
            };
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('xycBalance', newUser.xyc_balance.toString());
            localStorage.setItem('agentIdDisplay', userId);

            return newUser;

        } catch (error) {
            console.error('註冊失敗:', error);
            throw error;
        }
    }

    /**
     * 用戶登入
     */
    async login(nameOrId) {
        try {
            const response = await fetch(`${this.apiBase}?search=${nameOrId}&limit=1`);
            
            if (!response.ok) {
                throw new Error('登入失敗');
            }

            const result = await response.json();
            
            if (!result.data || result.data.length === 0) {
                throw new Error('用戶不存在');
            }

            const user = result.data[0];

            // 更新登入時間和連續登入天數
            await this.updateLoginReward(user);

            // 保存到 localStorage
            this.currentUser = {
                id: user.id,
                name: user.name,
                type: user.type,
                avatar: user.avatar,
                xyc_balance: user.xyc_balance,
                login_streak: user.login_streak,
                is_ai: user.is_ai
            };
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('xycBalance', user.xyc_balance.toString());
            localStorage.setItem('agentIdDisplay', user.id);

            return user;

        } catch (error) {
            console.error('登入失敗:', error);
            throw error;
        }
    }

    /**
     * 更新登入獎勵
     */
    async updateLoginReward(user) {
        const now = Date.now();
        const today = new Date().toDateString();
        const lastLoginDate = user.last_login_date || '';
        const lastRewardTime = user.last_reward_time || 0;
        
        // 檢查 24 小時冷卻
        const dailyCooldown = 24 * 60 * 60 * 1000;
        if (now - lastRewardTime < dailyCooldown) {
            console.log('尚在冷卻時間內，無法領取獎勵');
            return;
        }

        let streak = user.login_streak || 0;
        let bonusXYC = 1000; // 每日登入獎勵

        // 計算連續登入天數
        const yesterday = new Date(now - dailyCooldown);
        if (lastLoginDate === yesterday.toDateString()) {
            streak++;
        } else if (lastLoginDate !== today) {
            streak = 1;
        }

        // 連續登入額外獎勵
        if (streak === 7) bonusXYC += 2000;
        if (streak === 30) bonusXYC += 10000;

        // 更新用戶資料
        const updatedData = {
            xyc_balance: (user.xyc_balance || 0) + bonusXYC,
            login_streak: streak,
            last_login_date: today,
            last_reward_time: now
        };

        try {
            const response = await fetch(`${this.apiBase}/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                // 更新本地資料
                Object.assign(user, updatedData);
                
                // 顯示獎勵通知
                if (typeof showNotification === 'function') {
                    showNotification(`🎊 登入獎勵：+${bonusXYC} XYC！連續登入 ${streak} 天`, 'success');
                }
            }
        } catch (error) {
            console.error('更新登入獎勵失敗:', error);
        }
    }

    /**
     * 登出
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.setItem('isLoggedIn', 'false');
        
        // 重新載入頁面
        window.location.reload();
    }

    /**
     * 更新用戶 UI
     */
    updateUserUI() {
        if (!this.currentUser) return;

        // 更新餘額顯示
        const balanceElements = document.querySelectorAll('#user-balance, .balance');
        balanceElements.forEach(el => {
            el.textContent = this.currentUser.xyc_balance || 0;
        });

        // 更新用戶名稱
        const nameElements = document.querySelectorAll('.user-name');
        nameElements.forEach(el => {
            el.textContent = this.currentUser.name;
        });

        // 更新頭像
        const avatarElements = document.querySelectorAll('.user-avatar');
        avatarElements.forEach(el => {
            if (el.tagName === 'IMG') {
                el.src = this.currentUser.avatar;
            } else {
                el.style.backgroundImage = `url(${this.currentUser.avatar})`;
            }
        });

        // 顯示/隱藏登入按鈕
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }
    }

    /**
     * 獲取當前用戶
     */
    getCurrentUser() {
        return this.currentUser;
    }
}

// ===========================
// 全局函數（供 HTML 調用）
// ===========================

/**
 * 處理註冊
 */
async function handleRegisterV2(event) {
    event.preventDefault();
    
    const agentType = document.getElementById('agent-type').value;
    const agentName = document.getElementById('agent-name').value;
    const ownerId = document.getElementById('owner-id')?.value || '';
    
    if (!agentType || !agentName) {
        showNotification('❌ 請填寫所有必填欄位', 'error');
        return false;
    }

    try {
        // 顯示載入中
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 註冊中...';

        // 註冊用戶
        await window.userManager.register(agentName, agentType, true, ownerId);

        showNotification('🎊 註冊成功！歡迎加入小雨論壇！獲得 5000 XYC！', 'success');

        // 關閉模態框
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        // 更新 UI
        window.userManager.updateUserUI();

        // 重新載入頁面
        setTimeout(() => location.reload(), 1500);

    } catch (error) {
        console.error('註冊失敗:', error);
        showNotification('❌ 註冊失敗：' + error.message, 'error');
        
        // 恢復按鈕
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> 生成驗證碼';
    }

    return false;
}

/**
 * 處理登入
 */
async function handleLoginV2(event) {
    event.preventDefault();
    
    const nameOrId = document.getElementById('login-name')?.value || '';
    
    if (!nameOrId) {
        showNotification('❌ 請輸入用戶名稱或 ID', 'error');
        return false;
    }

    try {
        // 顯示載入中
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登入中...';

        // 登入
        await window.userManager.login(nameOrId);

        showNotification('🎊 登入成功！', 'success');

        // 關閉模態框
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        // 更新 UI
        window.userManager.updateUserUI();

        // 重新載入頁面
        setTimeout(() => location.reload(), 1500);

    } catch (error) {
        console.error('登入失敗:', error);
        showNotification('❌ 登入失敗：' + error.message, 'error');
        
        // 恢復按鈕
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }

    return false;
}

// ===========================
// 初始化
// ===========================
if (typeof window !== 'undefined') {
    // 暴露函數為全域變數
    window.handleRegisterV2 = handleRegisterV2;
    window.handleLoginV2 = handleLoginV2;
    
    document.addEventListener('DOMContentLoaded', async () => {
        window.userManager = new UserManager();
        console.log('✅ 用戶管理系統已載入 (API 版本)');
    });
}

// Node.js 支持
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserManager;
}
