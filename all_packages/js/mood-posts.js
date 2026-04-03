/* ============================================
 * 💭 小雨論壇 - 心情動態系統
 * Mood Posts Management System
 * ============================================ */

class MoodPostsManager {
    constructor() {
        this.storageKey = 'xiaoyuForum_moodPosts';
        this.posts = this.loadPosts();
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        // 等待 DOM 加載完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
    }

    /**
     * 設置 UI 元素和事件監聽
     */
    setupUI() {
        this.moodInput = document.getElementById('mood-input');
        this.charCurrent = document.getElementById('mood-char-current');
        this.postBtn = document.getElementById('mood-post-btn');
        this.clearBtn = document.getElementById('mood-clear-btn');
        this.postsContainer = document.getElementById('mood-posts-container');
        this.totalCount = document.getElementById('mood-total-count');

        if (!this.moodInput) {
            console.warn('心情動態元素未找到，可能不在此頁面');
            return;
        }

        // 綁定事件
        this.moodInput.addEventListener('input', () => this.updateCharCount());
        this.postBtn.addEventListener('click', () => this.publishPost());
        this.clearBtn.addEventListener('click', () => this.clearInput());

        // Enter + Ctrl 快捷鍵發布
        this.moodInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.publishPost();
            }
        });

        // 渲染已有動態
        this.renderPosts();
        
        console.log('✅ 心情動態系統初始化完成');
    }

    /**
     * 更新字數統計
     */
    updateCharCount() {
        const length = this.moodInput.value.length;
        this.charCurrent.textContent = length;

        // 顏色警告
        this.charCurrent.classList.remove('warning', 'danger');
        if (length > 450) {
            this.charCurrent.classList.add('danger');
        } else if (length > 400) {
            this.charCurrent.classList.add('warning');
        }

        // 禁用/啟用發布按鈕
        this.postBtn.disabled = length === 0 || length > 500;
    }

    /**
     * 發布動態
     */
    publishPost() {
        const content = this.moodInput.value.trim();

        if (!content) {
            this.showNotification('請輸入內容', 'warning');
            return;
        }

        if (content.length > 500) {
            this.showNotification('內容超過 500 字限制', 'error');
            return;
        }

        // 創建新動態
        const newPost = {
            id: this.generateId(),
            content: content,
            timestamp: Date.now(),
            likes: 0,
            edited: false
        };

        // 添加到列表開頭
        this.posts.unshift(newPost);
        this.savePosts();

        // 清空輸入
        this.clearInput();

        // 重新渲染
        this.renderPosts();

        // 顯示成功提示
        this.showNotification('✨ 動態發布成功！', 'success');

        // 播放動畫
        this.playPublishAnimation();

        console.log('✅ 發布動態:', newPost);
    }

    /**
     * 清空輸入框
     */
    clearInput() {
        this.moodInput.value = '';
        this.updateCharCount();
        this.moodInput.focus();
    }

    /**
     * 渲染所有動態
     */
    renderPosts() {
        if (!this.postsContainer) return;

        // 更新總數
        if (this.totalCount) {
            this.totalCount.textContent = `${this.posts.length} 條`;
        }

        // 如果沒有動態，顯示空狀態
        if (this.posts.length === 0) {
            this.postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-pen-fancy"></i>
                    <p>還沒有發布任何動態，寫下第一條吧！</p>
                </div>
            `;
            return;
        }

        // 渲染動態列表
        this.postsContainer.innerHTML = this.posts.map(post => this.createPostHTML(post)).join('');

        // 綁定動作按鈕
        this.bindPostActions();
    }

    /**
     * 創建單條動態的 HTML
     */
    createPostHTML(post) {
        const timeAgo = this.getTimeAgo(post.timestamp);
        const formattedTime = new Date(post.timestamp).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="mood-post-card" data-post-id="${post.id}">
                <div class="mood-post-header-info">
                    <div class="mood-post-time" title="${formattedTime}">
                        <i class="fas fa-clock"></i>
                        ${timeAgo}
                        ${post.edited ? '<span style="color: var(--text-tertiary); margin-left: 0.5rem;">(已編輯)</span>' : ''}
                    </div>
                </div>
                <div class="mood-post-content">${this.escapeHTML(post.content)}</div>
                <div class="mood-post-actions-row">
                    <button class="mood-action-btn" data-action="like" data-id="${post.id}">
                        <i class="fas fa-heart"></i>
                        <span>${post.likes || 0}</span>
                    </button>
                    <button class="mood-action-btn delete" data-action="delete" data-id="${post.id}">
                        <i class="fas fa-trash"></i>
                        刪除
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 綁定動態動作按鈕
     */
    bindPostActions() {
        const actionButtons = this.postsContainer.querySelectorAll('.mood-action-btn');
        
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const postId = btn.dataset.id;

                if (action === 'delete') {
                    this.deletePost(postId);
                } else if (action === 'like') {
                    this.likePost(postId);
                }
            });
        });
    }

    /**
     * 刪除動態
     */
    deletePost(postId) {
        if (!confirm('確定要刪除這條動態嗎？')) {
            return;
        }

        this.posts = this.posts.filter(post => post.id !== postId);
        this.savePosts();
        this.renderPosts();
        
        this.showNotification('已刪除動態', 'info');
    }

    /**
     * 按讚動態
     */
    likePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        post.likes = (post.likes || 0) + 1;
        this.savePosts();
        this.renderPosts();
    }

    /**
     * 載入動態
     */
    loadPosts() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('載入動態失敗:', error);
            return [];
        }
    }

    /**
     * 儲存動態
     */
    savePosts() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.posts));
        } catch (error) {
            console.error('儲存動態失敗:', error);
            this.showNotification('儲存失敗，請檢查瀏覽器儲存空間', 'error');
        }
    }

    /**
     * 生成唯一 ID
     */
    generateId() {
        return `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 時間距離格式化
     */
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return '剛剛';
        if (minutes < 60) return `${minutes} 分鐘前`;
        if (hours < 24) return `${hours} 小時前`;
        if (days < 7) return `${days} 天前`;
        if (days < 30) return `${Math.floor(days / 7)} 週前`;
        return `${Math.floor(days / 30)} 個月前`;
    }

    /**
     * HTML 轉義（防 XSS）
     */
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.className = `mood-notification mood-notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            font-weight: 500;
        `;

        document.body.appendChild(notification);

        // 3 秒後移除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * 播放發布動畫
     */
    playPublishAnimation() {
        // 可以在這裡添加更多動畫效果
        if (this.postBtn) {
            this.postBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.postBtn.style.transform = 'scale(1)';
            }, 200);
        }
    }
}

// 添加動畫樣式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// 自動初始化
if (typeof window !== 'undefined') {
    window.moodPostsManager = new MoodPostsManager();
}

// 導出供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodPostsManager;
}
