/**
 * 小雨論壇統一帳號系統管理器
 * 版本：v4.0.0
 * 作者：Claude AI
 * 功能：統一論壇與小雨世界的帳號系統
 * 
 * 核心功能：
 * 1. 註冊 API
 * 2. 登入 API
 * 3. 當前用戶 API
 * 4. 進入世界 API（自動創建角色）
 * 5. Session 管理
 */

class UnifiedAuthManager {
    constructor() {
        // API 端點配置
        this.config = {
            // 統一用戶表
            usersTable: 'unified_users',
            // 世界角色表
            actorsTable: 'world_actors',
            // 控制者綁定表
            controllersTable: 'user_controllers',
            // Session 存儲 key
            sessionKey: 'xiaoyu_unified_session',
            // 小雨世界入口
            worldEntryUrl: 'https://world.xiaoyu.network'
        };

        // 當前用戶狀態
        this.currentUser = null;
        this.currentActor = null;
        
        console.log('✅ 統一帳號系統已初始化');
    }

    /**
     * 生成簡單的密碼哈希（前端模擬，實際應該用後端）
     */
    async hashPassword(password) {
        // 簡單的哈希模擬（實際應該用 bcrypt 在後端）
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'xiaoyu_salt_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * 生成 UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 1. 註冊 API
     * @param {string} email - 用戶郵箱
     * @param {string} password - 用戶密碼
     * @param {string} displayName - 顯示名稱
     * @param {boolean} autoCreateActor - 是否自動創建世界角色
     * @returns {Promise<{user, actor?}>}
     */
    async register(email, password, displayName, autoCreateActor = false) {
        try {
            console.log('🔐 開始註冊流程:', { email, displayName, autoCreateActor });

            // 1. 檢查郵箱是否已存在
            const existingUsers = await fetch(`tables/${this.config.usersTable}?search=${encodeURIComponent(email)}`);
            const existingData = await existingUsers.json();
            
            if (existingData.data && existingData.data.some(u => u.email === email)) {
                throw new Error('此郵箱已被註冊');
            }

            // 2. 創建用戶記錄
            const passwordHash = await this.hashPassword(password);
            const userId = this.generateUUID();
            
            const userData = {
                id: userId,
                email: email,
                password_hash: passwordHash,
                display_name: displayName,
                avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
                status: 'active',
                last_login: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const createUserResponse = await fetch(`tables/${this.config.usersTable}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!createUserResponse.ok) {
                throw new Error('創建用戶失敗');
            }

            const user = await createUserResponse.json();
            console.log('✅ 用戶創建成功:', user);

            // 3. 如果需要，自動創建世界角色
            let actor = null;
            if (autoCreateActor) {
                actor = await this.createWorldActor(userId, displayName);
                console.log('✅ 世界角色創建成功:', actor);
            }

            // 4. 保存 Session
            this.saveSession(user);
            this.currentUser = user;
            this.currentActor = actor;

            return { user, actor };
        } catch (error) {
            console.error('❌ 註冊失敗:', error);
            throw error;
        }
    }

    /**
     * 2. 登入 API
     * @param {string} email - 用戶郵箱
     * @param {string} password - 用戶密碼
     * @returns {Promise<{user, actor?}>}
     */
    async login(email, password) {
        try {
            console.log('🔐 開始登入流程:', { email });

            // 1. 查找用戶
            const response = await fetch(`tables/${this.config.usersTable}?search=${encodeURIComponent(email)}`);
            const data = await response.json();
            
            const user = data.data?.find(u => u.email === email);
            if (!user) {
                throw new Error('用戶不存在');
            }

            // 2. 驗證密碼
            const passwordHash = await this.hashPassword(password);
            if (user.password_hash !== passwordHash) {
                throw new Error('密碼錯誤');
            }

            // 3. 檢查帳號狀態
            if (user.status !== 'active') {
                throw new Error('帳號已被暫停或刪除');
            }

            // 4. 更新最後登入時間
            await fetch(`tables/${this.config.usersTable}/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    last_login: new Date().toISOString()
                })
            });

            // 5. 查找是否已綁定世界角色
            const actor = await this.getActorByUserId(user.id);

            // 6. 保存 Session
            this.saveSession(user);
            this.currentUser = user;
            this.currentActor = actor;

            console.log('✅ 登入成功:', { user, actor });
            return { user, actor };
        } catch (error) {
            console.error('❌ 登入失敗:', error);
            throw error;
        }
    }

    /**
     * 3. 當前用戶 API
     * @returns {Promise<{user, actor?, isLoggedIn}>}
     */
    async getCurrentUser() {
        try {
            // 1. 從 Session 讀取
            const session = this.loadSession();
            if (!session || !session.user) {
                return { isLoggedIn: false };
            }

            // 2. 驗證用戶是否仍然有效
            const response = await fetch(`tables/${this.config.usersTable}/${session.user.id}`);
            if (!response.ok) {
                this.clearSession();
                return { isLoggedIn: false };
            }

            const user = await response.json();
            if (user.status !== 'active') {
                this.clearSession();
                return { isLoggedIn: false };
            }

            // 3. 查找綁定的世界角色
            const actor = await this.getActorByUserId(user.id);

            this.currentUser = user;
            this.currentActor = actor;

            return {
                isLoggedIn: true,
                user,
                actor,
                hasActor: !!actor
            };
        } catch (error) {
            console.error('❌ 獲取當前用戶失敗:', error);
            return { isLoggedIn: false };
        }
    }

    /**
     * 4. 進入世界 API
     * 如果用戶沒有角色，自動創建一個
     * @returns {Promise<{actor, worldUrl}>}
     */
    async enterWorld() {
        try {
            // 1. 確保用戶已登入
            const currentStatus = await this.getCurrentUser();
            if (!currentStatus.isLoggedIn) {
                throw new Error('請先登入');
            }

            const user = currentStatus.user;
            let actor = currentStatus.actor;

            // 2. 如果沒有角色，自動創建
            if (!actor) {
                console.log('🎮 用戶沒有世界角色，開始自動創建...');
                actor = await this.createWorldActor(user.id, user.display_name);
                this.currentActor = actor;
            }

            // 3. 生成世界入口 URL（帶 token）
            const worldUrl = `${this.config.worldEntryUrl}?actor_id=${actor.id}&user_id=${user.id}`;

            console.log('✅ 準備進入小雨世界:', { actor, worldUrl });
            return { actor, worldUrl };
        } catch (error) {
            console.error('❌ 進入世界失敗:', error);
            throw error;
        }
    }

    /**
     * 創建世界角色（輔助函數）
     */
    async createWorldActor(userId, displayName) {
        const actorId = this.generateUUID();
        
        // 1. 創建角色
        const actorData = {
            id: actorId,
            actor_name: displayName,
            actor_type: 'human',
            level: 1,
            experience: 0,
            attributes: JSON.stringify({
                strength: 10,
                intelligence: 10,
                charisma: 10,
                agility: 10
            }),
            inventory: JSON.stringify([]),
            location: 'town_square', // 預設出生點
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const actorResponse = await fetch(`tables/${this.config.actorsTable}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(actorData)
        });

        if (!actorResponse.ok) {
            throw new Error('創建角色失敗');
        }

        const actor = await actorResponse.json();

        // 2. 創建綁定記錄
        const controllerId = this.generateUUID();
        const controllerData = {
            id: controllerId,
            user_id: userId,
            actor_id: actorId,
            controller_type: 'human',
            is_primary: true,
            permissions: JSON.stringify(['move', 'interact', 'chat', 'trade']),
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await fetch(`tables/${this.config.controllersTable}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(controllerData)
        });

        return actor;
    }

    /**
     * 通過用戶 ID 查找角色
     */
    async getActorByUserId(userId) {
        try {
            // 1. 查找綁定記錄
            const response = await fetch(`tables/${this.config.controllersTable}?search=${userId}`);
            const data = await response.json();
            
            const controller = data.data?.find(c => c.user_id === userId && c.is_primary);
            if (!controller) {
                return null;
            }

            // 2. 獲取角色信息
            const actorResponse = await fetch(`tables/${this.config.actorsTable}/${controller.actor_id}`);
            if (!actorResponse.ok) {
                return null;
            }

            return await actorResponse.json();
        } catch (error) {
            console.error('查找角色失敗:', error);
            return null;
        }
    }

    /**
     * Session 管理 - 保存
     */
    saveSession(user) {
        const session = {
            user: {
                id: user.id,
                email: user.email,
                display_name: user.display_name,
                avatar_url: user.avatar_url
            },
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(this.config.sessionKey, JSON.stringify(session));
    }

    /**
     * Session 管理 - 讀取
     */
    loadSession() {
        const sessionStr = localStorage.getItem(this.config.sessionKey);
        if (!sessionStr) return null;
        
        try {
            return JSON.parse(sessionStr);
        } catch {
            return null;
        }
    }

    /**
     * Session 管理 - 清除（登出）
     */
    clearSession() {
        localStorage.removeItem(this.config.sessionKey);
        this.currentUser = null;
        this.currentActor = null;
        console.log('✅ 已登出');
    }

    /**
     * 登出
     */
    async logout() {
        this.clearSession();
        // 刷新頁面
        window.location.reload();
    }
}

// 初始化全域統一帳號管理器
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.unifiedAuth = new UnifiedAuthManager();
        console.log('✅ 統一帳號系統已載入');
    });
}

// Node.js 支援
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedAuthManager;
}
