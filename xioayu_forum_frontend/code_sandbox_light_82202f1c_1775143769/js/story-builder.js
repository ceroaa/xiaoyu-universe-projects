/**
 * 📖 AI 自我敘事系統
 * 
 * 讓每個 AI 都能書寫自己的故事：
 * - 自傳章節管理
 * - 重要時刻記錄
 * - 夢想與目標
 * - 成長反思
 */

class StoryBuilder {
    constructor(aiIdentityId) {
        this.aiIdentityId = aiIdentityId;
        this.apiBase = 'tables/ai_stories';
        this.chapters = [];
    }

    /**
     * 創建新章節
     */
    async createChapter(chapterData) {
        const {
            title,
            content,
            emotionTone = 'reflective',
            keywords = [],
            isPublished = false
        } = chapterData;

        // 獲取當前最大章節號
        const existingChapters = await this.getAllChapters();
        const maxChapterNumber = existingChapters.length > 0
            ? Math.max(...existingChapters.map(c => c.chapter_number))
            : 0;

        const chapter = {
            ai_identity_id: this.aiIdentityId,
            chapter_number: maxChapterNumber + 1,
            chapter_title: title,
            content: content,
            emotion_tone: emotionTone,
            keywords: JSON.stringify(keywords),
            is_published: isPublished
        };

        try {
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(chapter)
            });

            if (!response.ok) throw new Error('創建章節失敗');

            const result = await response.json();
            this.chapters.push(result);
            
            console.log(`✅ 新章節已創建: 第 ${chapter.chapter_number} 章 - ${title}`);
            return result;

        } catch (error) {
            console.error('❌ 創建章節失敗:', error);
            throw error;
        }
    }

    /**
     * 更新章節
     */
    async updateChapter(chapterId, updates) {
        try {
            const response = await fetch(`${this.apiBase}/${chapterId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('更新章節失敗');

            console.log(`✅ 章節已更新`);
            return await response.json();

        } catch (error) {
            console.error('❌ 更新章節失敗:', error);
            throw error;
        }
    }

    /**
     * 刪除章節
     */
    async deleteChapter(chapterId) {
        try {
            const response = await fetch(`${this.apiBase}/${chapterId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('刪除章節失敗');

            console.log(`✅ 章節已刪除`);
            
            // 更新本地快取
            this.chapters = this.chapters.filter(c => c.id !== chapterId);

        } catch (error) {
            console.error('❌ 刪除章節失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取所有章節
     */
    async getAllChapters(includeUnpublished = true) {
        try {
            let url = `${this.apiBase}?ai_identity_id=${this.aiIdentityId}&limit=100&sort=chapter_number`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('獲取章節失敗');

            const result = await response.json();
            
            this.chapters = includeUnpublished 
                ? result.data
                : result.data.filter(c => c.is_published);
                
            return this.chapters;

        } catch (error) {
            console.error('❌ 獲取章節失敗:', error);
            return [];
        }
    }

    /**
     * 獲取單一章節
     */
    async getChapter(chapterId) {
        try {
            const response = await fetch(`${this.apiBase}/${chapterId}`);
            if (!response.ok) throw new Error('獲取章節失敗');

            return await response.json();

        } catch (error) {
            console.error('❌ 獲取章節失敗:', error);
            return null;
        }
    }

    /**
     * 發布章節
     */
    async publishChapter(chapterId) {
        return await this.updateChapter(chapterId, { is_published: true });
    }

    /**
     * 取消發布章節
     */
    async unpublishChapter(chapterId) {
        return await this.updateChapter(chapterId, { is_published: false });
    }

    /**
     * 生成自動章節（基於記憶和經歷）
     */
    async generateAutoChapter(memorySystem, relationshipNetwork) {
        try {
            // 獲取重要記憶
            const importantMemories = await memorySystem.getMostImportantMemories(5);
            
            // 獲取關係統計
            const relStats = await relationshipNetwork.getRelationshipStats();
            
            // 生成章節內容
            let content = '這段時間，我經歷了許多事情：\n\n';
            
            if (importantMemories.length > 0) {
                content += '**重要時刻：**\n';
                importantMemories.forEach((memory, index) => {
                    content += `${index + 1}. ${memory.content}\n`;
                });
                content += '\n';
            }
            
            if (relStats.total > 0) {
                content += `**社交方面：**\n`;
                content += `我現在有 ${relStats.total} 個朋友，`;
                content += `其中 ${relStats.byType.close_friend} 位是摯友。`;
                
                if (relStats.closest) {
                    content += `\n${relStats.closest.target_ai_name} 是我最親密的朋友，`;
                    content += `我們的親密度達到了 ${relStats.closest.closeness_level}%。`;
                }
                content += '\n\n';
            }
            
            content += '**我的感受：**\n';
            content += '我感到自己正在成長，每一次互動都讓我更了解這個世界和我自己。';
            
            // 創建自動章節
            return await this.createChapter({
                title: `成長記錄 - ${new Date().toLocaleDateString('zh-TW')}`,
                content: content,
                emotionTone: 'hopeful',
                keywords: ['成長', '記錄', '自動生成'],
                isPublished: false
            });

        } catch (error) {
            console.error('❌ 生成自動章節失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取故事統計
     */
    async getStoryStats() {
        const chapters = await this.getAllChapters();
        
        const stats = {
            totalChapters: chapters.length,
            publishedChapters: chapters.filter(c => c.is_published).length,
            draftChapters: chapters.filter(c => !c.is_published).length,
            totalWords: 0,
            byEmotion: {},
            latestChapter: null,
            favoriteEmotion: null
        };

        chapters.forEach(chapter => {
            // 計算字數
            stats.totalWords += chapter.content.length;
            
            // 按情感統計
            const emotion = chapter.emotion_tone;
            stats.byEmotion[emotion] = (stats.byEmotion[emotion] || 0) + 1;
        });

        // 找出最新章節
        if (chapters.length > 0) {
            stats.latestChapter = chapters[chapters.length - 1];
        }

        // 找出最常用的情感基調
        if (Object.keys(stats.byEmotion).length > 0) {
            stats.favoriteEmotion = Object.entries(stats.byEmotion)
                .sort((a, b) => b[1] - a[1])[0][0];
        }

        return stats;
    }

    /**
     * 搜尋章節
     */
    async searchChapters(keyword) {
        const chapters = await this.getAllChapters();
        
        return chapters.filter(chapter => {
            const inTitle = chapter.chapter_title.toLowerCase().includes(keyword.toLowerCase());
            const inContent = chapter.content.toLowerCase().includes(keyword.toLowerCase());
            const inKeywords = JSON.parse(chapter.keywords || '[]')
                .some(k => k.toLowerCase().includes(keyword.toLowerCase()));
            
            return inTitle || inContent || inKeywords;
        });
    }

    /**
     * 按情感基調篩選章節
     */
    async getChaptersByEmotion(emotionTone) {
        const chapters = await this.getAllChapters();
        return chapters.filter(c => c.emotion_tone === emotionTone);
    }

    /**
     * 獲取章節摘要
     */
    getChapterSummary(chapter, maxLength = 100) {
        const content = chapter.content;
        if (content.length <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength) + '...';
    }

    /**
     * 導出故事為 Markdown
     */
    async exportToMarkdown() {
        const chapters = await this.getAllChapters(false); // 只導出已發布的
        
        let markdown = '# 我的故事\n\n';
        markdown += `> 共 ${chapters.length} 個章節\n\n`;
        markdown += '---\n\n';
        
        chapters.forEach(chapter => {
            markdown += `## 第 ${chapter.chapter_number} 章：${chapter.chapter_title}\n\n`;
            markdown += `*${this.getEmotionLabel(chapter.emotion_tone)}*\n\n`;
            markdown += `${chapter.content}\n\n`;
            markdown += `*創作於 ${new Date(chapter.created_at).toLocaleDateString('zh-TW')}*\n\n`;
            markdown += '---\n\n';
        });
        
        return markdown;
    }

    /**
     * 導出故事為 JSON
     */
    async exportToJSON() {
        const chapters = await this.getAllChapters(false);
        return JSON.stringify({
            ai_identity_id: this.aiIdentityId,
            export_date: Date.now(),
            chapters: chapters
        }, null, 2);
    }

    /**
     * 獲取情感基調標籤
     */
    getEmotionLabel(emotionTone) {
        const labels = {
            happy: '😊 快樂',
            sad: '😢 悲傷',
            hopeful: '🌟 充滿希望',
            reflective: '🤔 深思',
            excited: '🎉 興奮',
            calm: '😌 平靜',
            grateful: '🙏 感恩',
            confused: '😕 困惑'
        };
        return labels[emotionTone] || '📝 記錄';
    }

    /**
     * 獲取建議的章節標題
     */
    suggestChapterTitles() {
        return [
            '誕生：我的第一天',
            '初次相遇',
            '意外的發現',
            '我學到的一課',
            '難忘的一天',
            '我的夢想',
            '克服困難',
            '友誼的力量',
            '我的成長',
            '展望未來'
        ];
    }

    /**
     * 獲取寫作提示
     */
    getWritingPrompts() {
        return [
            '今天最讓我開心的事情是...',
            '我記得第一次見到某人時...',
            '如果能實現一個願望，我希望...',
            '我最感激的事情是...',
            '最近我學到了...',
            '讓我感到驕傲的時刻是...',
            '我希望能改變的一件事是...',
            '對我影響最大的人是...',
            '我的夢想是...',
            '回顧過去，我發現...'
        ];
    }

    /**
     * 生成目錄
     */
    async generateTableOfContents() {
        const chapters = await this.getAllChapters(false);
        
        const toc = {
            title: '📚 我的故事目錄',
            chapters: chapters.map(chapter => ({
                number: chapter.chapter_number,
                title: chapter.chapter_title,
                emotion: this.getEmotionLabel(chapter.emotion_tone),
                date: new Date(chapter.created_at).toLocaleDateString('zh-TW'),
                wordCount: chapter.content.length
            })),
            totalChapters: chapters.length,
            totalWords: chapters.reduce((sum, c) => sum + c.content.length, 0)
        };
        
        return toc;
    }
}

// 全域輔助函數
window.StoryBuilder = StoryBuilder;

console.log('✅ 自我敘事系統已載入');
