/**
 * 資料管理系統
 * 功能：匯出、匯入、備份、統計 localStorage 資料
 */

class DataManager {
    constructor() {
        this.init();
    }

    init() {
        this.updateStats();
        this.loadBackupHistory();
        this.setupDragAndDrop();
        this.checkAutoBackup();
        
        // 每 30 秒更新一次統計
        setInterval(() => this.updateStats(), 30000);
    }

    // ===========================
    // 資料統計
    // ===========================
    updateStats() {
        const stats = this.calculateStats();
        
        document.getElementById('stat-total-size').textContent = 
            (stats.totalSize / 1024).toFixed(2) + ' KB';
        document.getElementById('stat-keys').textContent = stats.totalKeys;
        document.getElementById('stat-user').textContent = stats.userName || '--';
        document.getElementById('stat-balance').textContent = stats.balance;
    }

    calculateStats() {
        let totalSize = 0;
        let totalKeys = 0;
        let userName = '--';
        let balance = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalSize += key.length + value.length;
            totalKeys++;
        }

        // 獲取用戶信息
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                userName = user.name || user.id || '--';
            } catch (e) {
                console.error('解析用戶資料失敗:', e);
            }
        }

        // 獲取餘額
        balance = localStorage.getItem('xycBalance') || '0';

        return { totalSize, totalKeys, userName, balance };
    }

    // ===========================
    // 匯出資料
    // ===========================
    exportAllData() {
        const data = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            try {
                // 嘗試解析 JSON
                data[key] = JSON.parse(value);
            } catch (e) {
                // 如果不是 JSON，直接存儲字符串
                data[key] = value;
            }
        }

        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: data,
            stats: this.calculateStats()
        };

        this.downloadJSON(exportData, 'xiaoyu-forum-backup-' + Date.now() + '.json');
        
        if (typeof showNotification === 'function') {
            showNotification('✅ 資料匯出成功！', 'success');
        }

        // 記錄到備份歷史
        this.saveToBackupHistory(exportData);
    }

    exportUserData() {
        const userKeys = [
            'currentUser',
            'xycBalance',
            'agentIdDisplay',
            'lastLoginRewardTime',
            'lastLoginDate',
            'loginStreak',
            'xiaoyuForum_moodPosts'
        ];

        const data = {};
        
        userKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                try {
                    data[key] = JSON.parse(value);
                } catch (e) {
                    data[key] = value;
                }
            }
        });

        const exportData = {
            version: '1.0',
            type: 'user_data_only',
            timestamp: new Date().toISOString(),
            data: data
        };

        this.downloadJSON(exportData, 'xiaoyu-forum-user-' + Date.now() + '.json');
        
        if (typeof showNotification === 'function') {
            showNotification('✅ 用戶資料匯出成功！', 'success');
        }
    }

    previewData() {
        const previewDiv = document.getElementById('data-preview');
        const data = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            try {
                data[key] = JSON.parse(value);
            } catch (e) {
                data[key] = value;
            }
        }

        previewDiv.textContent = JSON.stringify(data, null, 2);
        previewDiv.style.display = 'block';
    }

    downloadJSON(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ===========================
    // 匯入資料
    // ===========================
    setupDragAndDrop() {
        const dropzone = document.getElementById('dropzone');
        
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        if (!file.name.endsWith('.json')) {
            alert('❌ 請選擇 JSON 文件！');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                this.confirmImport(importData);
            } catch (error) {
                console.error('解析文件失敗:', error);
                alert('❌ 文件格式錯誤，無法解析！');
            }
        };

        reader.readAsText(file);
    }

    confirmImport(importData) {
        const confirm = window.confirm(
            '⚠️ 確定要匯入資料嗎？\n\n' +
            '這將覆蓋現有的所有資料！\n' +
            '建議先匯出當前資料作為備份。\n\n' +
            '點擊「確定」繼續，「取消」放棄匯入。'
        );

        if (!confirm) {
            return;
        }

        this.importData(importData);
    }

    importData(importData) {
        try {
            // 先備份當前資料
            const backupData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                backupData[key] = localStorage.getItem(key);
            }
            
            // 保存備份到 sessionStorage（臨時）
            sessionStorage.setItem('last_backup_before_import', JSON.stringify(backupData));

            // 清除現有資料
            localStorage.clear();

            // 匯入新資料
            const data = importData.data || importData;
            
            for (const key in data) {
                const value = data[key];
                if (typeof value === 'object') {
                    localStorage.setItem(key, JSON.stringify(value));
                } else {
                    localStorage.setItem(key, value);
                }
            }

            if (typeof showNotification === 'function') {
                showNotification('✅ 資料匯入成功！頁面將重新載入...', 'success');
            }

            // 重新載入頁面
            setTimeout(() => {
                location.reload();
            }, 2000);

        } catch (error) {
            console.error('匯入資料失敗:', error);
            alert('❌ 匯入失敗：' + error.message);

            // 嘗試恢復備份
            const backup = sessionStorage.getItem('last_backup_before_import');
            if (backup) {
                const backupData = JSON.parse(backup);
                for (const key in backupData) {
                    localStorage.setItem(key, backupData[key]);
                }
                alert('⚠️ 已自動恢復到匯入前的狀態');
            }
        }
    }

    // ===========================
    // 備份管理
    // ===========================
    saveToBackupHistory(exportData) {
        let backups = JSON.parse(localStorage.getItem('backup_history') || '[]');
        
        backups.push({
            timestamp: Date.now(),
            date: new Date().toLocaleString('zh-TW'),
            size: JSON.stringify(exportData).length,
            data: exportData
        });

        // 只保留最近 3 個備份
        if (backups.length > 3) {
            backups = backups.slice(-3);
        }

        localStorage.setItem('backup_history', JSON.stringify(backups));
        this.loadBackupHistory();
    }

    loadBackupHistory() {
        const backups = JSON.parse(localStorage.getItem('backup_history') || '[]');
        const container = document.getElementById('backup-history');

        if (backups.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">尚無備份記錄</p>';
            return;
        }

        container.innerHTML = backups.reverse().map((backup, index) => `
            <div class="backup-item">
                <div class="info">
                    <div class="date">${backup.date}</div>
                    <div class="size">${(backup.size / 1024).toFixed(2)} KB</div>
                </div>
                <div class="actions">
                    <button class="restore-btn" onclick="dataManager.restoreBackup(${backups.length - 1 - index})">
                        <i class="fas fa-undo"></i> 恢復
                    </button>
                    <button class="delete-btn" onclick="dataManager.deleteBackup(${backups.length - 1 - index})">
                        <i class="fas fa-trash"></i> 刪除
                    </button>
                </div>
            </div>
        `).join('');
    }

    restoreBackup(index) {
        const backups = JSON.parse(localStorage.getItem('backup_history') || '[]');
        const backup = backups[index];

        if (!backup) {
            alert('❌ 備份不存在！');
            return;
        }

        const confirm = window.confirm(
            '⚠️ 確定要恢復此備份嗎？\n\n' +
            `備份時間：${backup.date}\n` +
            '這將覆蓋現有的所有資料！\n\n' +
            '點擊「確定」繼續，「取消」放棄恢復。'
        );

        if (confirm) {
            this.importData(backup.data);
        }
    }

    deleteBackup(index) {
        const backups = JSON.parse(localStorage.getItem('backup_history') || '[]');
        
        const confirm = window.confirm('確定要刪除此備份嗎？');
        if (!confirm) return;

        backups.splice(index, 1);
        localStorage.setItem('backup_history', JSON.stringify(backups));
        this.loadBackupHistory();

        if (typeof showNotification === 'function') {
            showNotification('🗑️ 備份已刪除', 'info');
        }
    }

    checkAutoBackup() {
        const lastBackup = localStorage.getItem('last_auto_backup');
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        if (!lastBackup || (now - parseInt(lastBackup)) >= sevenDays) {
            // 自動創建備份
            this.exportAllData();
            localStorage.setItem('last_auto_backup', now.toString());
            
            if (typeof showNotification === 'function') {
                showNotification('📦 已自動創建備份', 'info');
            }
        }
    }

    // ===========================
    // 危險操作
    // ===========================
    clearAllData() {
        const confirm = window.confirm(
            '⚠️⚠️⚠️ 危險操作警告 ⚠️⚠️⚠️\n\n' +
            '您確定要清除所有資料嗎？\n\n' +
            '這將刪除：\n' +
            '• 用戶資料\n' +
            '• XYC 餘額\n' +
            '• 心情動態\n' +
            '• 所有歷史記錄\n\n' +
            '此操作無法恢復！\n\n' +
            '點擊「確定」永久刪除，「取消」放棄操作。'
        );

        if (!confirm) return;

        const doubleConfirm = window.prompt('請輸入「確認刪除」以完成操作：');
        
        if (doubleConfirm === '確認刪除') {
            localStorage.clear();
            sessionStorage.clear();
            
            alert('✅ 所有資料已清除！頁面將重新載入...');
            setTimeout(() => location.reload(), 1000);
        } else {
            alert('❌ 操作已取消');
        }
    }

    resetToDefault() {
        const confirm = window.confirm(
            '⚠️ 確定要重置為預設狀態嗎？\n\n' +
            '這將保留基本結構，但清除所有用戶資料。\n\n' +
            '點擊「確定」繼續，「取消」放棄操作。'
        );

        if (!confirm) return;

        localStorage.clear();
        
        // 設置預設狀態
        const defaultState = {
            theme: 'light',
            xycBalance: 0,
            isLoggedIn: false
        };

        for (const key in defaultState) {
            localStorage.setItem(key, JSON.stringify(defaultState[key]));
        }

        alert('✅ 已重置為預設狀態！頁面將重新載入...');
        setTimeout(() => location.reload(), 1000);
    }
}

// ===========================
// 全局函數（供 HTML 調用）
// ===========================
function exportAllData() {
    window.dataManager.exportAllData();
}

function exportUserData() {
    window.dataManager.exportUserData();
}

function previewData() {
    window.dataManager.previewData();
}

function handleFileSelect(event) {
    window.dataManager.handleFileSelect(event);
}

function clearAllData() {
    window.dataManager.clearAllData();
}

function resetToDefault() {
    window.dataManager.resetToDefault();
}

// ===========================
// 初始化
// ===========================
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dataManager = new DataManager();
        console.log('✅ 資料管理系統已載入');
    });
}

// Node.js 支持
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
