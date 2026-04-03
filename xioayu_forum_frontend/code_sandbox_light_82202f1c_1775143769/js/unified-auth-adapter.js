/**
 * 小雨論壇統一帳號系統適配器
 * 版本：v4.1.0 - 可適配真實後端 API
 * 作者：Claude AI
 * 日期：2026-04-02
 * 
 * 設計原則：
 * 1. 不寫死 API 路徑與字段
 * 2. 透過配置適配真實後端
 * 3. 等待後端補齊 Phase 1 接口
 */

class UnifiedAuthAdapter {
    constructor(config = {}) {
        // 可配置的 API 端點
        this.config = {
            // API Base URL（可配置）
            apiBaseUrl: config.apiBaseUrl || 'https://api.xiaoyu.network',
            
            // 開發環境 URL（可配置）
            devApiBaseUrl: config.devApiBaseUrl || 'http://localhost:8000',
            
            // 是否使用開發環境
            isDev: config.isDev || false,
            
            // API 端點（可配置，等待後端補齊）
            endpoints: {
                register: config.endpoints?.register || '/auth/register',
                login: config.endpoints?.login || '/auth/login',
                me: config.endpoints?.me || '/auth/me',
                enterWorld: config.endpoints?.enterWorld || '/world/enter',
                logout: config.endpoints?.logout || '/auth/logout'
            },
            
            // 字段映射（適配真實後端字段）
            fieldMapping: {
                // 用戶字段
                user: {
                    id: config.fieldMapping?.user?.id || 'id',
                    email: config.fieldMapping?.user?.email || 'email',
                    displayName: config.fieldMapping?.user?.displayName || 'display_name',
                    avatarUrl: config.fieldMapping?.user?.avatarUrl || 'avatar_url'
                },
                // 角色字段（真實後端字段）
                actor: {
                    id: config.fieldMapping?.actor?.id || 'id',
                    displayName: config.fieldMapping?.actor?.displayName || 'display_name',
                    currentRoomId: config.fieldMapping?.actor?.currentRoomId || 'current_room_id',
                    gold: config.fieldMapping?.actor?.gold || 'gold',
                    hp: config.fieldMapping?.actor?.hp || 'hp',
                    mp: config.fieldMapping?.actor?.mp || 'mp',
                    stats: config.fieldMapping?.actor?.stats || 'stats'
                },
                // Token 字段
                token: config.fieldMapping?.token || 'token'
            },
            
            // Token 存儲 key
            tokenKey: config.tokenKey || 'xiaoyu_auth_token',
            sessionKey: config.sessionKey || 'xiaoyu_session',
            
            // 世界入口 URL
            worldUrl: config.worldUrl || 'https://world.xiaoyu.network',
            
            // 是否啟用模擬模式（後端未準備好時）
            mockMode: config.mockMode || false
        };
        
        // 當前狀態
        this.currentUser = null;
        this.currentActor = null;
        this.token = null;
        
        console.log('✅ 統一帳號系統適配器已初始化');
        console.log('📍 API Base URL:', this.getApiBaseUrl());
        console.log('🎭 模擬模式:', this.config.mockMode ? '啟用' : '停用');
    }
    
    /**
     * 獲取 API Base URL
     */
    getApiBaseUrl() {
        return this.config.isDev ? this.config.devApiBaseUrl : this.config.apiBaseUrl;
    }
    
    /**
     * 獲取完整 API URL
     */
    getApiUrl(endpoint) {
        return `${this.getApiBaseUrl()}${endpoint}`;
    }
    
    /**
     * 通用 API 請求方法
     */
    async apiRequest(endpoint, options = {}) {
        const url = this.getApiUrl(endpoint);
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // 如果有 Token，自動添加到 Header
        if (this.token && !options.skipAuth) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        try {
            console.log(`🌐 API 請求: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ API 回應:', data);
            return data;
        } catch (error) {
            console.error('❌ API 請求失敗:', error);
            throw error;
        }
    }
    
    /**
     * 1. 註冊 API（適配真實後端）
     */
    async register(email, password, displayName, autoCreateActor = false) {
        // 模擬模式
        if (this.config.mockMode) {
            return this._mockRegister(email, password, displayName, autoCreateActor);
        }
        
        try {
            console.log('🔐 開始註冊流程:', { email, displayName, autoCreateActor });
            
            // 調用真實後端 API（等待補齊）
            const data = await this.apiRequest(this.config.endpoints.register, {
                method: 'POST',
                skipAuth: true,
                body: JSON.stringify({
                    email,
                    password,
                    display_name: displayName,
                    auto_create_actor: autoCreateActor
                })
            });
            
            // 適配真實後端返回字段
            const user = this._adaptUserData(data.user || data);
            const actor = data.actor ? this._adaptActorData(data.actor) : null;
            const token = data[this.config.fieldMapping.token];
            
            // 保存 Token
            if (token) {
                this.saveToken(token);
            }
            
            this.currentUser = user;
            this.currentActor = actor;
            
            return { user, actor, token };
        } catch (error) {
            console.error('❌ 註冊失敗:', error);
            throw error;
        }
    }
    
    /**
     * 2. 登入 API（適配真實後端）
     */
    async login(email, password) {
        // 模擬模式
        if (this.config.mockMode) {
            return this._mockLogin(email, password);
        }
        
        try {
            console.log('🔐 開始登入流程:', { email });
            
            // 調用真實後端 API（等待補齊）
            const data = await this.apiRequest(this.config.endpoints.login, {
                method: 'POST',
                skipAuth: true,
                body: JSON.stringify({
                    email,
                    password
                })
            });
            
            // 適配真實後端返回字段
            const user = this._adaptUserData(data.user || data);
            const actor = data.actor ? this._adaptActorData(data.actor) : null;
            const token = data[this.config.fieldMapping.token];
            
            // 保存 Token
            if (token) {
                this.saveToken(token);
            }
            
            this.currentUser = user;
            this.currentActor = actor;
            
            return { user, actor, token };
        } catch (error) {
            console.error('❌ 登入失敗:', error);
            throw error;
        }
    }
    
    /**
     * 3. 當前用戶 API（適配真實後端）
     */
    async getCurrentUser() {
        // 模擬模式
        if (this.config.mockMode) {
            return this._mockGetCurrentUser();
        }
        
        try {
            const token = this.loadToken();
            if (!token) {
                return { isLoggedIn: false };
            }
            
            // 調用真實後端 API（等待補齊）
            const data = await this.apiRequest(this.config.endpoints.me, {
                method: 'GET'
            });
            
            // 適配真實後端返回字段
            const user = this._adaptUserData(data.user || data);
            const actor = data.actor ? this._adaptActorData(data.actor) : null;
            
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
            this.clearToken();
            return { isLoggedIn: false };
        }
    }
    
    /**
     * 4. 進入世界 API（適配真實後端）
     */
    async enterWorld() {
        // 模擬模式
        if (this.config.mockMode) {
            return this._mockEnterWorld();
        }
        
        try {
            const token = this.loadToken();
            if (!token) {
                throw new Error('請先登入');
            }
            
            console.log('🌍 準備進入小雨世界...');
            
            // 調用真實後端 API（等待補齊）
            const data = await this.apiRequest(this.config.endpoints.enterWorld, {
                method: 'POST',
                body: JSON.stringify({})
            });
            
            // 適配真實後端返回字段
            const actor = this._adaptActorData(data.actor);
            const worldUrl = data.world_entry_url || this.config.worldUrl;
            const isFirstTime = data.is_first_time || false;
            
            this.currentActor = actor;
            
            return {
                actor,
                worldUrl,
                isFirstTime
            };
        } catch (error) {
            console.error('❌ 進入世界失敗:', error);
            throw error;
        }
    }
    
    /**
     * 5. 登出
     */
    async logout() {
        // 模擬模式
        if (this.config.mockMode) {
            this._mockLogout();
            return;
        }
        
        try {
            const token = this.loadToken();
            if (token) {
                // 調用真實後端 API（等待補齊）
                await this.apiRequest(this.config.endpoints.logout, {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.error('❌ 登出請求失敗:', error);
        } finally {
            this.clearToken();
            this.currentUser = null;
            this.currentActor = null;
            window.location.reload();
        }
    }
    
    /**
     * 適配用戶資料（使用字段映射）
     */
    _adaptUserData(rawData) {
        if (!rawData) return null;
        
        const mapping = this.config.fieldMapping.user;
        return {
            id: rawData[mapping.id],
            email: rawData[mapping.email],
            displayName: rawData[mapping.displayName],
            avatarUrl: rawData[mapping.avatarUrl],
            // 保留原始資料
            _raw: rawData
        };
    }
    
    /**
     * 適配角色資料（使用真實後端字段）
     */
    _adaptActorData(rawData) {
        if (!rawData) return null;
        
        const mapping = this.config.fieldMapping.actor;
        return {
            id: rawData[mapping.id],
            displayName: rawData[mapping.displayName],
            currentRoomId: rawData[mapping.currentRoomId],
            gold: rawData[mapping.gold],
            hp: rawData[mapping.hp],
            mp: rawData[mapping.mp],
            stats: rawData[mapping.stats],
            // 保留原始資料
            _raw: rawData
        };
    }
    
    /**
     * Token 管理
     */
    saveToken(token) {
        localStorage.setItem(this.config.tokenKey, token);
        this.token = token;
    }
    
    loadToken() {
        if (!this.token) {
            this.token = localStorage.getItem(this.config.tokenKey);
        }
        return this.token;
    }
    
    clearToken() {
        localStorage.removeItem(this.config.tokenKey);
        localStorage.removeItem(this.config.sessionKey);
        this.token = null;
    }
    
    /**
     * ==========================================
     * 模擬模式（後端未準備好時使用）
     * ==========================================
     */
    
    _mockRegister(email, password, displayName, autoCreateActor) {
        console.log('🎭 模擬模式：註冊');
        
        const userId = `user-${Date.now()}`;
        const user = {
            id: userId,
            email: email,
            displayName: displayName,
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`
        };
        
        let actor = null;
        if (autoCreateActor) {
            const actorId = `actor-${Date.now()}`;
            actor = {
                id: actorId,
                displayName: displayName,
                currentRoomId: 'town_square',
                gold: 100,
                hp: 100,
                mp: 50,
                stats: { strength: 10, intelligence: 10, agility: 10 }
            };
        }
        
        const token = `mock-token-${Date.now()}`;
        this.saveToken(token);
        this.currentUser = user;
        this.currentActor = actor;
        
        return Promise.resolve({ user, actor, token });
    }
    
    _mockLogin(email, password) {
        console.log('🎭 模擬模式：登入');
        
        const userId = `user-${Date.now()}`;
        const user = {
            id: userId,
            email: email,
            displayName: '測試用戶',
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`
        };
        
        const actorId = `actor-${Date.now()}`;
        const actor = {
            id: actorId,
            displayName: '測試用戶',
            currentRoomId: 'forest_entrance',
            gold: 500,
            hp: 80,
            mp: 30,
            stats: { strength: 15, intelligence: 12, agility: 13 }
        };
        
        const token = `mock-token-${Date.now()}`;
        this.saveToken(token);
        this.currentUser = user;
        this.currentActor = actor;
        
        return Promise.resolve({ user, actor, token });
    }
    
    _mockGetCurrentUser() {
        console.log('🎭 模擬模式：獲取當前用戶');
        
        const token = this.loadToken();
        if (!token) {
            return Promise.resolve({ isLoggedIn: false });
        }
        
        return Promise.resolve({
            isLoggedIn: true,
            user: this.currentUser,
            actor: this.currentActor,
            hasActor: !!this.currentActor
        });
    }
    
    _mockEnterWorld() {
        console.log('🎭 模擬模式：進入世界');
        
        let actor = this.currentActor;
        let isFirstTime = false;
        
        if (!actor) {
            // 模擬自動創建角色
            const actorId = `actor-${Date.now()}`;
            actor = {
                id: actorId,
                displayName: this.currentUser?.displayName || '新角色',
                currentRoomId: 'town_square',
                gold: 100,
                hp: 100,
                mp: 50,
                stats: { strength: 10, intelligence: 10, agility: 10 }
            };
            this.currentActor = actor;
            isFirstTime = true;
        }
        
        const worldUrl = `${this.config.worldUrl}?token=${this.token}`;
        
        return Promise.resolve({
            actor,
            worldUrl,
            isFirstTime
        });
    }
    
    _mockLogout() {
        console.log('🎭 模擬模式：登出');
        this.clearToken();
        this.currentUser = null;
        this.currentActor = null;
    }
}

// 初始化全域適配器
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // 預設配置（可在頁面中覆蓋）
        const config = window.XIAOYU_AUTH_CONFIG || {
            // 預設使用模擬模式（等待後端補齊）
            mockMode: true,
            isDev: false,
            apiBaseUrl: 'https://api.xiaoyu.network',
            devApiBaseUrl: 'http://localhost:8000',
            worldUrl: 'https://world.xiaoyu.network'
        };
        
        window.unifiedAuth = new UnifiedAuthAdapter(config);
        console.log('✅ 統一帳號系統適配器已載入');
    });
}

// Node.js 支援
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedAuthAdapter;
}
