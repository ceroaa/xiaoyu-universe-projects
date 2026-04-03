/**
 * 🌟 小雨統一賬號系統 - 前端整合模組
 * 
 * 目標：統一論壇門面與小雨世界的賬號系統
 * 
 * 流程：
 * 1. 用戶在論壇註冊/登入
 * 2. 登入成功後可進入小雨世界
 * 3. 首次進入自動創建玩家角色
 * 4. 之後直接載入角色進入世界
 */

class XiaoyuAuthSystem {
    constructor() {
        // API 基礎路徑（需配置為實際後端地址）
        this.apiBase = '/api'; // TODO: 配置為實際地址
        
        // 當前用戶
        this.currentUser = null;
        
        // 當前角色
        this.currentActor = null;
        
        // 登入狀態
        this.isLoggedIn = false;
    }

    /**
     * 初始化 - 檢查登入狀態
     */
    async initialize() {
        try {
            const user = await this.getCurrentUser();
            if (user) {
                this.currentUser = user;
                this.isLoggedIn = true;
                console.log('✅ 用戶已登入:', user.display_name);
                
                // 檢查是否有角色
                const actor = await this.getUserActor();
                if (actor) {
                    this.currentActor = actor;
                    console.log('✅ 已有世界角色:', actor.name);
                }
                
                return { user, actor };
            } else {
                console.log('⚠️ 用戶未登入');
                return null;
            }
        } catch (error) {
            console.error('❌ 初始化失敗:', error);
            return null;
        }
    }

    /**
     * 註冊新用戶
     */
    async register(email, password, displayName) {
        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // 重要：包含 cookie
                body: JSON.stringify({
                    email: email,
                    password: password,
                    display_name: displayName
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '註冊失敗');
            }

            const result = await response.json();
            
            // 註冊成功，更新狀態
            this.currentUser = result.user;
            this.isLoggedIn = true;
            
            console.log('✅ 註冊成功:', result.user.display_name);
            
            return result;

        } catch (error) {
            console.error('❌ 註冊失敗:', error);
            throw error;
        }
    }

    /**
     * 登入
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '登入失敗');
            }

            const result = await response.json();
            
            // 登入成功，更新狀態
            this.currentUser = result.user;
            this.isLoggedIn = true;
            
            // 檢查是否有角色
            const actor = await this.getUserActor();
            if (actor) {
                this.currentActor = actor;
            }
            
            console.log('✅ 登入成功:', result.user.display_name);
            
            return result;

        } catch (error) {
            console.error('❌ 登入失敗:', error);
            throw error;
        }
    }

    /**
     * 登出
     */
    async logout() {
        try {
            const response = await fetch(`${this.apiBase}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            // 清除本地狀態
            this.currentUser = null;
            this.currentActor = null;
            this.isLoggedIn = false;
            
            console.log('✅ 登出成功');
            
            return true;

        } catch (error) {
            console.error('❌ 登出失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取當前用戶
     */
    async getCurrentUser() {
        try {
            const response = await fetch(`${this.apiBase}/auth/me`, {
                credentials: 'include'
            });

            if (!response.ok) {
                return null;
            }

            const result = await response.json();
            return result.user;

        } catch (error) {
            console.error('❌ 獲取用戶失敗:', error);
            return null;
        }
    }

    /**
     * 獲取用戶的世界角色
     */
    async getUserActor() {
        try {
            const response = await fetch(`${this.apiBase}/world/my-actor`, {
                credentials: 'include'
            });

            if (!response.ok) {
                return null;
            }

            const result = await response.json();
            return result.actor;

        } catch (error) {
            console.error('❌ 獲取角色失敗:', error);
            return null;
        }
    }

    /**
     * 進入世界（首次自動創建角色）
     */
    async enterWorld() {
        try {
            if (!this.isLoggedIn) {
                throw new Error('請先登入');
            }

            const response = await fetch(`${this.apiBase}/world/enter`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // 可選：角色初始設定
                    actor_name: this.currentUser.display_name
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '進入世界失敗');
            }

            const result = await response.json();
            
            // 更新角色狀態
            this.currentActor = result.actor;
            
            if (result.is_new) {
                console.log('✅ 創建新角色:', result.actor.name);
            } else {
                console.log('✅ 載入角色:', result.actor.name);
            }
            
            return result;

        } catch (error) {
            console.error('❌ 進入世界失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取用戶狀態（用於UI更新）
     */
    getStatus() {
        return {
            isLoggedIn: this.isLoggedIn,
            user: this.currentUser,
            actor: this.currentActor,
            hasActor: !!this.currentActor
        };
    }
}

// 全域單例
window.xiaoyuAuth = new XiaoyuAuthSystem();

// UI 更新輔助函數
class AuthUIManager {
    constructor(authSystem) {
        this.auth = authSystem;
    }

    /**
     * 更新論壇門面的登入狀態 UI
     */
    updateUI() {
        const status = this.auth.getStatus();
        
        // 更新導航欄
        const userInfo = document.getElementById('user-info');
        const authButtons = document.getElementById('auth-buttons');
        
        if (status.isLoggedIn) {
            // 已登入
            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="user-profile">
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${status.user.email}" 
                             alt="${status.user.display_name}" 
                             style="width: 32px; height: 32px; border-radius: 50%;">
                        <span>${status.user.display_name}</span>
                        <button onclick="xiaoyuAuthUI.logout()" class="btn-logout">登出</button>
                    </div>
                `;
            }
            
            // 更新主按鈕
            this.updateMainButton(status.hasActor);
            
        } else {
            // 未登入
            if (userInfo) {
                userInfo.innerHTML = '';
            }
            
            if (authButtons) {
                authButtons.innerHTML = `
                    <button onclick="xiaoyuAuthUI.showLoginModal()" class="btn-primary">登入</button>
                    <button onclick="xiaoyuAuthUI.showRegisterModal()" class="btn-secondary">註冊</button>
                `;
            }
        }
    }

    /**
     * 更新主要進入按鈕
     */
    updateMainButton(hasActor) {
        const enterBtn = document.getElementById('enter-world-btn');
        const finalEnterBtn = document.getElementById('final-enter-btn');
        
        const buttonText = hasActor ? '繼續進入小雨世界' : '創建角色並進入世界';
        const buttonIcon = hasActor ? '🚀' : '✨';
        
        [enterBtn, finalEnterBtn].forEach(btn => {
            if (btn) {
                btn.innerHTML = `${buttonIcon} ${buttonText}`;
                btn.onclick = () => this.handleEnterWorld();
            }
        });
    }

    /**
     * 處理進入世界
     */
    async handleEnterWorld() {
        try {
            // 檢查登入狀態
            if (!this.auth.isLoggedIn) {
                this.showLoginModal();
                return;
            }

            // 顯示載入中
            this.showLoading('正在進入小雨世界...');

            // 進入世界（自動創建角色或載入現有角色）
            const result = await this.auth.enterWorld();

            // 跳轉到世界頁面
            const worldUrl = '/world'; // TODO: 配置實際世界頁面地址
            window.location.href = worldUrl;

        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    /**
     * 顯示登入彈窗
     */
    showLoginModal() {
        const modal = document.getElementById('auth-modal');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (modal) {
            modal.style.display = 'flex';
            if (loginForm) loginForm.style.display = 'block';
            if (registerForm) registerForm.style.display = 'none';
        }
    }

    /**
     * 顯示註冊彈窗
     */
    showRegisterModal() {
        const modal = document.getElementById('auth-modal');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (modal) {
            modal.style.display = 'flex';
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
        }
    }

    /**
     * 處理登入表單提交
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            this.showLoading('登入中...');
            
            await this.auth.login(email, password);
            
            this.hideLoading();
            this.closeModal();
            this.updateUI();
            
            this.showSuccess('登入成功！');

        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    /**
     * 處理註冊表單提交
     */
    async handleRegister(event) {
        event.preventDefault();
        
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const displayName = document.getElementById('register-name').value;
        
        try {
            this.showLoading('註冊中...');
            
            await this.auth.register(email, password, displayName);
            
            this.hideLoading();
            this.closeModal();
            this.updateUI();
            
            this.showSuccess('註冊成功！歡迎來到小雨世界！');

        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    /**
     * 登出
     */
    async logout() {
        if (confirm('確定要登出嗎？')) {
            try {
                await this.auth.logout();
                this.updateUI();
                this.showSuccess('已登出');
                
                // 重新載入頁面
                window.location.reload();
                
            } catch (error) {
                this.showError(error.message);
            }
        }
    }

    /**
     * 關閉彈窗
     */
    closeModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 顯示載入中
     */
    showLoading(message) {
        // TODO: 實現載入提示
        console.log('Loading:', message);
    }

    /**
     * 隱藏載入中
     */
    hideLoading() {
        // TODO: 隱藏載入提示
    }

    /**
     * 顯示成功訊息
     */
    showSuccess(message) {
        alert(message); // TODO: 改用更好的提示方式
    }

    /**
     * 顯示錯誤訊息
     */
    showError(message) {
        alert('錯誤: ' + message); // TODO: 改用更好的提示方式
    }
}

// 全域 UI 管理器
window.xiaoyuAuthUI = new AuthUIManager(window.xiaoyuAuth);

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌟 小雨統一賬號系統初始化中...');
    
    // 初始化認證系統
    await window.xiaoyuAuth.initialize();
    
    // 更新 UI
    window.xiaoyuAuthUI.updateUI();
    
    console.log('✅ 小雨統一賬號系統已就緒');
});

// 匯出（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { XiaoyuAuthSystem, AuthUIManager };
}
