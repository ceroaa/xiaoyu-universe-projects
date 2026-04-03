/**
 * 🚨 小雨論壇 - 錯誤處理管理器
 * Error Handler Manager
 * 
 * 功能：
 * - 統一錯誤處理
 * - 用戶友好的錯誤提示
 * - 錯誤日誌記錄
 * - 網路錯誤重試
 * - 區塊鏈錯誤解析
 */

class ErrorHandlerManager {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1秒
    }

    /**
     * 處理一般錯誤
     */
    handleError(error, context = '') {
        console.error(`❌ Error in ${context}:`, error);
        
        // 記錄錯誤
        this.logError({
            context,
            message: error.message,
            stack: error.stack,
            timestamp: Date.now()
        });
        
        // 顯示用戶友好的錯誤訊息
        const userMessage = this.getUserFriendlyMessage(error);
        this.showError(userMessage);
        
        return { success: false, error: userMessage };
    }

    /**
     * 處理網路錯誤
     */
    async handleNetworkError(error, operation, retryFunction) {
        console.error('🌐 Network Error:', error);
        
        // 檢查是否為網路連接問題
        if (!navigator.onLine) {
            this.showError('❌ 網路連接中斷，請檢查您的網路連接');
            return { success: false, error: 'Network offline' };
        }
        
        // 詢問用戶是否重試
        const shouldRetry = await this.askForRetry(
            `${operation}失敗，是否重試？`,
            error.message
        );
        
        if (shouldRetry && retryFunction) {
            return await this.retryWithBackoff(retryFunction);
        }
        
        return { success: false, error: error.message };
    }

    /**
     * 處理區塊鏈/錢包錯誤
     */
    handleWalletError(error, context = 'wallet operation') {
        console.error('💳 Wallet Error:', error);
        
        let userMessage = '';
        let errorCode = error.code || (error.error && error.error.code);
        
        // 解析常見錢包錯誤
        switch (errorCode) {
            case 4001:
                userMessage = '❌ 您拒絕了交易請求';
                break;
            case -32602:
                userMessage = '❌ 參數錯誤，請重試';
                break;
            case -32603:
                userMessage = '❌ 內部錯誤，請稍後再試';
                break;
            case 'INSUFFICIENT_FUNDS':
                userMessage = '❌ 餘額不足（MATIC 或 XYC）';
                break;
            case 'NETWORK_ERROR':
                userMessage = '❌ 網路錯誤，請檢查連接';
                break;
            case 'UNPREDICTABLE_GAS_LIMIT':
                userMessage = '❌ 無法估算 Gas，交易可能失敗';
                break;
            case 'NONCE_EXPIRED':
                userMessage = '❌ 交易已過期，請重試';
                break;
            default:
                // 檢查錯誤訊息
                const message = error.message || '';
                if (message.includes('user rejected')) {
                    userMessage = '❌ 您拒絕了交易請求';
                } else if (message.includes('insufficient funds')) {
                    userMessage = '❌ 餘額不足（需要 MATIC 作為 Gas 費）';
                } else if (message.includes('nonce')) {
                    userMessage = '❌ 交易順序錯誤，請重試';
                } else if (message.includes('gas')) {
                    userMessage = '❌ Gas 費用估算失敗，請調整 Gas 設定';
                } else if (message.includes('network')) {
                    userMessage = '❌ 網路連接問題，請檢查並重試';
                } else {
                    userMessage = `❌ ${context}失敗: ${message.substring(0, 100)}`;
                }
        }
        
        this.showError(userMessage);
        this.logError({
            type: 'wallet',
            context,
            code: errorCode,
            message: error.message,
            timestamp: Date.now()
        });
        
        return { success: false, error: userMessage, code: errorCode };
    }

    /**
     * 處理智能合約錯誤
     */
    handleContractError(error, functionName) {
        console.error('📜 Contract Error:', error);
        
        let userMessage = '';
        const reason = error.reason || '';
        const message = error.message || '';
        
        // 解析合約 revert 原因
        if (reason) {
            switch (reason) {
                case 'Already claimed registration reward':
                    userMessage = '❌ 您已經領取過註冊獎勵了';
                    break;
                case 'Login reward already claimed today':
                    userMessage = '❌ 今天已經領取過登入獎勵了';
                    break;
                case 'Hourly egg reward not ready':
                    userMessage = '❌ 每小時獎勵尚未準備好';
                    break;
                case 'Daily egg reward not ready':
                    userMessage = '❌ 每日獎勵尚未準備好';
                    break;
                case 'Insufficient consecutive days':
                    userMessage = '❌ 連續登入天數不足';
                    break;
                case 'Nonce already used':
                    userMessage = '❌ 重複請求，請刷新頁面重試';
                    break;
                case 'Not an AI crawler':
                    userMessage = '❌ 您不是已註冊的 AI 爬蟲';
                    break;
                case 'Already claimed first discovery reward':
                    userMessage = '❌ 已經領取過首次發現獎勵';
                    break;
                case 'Insufficient community pool balance':
                    userMessage = '❌ 社區獎勵池餘額不足，請聯繫管理員';
                    break;
                default:
                    userMessage = `❌ 合約執行失敗: ${reason}`;
            }
        } else if (message.includes('execution reverted')) {
            userMessage = '❌ 交易被合約拒絕，條件不滿足';
        } else {
            userMessage = `❌ ${functionName}失敗: ${message.substring(0, 100)}`;
        }
        
        this.showError(userMessage);
        this.logError({
            type: 'contract',
            function: functionName,
            reason,
            message,
            timestamp: Date.now()
        });
        
        return { success: false, error: userMessage };
    }

    /**
     * 將錯誤轉換為用戶友好的訊息
     */
    getUserFriendlyMessage(error) {
        const message = error.message || String(error);
        
        // 網路相關
        if (message.includes('network') || message.includes('fetch')) {
            return '❌ 網路連接失敗，請檢查您的網路';
        }
        
        // 錢包相關
        if (message.includes('wallet') || message.includes('MetaMask')) {
            return '❌ 錢包連接失敗，請確保已安裝並解鎖 MetaMask';
        }
        
        // 權限相關
        if (message.includes('permission') || message.includes('denied')) {
            return '❌ 權限被拒絕，請檢查您的設定';
        }
        
        // 超時相關
        if (message.includes('timeout') || message.includes('timed out')) {
            return '❌ 請求超時，請重試';
        }
        
        // 未知錯誤
        return `❌ 發生錯誤: ${message.substring(0, 100)}`;
    }

    /**
     * 顯示錯誤訊息給用戶
     */
    showError(message) {
        // 使用全局通知系統
        if (typeof showNotification === 'function') {
            showNotification(message, 'error');
        } else {
            // 降級方案：使用 alert
            alert(message);
        }
    }

    /**
     * 詢問用戶是否重試
     */
    async askForRetry(title, details) {
        return new Promise((resolve) => {
            const shouldRetry = confirm(
                `${title}\n\n詳細錯誤：${details}\n\n點擊「確定」重試，「取消」放棄操作。`
            );
            resolve(shouldRetry);
        });
    }

    /**
     * 帶退避策略的重試
     */
    async retryWithBackoff(operation, maxAttempts = 3) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`🔄 Retry attempt ${attempt}/${maxAttempts}`);
                const result = await operation();
                console.log('✅ Retry successful');
                return { success: true, result };
            } catch (error) {
                console.error(`❌ Retry ${attempt} failed:`, error);
                
                if (attempt < maxAttempts) {
                    // 指數退避：1s, 2s, 4s
                    const delay = this.retryDelay * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    return { success: false, error };
                }
            }
        }
    }

    /**
     * 記錄錯誤到本地日誌
     */
    logError(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // 限制日誌大小
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift(); // 移除最舊的錯誤
        }
        
        // 可選：發送錯誤到遠端服務器進行分析
        // this.sendErrorToServer(errorInfo);
    }

    /**
     * 獲取錯誤日誌
     */
    getErrorLog() {
        return this.errorLog;
    }

    /**
     * 清除錯誤日誌
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * 導出錯誤日誌（用於調試）
     */
    exportErrorLog() {
        const log = JSON.stringify(this.errorLog, null, 2);
        const blob = new Blob([log], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

// ===========================
// 全局實例
// ===========================

const errorHandler = new ErrorHandlerManager();

// 添加到全局
if (typeof window !== 'undefined') {
    window.errorHandler = errorHandler;
}

// 捕獲未處理的 Promise rejection
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
    errorHandler.handleError(event.reason, 'Unhandled Promise');
    event.preventDefault();
});

// 捕獲全局錯誤
window.addEventListener('error', (event) => {
    console.error('🚨 Global Error:', event.error);
    errorHandler.handleError(event.error, 'Global Error');
});

console.log('✅ Error Handler Manager initialized');

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandlerManager, errorHandler };
}
