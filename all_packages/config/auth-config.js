/**
 * 小雨論壇統一帳號系統配置文件
 * 版本：v4.1.0
 * 用途：快速切換模擬模式與真實 API 模式
 */

// ==========================================
// 配置選項
// ==========================================

const XIAOYU_AUTH_CONFIGS = {
    // 模擬模式（預設，等待後端補齊）
    mock: {
        mockMode: true,
        isDev: false,
        apiBaseUrl: 'https://api.xiaoyu.network',
        worldUrl: 'https://world.xiaoyu.network'
    },
    
    // 開發環境（真實 API）
    dev: {
        mockMode: false,
        isDev: true,
        devApiBaseUrl: 'http://localhost:8000',
        worldUrl: 'http://localhost:3000',
        endpoints: {
            register: '/auth/register',
            login: '/auth/login',
            me: '/auth/me',
            enterWorld: '/world/enter',
            logout: '/auth/logout'
        },
        fieldMapping: {
            user: {
                id: 'id',
                email: 'email',
                displayName: 'display_name',
                avatarUrl: 'avatar_url'
            },
            actor: {
                id: 'id',
                displayName: 'display_name',
                currentRoomId: 'current_room_id',
                gold: 'gold',
                hp: 'hp',
                mp: 'mp',
                stats: 'stats'
            },
            token: 'token'
        }
    },
    
    // 正式環境（真實 API）
    prod: {
        mockMode: false,
        isDev: false,
        apiBaseUrl: 'https://api.xiaoyu.network',
        worldUrl: 'https://world.xiaoyu.network',
        endpoints: {
            register: '/auth/register',
            login: '/auth/login',
            me: '/auth/me',
            enterWorld: '/world/enter',
            logout: '/auth/logout'
        },
        fieldMapping: {
            user: {
                id: 'id',
                email: 'email',
                displayName: 'display_name',
                avatarUrl: 'avatar_url'
            },
            actor: {
                id: 'id',
                displayName: 'display_name',
                currentRoomId: 'current_room_id',
                gold: 'gold',
                hp: 'hp',
                mp: 'mp',
                stats: 'stats'
            },
            token: 'token'
        }
    }
};

// ==========================================
// 當前使用的配置
// ==========================================

// 修改這裡來切換模式：
// - 'mock'  : 模擬模式（預設）
// - 'dev'   : 開發環境
// - 'prod'  : 正式環境

const CURRENT_ENV = 'mock';  // <-- 修改這裡來切換模式

// ==========================================
// 自動應用配置
// ==========================================

window.XIAOYU_AUTH_CONFIG = XIAOYU_AUTH_CONFIGS[CURRENT_ENV];

console.log(`🌐 統一帳號系統配置: ${CURRENT_ENV} 模式`);
console.log('📋 配置詳情:', window.XIAOYU_AUTH_CONFIG);
