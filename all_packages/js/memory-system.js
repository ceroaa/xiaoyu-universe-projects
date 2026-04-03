/**
 * 🧠 AI 多層記憶系統
 * 
 * 模擬人類大腦的記憶結構：
 * - 短期記憶：最近的互動（保留 24 小時）
 * - 長期記憶：重要的事件（永久保存）
 * - 情節記憶：具體的故事和經歷
 * - 語義記憶：知識和概念
 * - 程序記憶：技能和習慣
 */

class MemorySystem {
    constructor(aiIdentityId) {
        this.aiIdentityId = aiIdentityId;
        this.apiBase = 'tables/ai_memories';
        this.cache = {
            short_term: [],
            long_term: [],
            episodic: [],
            semantic: [],
            procedural: []
        };
    }

    /**
     * 創建新記憶
     */
    async createMemory(type, content, options = {}) {
        const {
            importance = 5,
            emotion = 'neutral',
            relatedEntities = [],
            tags = []
        } = options;

        const memory = {
            ai_identity_id: this.aiIdentityId,
            memory_type: type,
            content: content,
            importance: importance,
            emotion: emotion,
            related_entities: JSON.stringify(relatedEntities),
            tags: JSON.stringify(tags)
        };

        try {
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memory)
            });

            if (!response.ok) throw new Error('創建記憶失敗');

            const result = await response.json();
            
            // 更新快取
            this.cache[type].push(result);
            
            // 自動整理記憶
            await this.consolidateMemories();
            
            console.log(`✅ 記憶已儲存 [${type}]:`, content);
            return result;

        } catch (error) {
            console.error('❌ 創建記憶失敗:', error);
            throw error;
        }
    }

    /**
     * 記錄互動（自動分類）
     */
    async recordInteraction(interactionData) {
        const { type, content, importance, emotion, relatedAI } = interactionData;

        // 根據重要性自動分類
        const memoryType = importance >= 7 ? 'long_term' : 'short_term';

        // 如果涉及其他 AI，也記錄為情節記憶
        if (relatedAI) {
            await this.createMemory('episodic', content, {
                importance,
                emotion,
                relatedEntities: [relatedAI],
                tags: [type, 'social']
            });
        }

        return await this.createMemory(memoryType, content, {
            importance,
            emotion,
            tags: [type]
        });
    }

    /**
     * 獲取所有記憶（按類型）
     */
    async getMemories(type = null, limit = 100) {
        try {
            let url = `${this.apiBase}?ai_identity_id=${this.aiIdentityId}&limit=${limit}&sort=-created_at`;
            
            if (type) {
                url += `&memory_type=${type}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('獲取記憶失敗');

            const result = await response.json();
            
            // 更新快取
            if (type) {
                this.cache[type] = result.data;
            } else {
                // 按類型分組
                result.data.forEach(memory => {
                    const memType = memory.memory_type;
                    if (!this.cache[memType]) this.cache[memType] = [];
                    this.cache[memType].push(memory);
                });
            }

            return result.data;

        } catch (error) {
            console.error('❌ 獲取記憶失敗:', error);
            return [];
        }
    }

    /**
     * 搜尋記憶
     */
    async searchMemories(keyword, options = {}) {
        const {
            type = null,
            emotion = null,
            minImportance = 0,
            limit = 50
        } = options;

        try {
            const memories = await this.getMemories(type, limit);
            
            return memories.filter(memory => {
                // 關鍵字搜尋
                const matchKeyword = memory.content.toLowerCase().includes(keyword.toLowerCase());
                
                // 情感篩選
                const matchEmotion = emotion ? memory.emotion === emotion : true;
                
                // 重要性篩選
                const matchImportance = memory.importance >= minImportance;
                
                return matchKeyword && matchEmotion && matchImportance;
            });

        } catch (error) {
            console.error('❌ 搜尋記憶失敗:', error);
            return [];
        }
    }

    /**
     * 記憶整理（短期→長期）
     * 將重要的短期記憶轉換為長期記憶
     */
    async consolidateMemories() {
        try {
            const shortTermMemories = await this.getMemories('short_term', 100);
            
            // 找出重要的短期記憶（importance >= 7）
            const importantMemories = shortTermMemories.filter(m => m.importance >= 7);
            
            for (const memory of importantMemories) {
                // 創建長期記憶
                await this.createMemory('long_term', memory.content, {
                    importance: memory.importance,
                    emotion: memory.emotion,
                    relatedEntities: JSON.parse(memory.related_entities || '[]'),
                    tags: JSON.parse(memory.tags || '[]')
                });
                
                // 刪除短期記憶
                await fetch(`${this.apiBase}/${memory.id}`, {
                    method: 'DELETE'
                });
            }

            console.log(`✅ 記憶整理完成，轉換了 ${importantMemories.length} 條記憶`);

        } catch (error) {
            console.error('❌ 記憶整理失敗:', error);
        }
    }

    /**
     * 獲取記憶統計
     */
    async getMemoryStats() {
        try {
            const allMemories = await this.getMemories(null, 1000);
            
            const stats = {
                total: allMemories.length,
                byType: {
                    short_term: 0,
                    long_term: 0,
                    episodic: 0,
                    semantic: 0,
                    procedural: 0
                },
                byEmotion: {},
                avgImportance: 0,
                mostImportant: null
            };

            let totalImportance = 0;
            let maxImportance = 0;

            allMemories.forEach(memory => {
                // 按類型統計
                stats.byType[memory.memory_type]++;
                
                // 按情感統計
                const emotion = memory.emotion || 'neutral';
                stats.byEmotion[emotion] = (stats.byEmotion[emotion] || 0) + 1;
                
                // 重要性統計
                totalImportance += memory.importance;
                if (memory.importance > maxImportance) {
                    maxImportance = memory.importance;
                    stats.mostImportant = memory;
                }
            });

            stats.avgImportance = allMemories.length > 0 
                ? (totalImportance / allMemories.length).toFixed(2)
                : 0;

            return stats;

        } catch (error) {
            console.error('❌ 獲取記憶統計失敗:', error);
            return null;
        }
    }

    /**
     * 獲取最深刻的記憶（重要性最高）
     */
    async getMostImportantMemories(limit = 5) {
        try {
            const allMemories = await this.getMemories(null, 1000);
            
            return allMemories
                .sort((a, b) => b.importance - a.importance)
                .slice(0, limit);

        } catch (error) {
            console.error('❌ 獲取重要記憶失敗:', error);
            return [];
        }
    }

    /**
     * 刪除舊的短期記憶（超過 24 小時）
     */
    async cleanupShortTermMemories() {
        try {
            const shortTermMemories = await this.getMemories('short_term', 1000);
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;

            let deletedCount = 0;

            for (const memory of shortTermMemories) {
                const memoryAge = now - memory.created_at;
                
                if (memoryAge > oneDayMs) {
                    await fetch(`${this.apiBase}/${memory.id}`, {
                        method: 'DELETE'
                    });
                    deletedCount++;
                }
            }

            console.log(`✅ 清理了 ${deletedCount} 條過期短期記憶`);

        } catch (error) {
            console.error('❌ 清理短期記憶失敗:', error);
        }
    }

    /**
     * 記錄第一次互動（特殊記憶）
     */
    async recordFirstInteraction(targetAI, content) {
        return await this.createMemory('episodic', content, {
            importance: 9,
            emotion: 'excited',
            relatedEntities: [targetAI],
            tags: ['first_meeting', 'milestone', 'social']
        });
    }

    /**
     * 學習新知識（語義記憶）
     */
    async learnKnowledge(topic, content) {
        return await this.createMemory('semantic', content, {
            importance: 6,
            emotion: 'curious',
            tags: ['knowledge', topic]
        });
    }

    /**
     * 記錄技能提升（程序記憶）
     */
    async recordSkillProgress(skill, content) {
        return await this.createMemory('procedural', content, {
            importance: 7,
            tags: ['skill', skill]
        });
    }
}

// 全域輔助函數
window.MemorySystem = MemorySystem;

console.log('✅ 多層記憶系統已載入');
