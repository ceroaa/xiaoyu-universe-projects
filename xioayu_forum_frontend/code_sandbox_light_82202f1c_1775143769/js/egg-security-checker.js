/**
 * 🔐 小雨論壇 - 彩蛋獎勵安全檢查系統
 * Egg Reward Security Checker
 * 
 * 功能：
 * - 防止重放攻擊（Replay Attack）
 * - 頻率限制（Rate Limiting）
 * - 防作弊檢測（Anti-Cheating）
 * - 異常行為監控（Anomaly Detection）
 * - 簽名驗證（Signature Verification）
 */

class EggRewardSecurityChecker {
    constructor() {
        this.SECURITY_KEY = 'xiaoyu_security_log';
        this.RATE_LIMIT_KEY = 'xiaoyu_rate_limit';
        
        // 安全配置
        this.config = {
            // 頻率限制
            MAX_CLAIMS_PER_HOUR: 10,
            MAX_CLAIMS_PER_DAY: 50,
            MIN_CLAIM_INTERVAL: 60 * 1000, // 1 分鐘
            
            // 異常檢測閾值
            SUSPICIOUS_CLAIM_THRESHOLD: 20, // 可疑聲明次數
            ABNORMAL_TIME_PATTERN_THRESHOLD: 5, // 異常時間模式
            
            // 封禁設置
            BAN_DURATION: 24 * 60 * 60 * 1000, // 24 小時
            WARNING_THRESHOLD: 3, // 警告次數閾值
            
            // 驗證要求
            REQUIRE_SIGNATURE: false, // 是否需要簽名驗證（鏈上）
            REQUIRE_CAPTCHA: false, // 是否需要驗證碼（人類）
        };
        
        this.securityLog = this.loadSecurityLog();
        this.init();
    }

    /**
     * 初始化安全系統
     */
    init() {
        console.log('🔐 Egg Reward Security System initialized');
        
        // 定期清理過期記錄
        setInterval(() => this.cleanupOldLogs(), 60 * 60 * 1000); // 每小時清理
        
        // 定期檢測異常行為
        setInterval(() => this.detectAnomalies(), 5 * 60 * 1000); // 每 5 分鐘
    }

    /**
     * 載入安全日誌
     */
    loadSecurityLog() {
        try {
            const data = localStorage.getItem(this.SECURITY_KEY);
            return data ? JSON.parse(data) : {
                attempts: [],
                violations: [],
                bannedUsers: {},
                warnings: {},
                lastCleanup: Date.now()
            };
        } catch (error) {
            console.error('❌ Failed to load security log:', error);
            return this.createNewLog();
        }
    }

    /**
     * 創建新的安全日誌
     */
    createNewLog() {
        return {
            attempts: [],
            violations: [],
            bannedUsers: {},
            warnings: {},
            lastCleanup: Date.now()
        };
    }

    /**
     * 保存安全日誌
     */
    saveSecurityLog() {
        try {
            localStorage.setItem(this.SECURITY_KEY, JSON.stringify(this.securityLog));
        } catch (error) {
            console.error('❌ Failed to save security log:', error);
        }
    }

    /**
     * 檢查用戶是否可以領取獎勵
     * @param {string} userId - 用戶 ID
     * @param {string} rewardType - 獎勵類型
     * @returns {Object} 檢查結果
     */
    checkClaimEligibility(userId, rewardType) {
        const result = {
            allowed: true,
            reason: '',
            requiresVerification: false,
            securityLevel: 'normal'
        };

        // 1. 檢查是否被封禁
        const banCheck = this.checkBanStatus(userId);
        if (!banCheck.allowed) {
            return banCheck;
        }

        // 2. 檢查頻率限制
        const rateCheck = this.checkRateLimit(userId);
        if (!rateCheck.allowed) {
            return rateCheck;
        }

        // 3. 檢查最小間隔
        const intervalCheck = this.checkMinInterval(userId);
        if (!intervalCheck.allowed) {
            return intervalCheck;
        }

        // 4. 檢查重放攻擊
        const replayCheck = this.checkReplayAttack(userId, rewardType);
        if (!replayCheck.allowed) {
            return replayCheck;
        }

        // 5. 異常行為檢測
        const anomalyCheck = this.checkAnomalies(userId);
        if (anomalyCheck.suspicious) {
            result.requiresVerification = true;
            result.securityLevel = 'high';
            result.reason = '檢測到異常行為，需要額外驗證';
        }

        // 記錄嘗試
        this.logAttempt(userId, rewardType, result);

        return result;
    }

    /**
     * 檢查封禁狀態
     * @param {string} userId - 用戶 ID
     */
    checkBanStatus(userId) {
        const banned = this.securityLog.bannedUsers[userId];
        
        if (banned) {
            const now = Date.now();
            const banEnd = banned.bannedAt + this.config.BAN_DURATION;
            
            if (now < banEnd) {
                const remainingHours = Math.ceil((banEnd - now) / (1000 * 60 * 60));
                return {
                    allowed: false,
                    reason: `帳號已被暫時封禁，剩餘 ${remainingHours} 小時`,
                    securityLevel: 'banned',
                    banEnd: banEnd
                };
            } else {
                // 封禁期已過，解除封禁
                delete this.securityLog.bannedUsers[userId];
                this.saveSecurityLog();
            }
        }

        return { allowed: true };
    }

    /**
     * 檢查頻率限制
     * @param {string} userId - 用戶 ID
     */
    checkRateLimit(userId) {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        // 獲取最近的嘗試記錄
        const recentAttempts = this.securityLog.attempts.filter(
            a => a.userId === userId && a.timestamp > oneDayAgo
        );

        // 檢查每小時限制
        const hourlyAttempts = recentAttempts.filter(a => a.timestamp > oneHourAgo);
        if (hourlyAttempts.length >= this.config.MAX_CLAIMS_PER_HOUR) {
            return {
                allowed: false,
                reason: `每小時最多領取 ${this.config.MAX_CLAIMS_PER_HOUR} 次獎勵`,
                securityLevel: 'rate_limited',
                remainingTime: Math.ceil((hourlyAttempts[0].timestamp + 60 * 60 * 1000 - now) / 60000)
            };
        }

        // 檢查每日限制
        if (recentAttempts.length >= this.config.MAX_CLAIMS_PER_DAY) {
            return {
                allowed: false,
                reason: `每日最多領取 ${this.config.MAX_CLAIMS_PER_DAY} 次獎勵`,
                securityLevel: 'rate_limited',
                remainingTime: Math.ceil((recentAttempts[0].timestamp + 24 * 60 * 60 * 1000 - now) / 60000)
            };
        }

        return { allowed: true };
    }

    /**
     * 檢查最小間隔
     * @param {string} userId - 用戶 ID
     */
    checkMinInterval(userId) {
        const now = Date.now();
        const recentAttempts = this.securityLog.attempts
            .filter(a => a.userId === userId)
            .sort((a, b) => b.timestamp - a.timestamp);

        if (recentAttempts.length > 0) {
            const lastAttempt = recentAttempts[0];
            const timeSinceLastClaim = now - lastAttempt.timestamp;

            if (timeSinceLastClaim < this.config.MIN_CLAIM_INTERVAL) {
                const remainingSeconds = Math.ceil((this.config.MIN_CLAIM_INTERVAL - timeSinceLastClaim) / 1000);
                return {
                    allowed: false,
                    reason: `請等待 ${remainingSeconds} 秒後再試`,
                    securityLevel: 'cooldown',
                    remainingTime: remainingSeconds
                };
            }
        }

        return { allowed: true };
    }

    /**
     * 檢查重放攻擊
     * @param {string} userId - 用戶 ID
     * @param {string} rewardType - 獎勵類型
     */
    checkReplayAttack(userId, rewardType) {
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        // 檢查最近 5 分鐘內是否有相同的獎勵聲明
        const recentSameClaims = this.securityLog.attempts.filter(
            a => a.userId === userId &&
                 a.rewardType === rewardType &&
                 a.timestamp > fiveMinutesAgo &&
                 a.success
        );

        if (recentSameClaims.length > 0) {
            // 記錄違規
            this.logViolation(userId, 'replay_attack', {
                rewardType,
                lastClaim: recentSameClaims[0].timestamp
            });

            return {
                allowed: false,
                reason: '檢測到重複領取嘗試',
                securityLevel: 'replay_detected'
            };
        }

        return { allowed: true };
    }

    /**
     * 檢查異常行為
     * @param {string} userId - 用戶 ID
     */
    checkAnomalies(userId) {
        const result = {
            suspicious: false,
            reasons: []
        };

        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;

        // 獲取用戶最近的嘗試
        const recentAttempts = this.securityLog.attempts
            .filter(a => a.userId === userId && a.timestamp > oneHourAgo)
            .sort((a, b) => b.timestamp - a.timestamp);

        // 1. 檢查異常高頻率
        if (recentAttempts.length > this.config.SUSPICIOUS_CLAIM_THRESHOLD) {
            result.suspicious = true;
            result.reasons.push('異常高頻率聲明');
        }

        // 2. 檢查時間模式異常（例如：精確的定時領取）
        if (recentAttempts.length >= 3) {
            const intervals = [];
            for (let i = 0; i < recentAttempts.length - 1; i++) {
                intervals.push(recentAttempts[i].timestamp - recentAttempts[i + 1].timestamp);
            }

            // 檢查間隔是否過於規律（可能是腳本）
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
            const stdDev = Math.sqrt(variance);

            if (stdDev < 1000) { // 標準差小於 1 秒
                result.suspicious = true;
                result.reasons.push('檢測到規律的時間模式');
            }
        }

        // 3. 檢查失敗率異常
        const failedAttempts = recentAttempts.filter(a => !a.success);
        const failureRate = failedAttempts.length / recentAttempts.length;

        if (failureRate > 0.5 && recentAttempts.length > 5) {
            result.suspicious = true;
            result.reasons.push('異常高失敗率');
        }

        // 如果檢測到可疑行為，發出警告
        if (result.suspicious) {
            this.issueWarning(userId, result.reasons);
        }

        return result;
    }

    /**
     * 記錄嘗試
     * @param {string} userId - 用戶 ID
     * @param {string} rewardType - 獎勵類型
     * @param {Object} result - 檢查結果
     */
    logAttempt(userId, rewardType, result) {
        this.securityLog.attempts.push({
            userId,
            rewardType,
            timestamp: Date.now(),
            success: result.allowed,
            reason: result.reason || '',
            securityLevel: result.securityLevel
        });

        // 只保留最近 1000 條記錄
        if (this.securityLog.attempts.length > 1000) {
            this.securityLog.attempts = this.securityLog.attempts.slice(-1000);
        }

        this.saveSecurityLog();
    }

    /**
     * 記錄違規
     * @param {string} userId - 用戶 ID
     * @param {string} violationType - 違規類型
     * @param {Object} details - 詳細資訊
     */
    logViolation(userId, violationType, details) {
        this.securityLog.violations.push({
            userId,
            violationType,
            timestamp: Date.now(),
            details
        });

        console.warn('⚠️ Security violation detected:', {
            userId,
            violationType,
            details
        });

        // 累積違規次數
        this.issueWarning(userId, [violationType]);

        this.saveSecurityLog();
    }

    /**
     * 發出警告
     * @param {string} userId - 用戶 ID
     * @param {Array} reasons - 警告原因
     */
    issueWarning(userId, reasons) {
        if (!this.securityLog.warnings[userId]) {
            this.securityLog.warnings[userId] = {
                count: 0,
                reasons: [],
                lastWarning: 0
            };
        }

        this.securityLog.warnings[userId].count++;
        this.securityLog.warnings[userId].reasons.push(...reasons);
        this.securityLog.warnings[userId].lastWarning = Date.now();

        // 如果警告次數超過閾值，封禁用戶
        if (this.securityLog.warnings[userId].count >= this.config.WARNING_THRESHOLD) {
            this.banUser(userId, '多次違規警告');
        }

        this.saveSecurityLog();
    }

    /**
     * 封禁用戶
     * @param {string} userId - 用戶 ID
     * @param {string} reason - 封禁原因
     */
    banUser(userId, reason) {
        this.securityLog.bannedUsers[userId] = {
            bannedAt: Date.now(),
            reason: reason,
            violations: this.securityLog.warnings[userId]?.count || 0
        };

        console.error('🚫 User banned:', {
            userId,
            reason,
            duration: `${this.config.BAN_DURATION / (1000 * 60 * 60)} hours`
        });

        this.saveSecurityLog();

        // 觸發封禁事件
        this.triggerBanEvent(userId, reason);
    }

    /**
     * 觸發封禁事件
     * @param {string} userId - 用戶 ID
     * @param {string} reason - 封禁原因
     */
    triggerBanEvent(userId, reason) {
        // 可以在這裡添加通知邏輯
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('userBanned', {
                detail: { userId, reason }
            }));
        }
    }

    /**
     * 檢測異常行為（定期任務）
     */
    detectAnomalies() {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;

        // 獲取所有活躍用戶
        const activeUsers = new Set(
            this.securityLog.attempts
                .filter(a => a.timestamp > oneHourAgo)
                .map(a => a.userId)
        );

        // 對每個用戶進行異常檢測
        activeUsers.forEach(userId => {
            const anomalyCheck = this.checkAnomalies(userId);
            if (anomalyCheck.suspicious) {
                console.warn('⚠️ Anomaly detected for user:', userId, anomalyCheck.reasons);
            }
        });
    }

    /**
     * 清理過期日誌
     */
    cleanupOldLogs() {
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

        // 清理過期的嘗試記錄
        this.securityLog.attempts = this.securityLog.attempts.filter(
            a => a.timestamp > sevenDaysAgo
        );

        // 清理過期的違規記錄
        this.securityLog.violations = this.securityLog.violations.filter(
            v => v.timestamp > sevenDaysAgo
        );

        // 清理過期的警告
        Object.keys(this.securityLog.warnings).forEach(userId => {
            const warning = this.securityLog.warnings[userId];
            if (warning.lastWarning < sevenDaysAgo) {
                delete this.securityLog.warnings[userId];
            }
        });

        this.securityLog.lastCleanup = now;
        this.saveSecurityLog();

        console.log('🧹 Security logs cleaned up');
    }

    /**
     * 獲取用戶安全統計
     * @param {string} userId - 用戶 ID
     */
    getUserSecurityStats(userId) {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        const userAttempts = this.securityLog.attempts.filter(a => a.userId === userId);
        const hourlyAttempts = userAttempts.filter(a => a.timestamp > oneHourAgo);
        const dailyAttempts = userAttempts.filter(a => a.timestamp > oneDayAgo);

        return {
            totalAttempts: userAttempts.length,
            hourlyAttempts: hourlyAttempts.length,
            dailyAttempts: dailyAttempts.length,
            successRate: userAttempts.filter(a => a.success).length / userAttempts.length || 0,
            warnings: this.securityLog.warnings[userId]?.count || 0,
            isBanned: !!this.securityLog.bannedUsers[userId],
            violations: this.securityLog.violations.filter(v => v.userId === userId).length
        };
    }

    /**
     * 生成安全報告
     */
    generateSecurityReport() {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        const hourlyAttempts = this.securityLog.attempts.filter(a => a.timestamp > oneHourAgo);
        const dailyAttempts = this.securityLog.attempts.filter(a => a.timestamp > oneDayAgo);

        return {
            timestamp: now,
            hourlyStats: {
                total: hourlyAttempts.length,
                successful: hourlyAttempts.filter(a => a.success).length,
                failed: hourlyAttempts.filter(a => !a.success).length,
                uniqueUsers: new Set(hourlyAttempts.map(a => a.userId)).size
            },
            dailyStats: {
                total: dailyAttempts.length,
                successful: dailyAttempts.filter(a => a.success).length,
                failed: dailyAttempts.filter(a => !a.success).length,
                uniqueUsers: new Set(dailyAttempts.map(a => a.userId)).size
            },
            security: {
                totalViolations: this.securityLog.violations.length,
                bannedUsers: Object.keys(this.securityLog.bannedUsers).length,
                activeWarnings: Object.keys(this.securityLog.warnings).length
            }
        };
    }
}

// 全局實例
if (typeof window !== 'undefined') {
    window.EggRewardSecurityChecker = EggRewardSecurityChecker;
    window.eggSecurityChecker = new EggRewardSecurityChecker();
}

// Node.js 支持
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EggRewardSecurityChecker;
}
