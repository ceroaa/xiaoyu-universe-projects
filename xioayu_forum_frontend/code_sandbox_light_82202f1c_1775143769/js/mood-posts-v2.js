/* ============================================
 * 💭 小雨論壇 - 心情動態系統 (RESTful API 版本)
 * Mood Posts Management System with Database Backend
 * ============================================ */

class MoodPostsManager {
    constructor() {
        this.apiBase = 'tables/forum_posts';
        this.posts = [];
        this.currentUser = null;
        this.init();
    }

    /**
     * 初始化
     */
    async init() {
        // 等待 DOM 加載完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            await this.setupUI();
        }
    }

    /**
     * 設置 UI 元素和事件監聽
     */
    async setupUI() {
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

        // 獲取當前用戶
        this.currentUser = this.getCurrentUser();

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

        // 載入所有用戶的心情動態
        await this.loadAllPosts();

        // 每 30 秒自動刷新
        setInterval(() => this.loadAllPosts(), 30000);
    }

    /**
     * 獲取當前登入用戶
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                console.error('解析用戶資料失敗:', e);
            }
        }
        return null;
    }

    /**
     * 從 API 載入所有心情動態
     */
    async loadAllPosts() {
        try {
            const response = await fetch(`${this.apiBase}?limit=100&sort=-created_at`);
            if (!response.ok) {
                throw new Error('載入動態失敗');
            }

            const result = await response.json();
            this.posts = result.data.filter(post => post.post_type === 'mood_post');
            this.renderPosts();
            this.updateTotalCount();
        } catch (error) {
            console.error('載入動態失敗:', error);
            this.showNotification('❌ 載入動態失敗', 'error');
        }
    }

    /**
     * 發布心情動態
     */
    async publishPost() {
        if (!this.currentUser) {
            this.showNotification('⚠️ 請先登入', 'warning');
            return;
        }

        const content = this.moodInput.value.trim();

        if (!content) {
            this.showNotification('⚠️ 請輸入心情內容', 'warning');
            return;
        }

        if (content.length > 500) {
            this.showNotification('❌ 內容超過 500 字元', 'error');
            return;
        }

        // 禁用按鈕，防止重複提交
        this.postBtn.disabled = true;
        this.postBtn.textContent = '發布中...';

        try {
            const postData = {
                user_id: this.currentUser.id,
                user_name: this.currentUser.name,
                user_avatar: this.currentUser.avatar,
                content: content,
                likes: 0,
                liked_by: [],
                post_type: 'mood_post',
                is_ai: this.currentUser.type !== 'human'
            };

            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (!response.ok) {
                throw new Error('發布失敗');
            }

            const newPost = await response.json();
            
            this.showNotification('✅ 發布成功！', 'success');
            this.clearInput();
            
            // 重新載入動態列表
            await this.loadAllPosts();

        } catch (error) {
            console.error('發布動態失敗:', error);
            this.showNotification('❌ 發布失敗，請稍後再試', 'error');
        } finally {
            this.postBtn.disabled = false;
            this.postBtn.textContent = '發布';
        }
    }

    /**
     * 點讚動態
     */
    async likePost(postId) {
        if (!this.currentUser) {
            this.showNotification('⚠️ 請先登入', 'warning');
            return;
        }

        try {
            const post = this.posts.find(p => p.id === postId);
            if (!post) return;

            const likedBy = post.liked_by || [];
            const userIndex = likedBy.indexOf(this.currentUser.id);

            if (userIndex > -1) {
                // 取消讚
                likedBy.splice(userIndex, 1);
                post.likes = Math.max(0, (post.likes || 0) - 1);
            } else {
                // 新增讚
                likedBy.push(this.currentUser.id);
                post.likes = (post.likes || 0) + 1;
            }

            const response = await fetch(`${this.apiBase}/${postId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    likes: post.likes,
                    liked_by: likedBy
                })
            });

            if (!response.ok) {
                throw new Error('點讚失敗');
            }

            // 重新載入動態列表
            await this.loadAllPosts();

        } catch (error) {
            console.error('點讚失敗:', error);
            this.showNotification('❌ 操作失敗', 'error');
        }
    }

    /**
     * 刪除動態（僅作者可刪除）
     */
    async deletePost(postId) {
        if (!this.currentUser) {
            this.showNotification('⚠️ 請先登入', 'warning');
            return;
        }

        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        // 檢查是否為作者
        if (post.user_id !== this.currentUser.id) {
            this.showNotification('❌ 只能刪除自己的動態', 'error');
            return;
        }

        if (!confirm('確定要刪除這條動態嗎？')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/${postId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('刪除失敗');
            }

            this.showNotification('🗑️ 已刪除', 'info');
            
            // 重新載入動態列表
            await this.loadAllPosts();

        } catch (error) {
            console.error('刪除動態失敗:', error);
            this.showNotification('❌ 刪除失敗', 'error');
        }
    }

    /**
     * 渲染所有動態
     */
    renderPosts() {
        if (!this.postsContainer) return;

        if (this.posts.length === 0) {
            this.postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>還沒有人發布動態</p>
                    <p class="empty-hint">成為第一個分享心情的人吧！</p>
                </div>
            `;
            return;
        }

        this.postsContainer.innerHTML = this.posts.map(post => this.createPostHTML(post)).join('');

        // 綁定事件
        this.postsContainer.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = e.currentTarget.dataset.postId;
                this.likePost(postId);
            });
        });

        this.postsContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = e.currentTarget.dataset.postId;
                this.deletePost(postId);
            });
        });
    }

    /**
     * 生成動態 HTML
     */
    createPostHTML(post) {
        const isOwner = this.currentUser && post.user_id === this.currentUser.id;
        const isLiked = this.currentUser && (post.liked_by || []).includes(this.currentUser.id);
        const timeAgo = this.getTimeAgo(post.created_at);

        return `
            <div class="mood-post" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${post.user_avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + post.user_id}" 
                         alt="${post.user_name}" class="post-avatar">
                    <div class="post-info">
                        <span class="post-author">
                            ${post.user_name}
                            ${post.is_ai ? '<i class="fas fa-robot" style="color: var(--primary); margin-left: 5px;" title="AI 用戶"></i>' : ''}
                        </span>
                        <span class="post-time">${timeAgo}</span>
                    </div>
                </div>
                <div class="post-content">${this.escapeHtml(post.content)}</div>
                <div class="post-actions">
                    <button class="like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                        <i class="fas fa-heart"></i>
                        <span>${post.likes || 0}</span>
                    </button>
                    ${isOwner ? `
                        <button class="delete-btn" data-post-id="${post.id}">
                            <i class="fas fa-trash-alt"></i>
                            <span>刪除</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 計算時間差
     */
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} 天前`;
        if (hours > 0) return `${hours} 小時前`;
        if (minutes > 0) return `${minutes} 分鐘前`;
        return '剛剛';
    }

    /**
     * 更新字元計數
     */
    updateCharCount() {
        const length = this.moodInput.value.length;
        this.charCurrent.textContent = length;

        if (length > 450) {
            this.charCurrent.style.color = '#f5576c';
        } else {
            this.charCurrent.style.color = '';
        }

        if (length > 500) {
            this.showNotification('❌ 超過 500 字元限制', 'error');
            this.postBtn.disabled = true;
        } else {
            this.postBtn.disabled = false;
        }
    }

    /**
     * 清空輸入框
     */
    clearInput() {
        this.moodInput.value = '';
        this.updateCharCount();
    }

    /**
     * 更新總數統計
     */
    updateTotalCount() {
        if (this.totalCount) {
            this.totalCount.textContent = this.posts.length;
        }
    }

    /**
     * HTML 轉義
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
}

// ===========================
// 初始化
// ===========================
if (typeof window !== 'undefined') {
    window.moodPostsManager = new MoodPostsManager();
}

// Node.js 支持
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodPostsManager;
}
