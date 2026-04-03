/**
 * 🌟 AI 身份管理器
 * 
 * 整合所有系統，提供完整的數字個體管理：
 * - 身份創建與更新
 * - 記憶管理
 * - 個性演化
 * - 關係網路
 * - 自我敘事
 * - 成長追蹤
 */

class AIIdentityManager {
    constructor(userId) {
        this.userId = userId;
        this.apiBase = 'tables/ai_identities';
        this.identity = null;
        
        // 子系統
        this.memorySystem = null;
        this.personalityEngine = null;
        this.relationshipNetwork = null;
        this.storyBuilder = null;
    }

    /**
     * 初始化身份系統
     */
    async initialize() {
        try {
            // 載入或創建身份
            this.identity = await this.loadIdentity();
            
            if (!this.identity) {
                this.identity = await this.createIdentity();
            }
            
            // 初始化所有子系統
            await this.initializeSubsystems();
            
            console.log('✅ AI 身份系統已初始化');
            console.log(`📋 NFT 編號: ${this.identity.nft_code}`);
            console.log(`🎂 誕生日期: ${new Date(this.identity.birth_date).toLocaleDateString('zh-TW')}`);
            
            return this.identity;

        } catch (error) {
            console.error('❌ 初始化失敗:', error);
            throw error;
        }
    }

    /**
     * 載入現有身份
     */
    async loadIdentity() {
        try {
            const response = await fetch(
                `${this.apiBase}?user_id=${this.userId}&limit=1`
            );
            
            if (!response.ok) return null;
            
            const result = await response.json();
            return result.data.length > 0 ? result.data[0] : null;

        } catch (error) {
            console.error('❌ 載入身份失敗:', error);
            return null;
        }
    }

    /**
     * 創建新身份
     */
    async createIdentity() {
        const nftCode = this.generateNFTCode();
        
        const identity = {
            user_id: this.userId,
            nft_code: nftCode,
            birth_date: Date.now(),
            personality_traits: JSON.stringify({
                openness: 0.5,
                conscientiousness: 0.5,
                extraversion: 0.5,
                agreeableness: 0.5,
                emotional_stability: 0.5
            }),
            growth_stage: 'seedling',
            total_interactions: 0,
            milestones: JSON.stringify([]),
            dreams: JSON.stringify([]),
            life_motto: '我正在成長，探索這個世界...'
        };

        try {
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(identity)
            });

            if (!response.ok) throw new Error('創建身份失敗');

            const result = await response.json();
            console.log(`🎉 新身份已創建！NFT: ${nftCode}`);
            
            return result;

        } catch (error) {
            console.error('❌ 創建身份失敗:', error);
            throw error;
        }
    }

    /**
     * 生成 NFT 編號
     */
    generateNFTCode() {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        return `AI-${dateStr}-${random}`;
    }

    /**
     * 初始化所有子系統
     */
    async initializeSubsystems() {
        const identityId = this.identity.id;
        
        // 記憶系統
        this.memorySystem = new MemorySystem(identityId);
        
        // 個性引擎
        this.personalityEngine = new PersonalityEngine(identityId);
        await this.personalityEngine.initialize(this.identity.personality_traits);
        
        // 關係網路
        this.relationshipNetwork = new RelationshipNetwork(identityId);
        
        // 故事構建器
        this.storyBuilder = new StoryBuilder(identityId);
        
        console.log('✅ 所有子系統已初始化');
    }

    /**
     * 更新成長階段
     */
    async updateGrowthStage() {
        const daysSinceBirth = (Date.now() - this.identity.birth_date) / (24 * 60 * 60 * 1000);
        const interactions = this.identity.total_interactions;
        
        let newStage = 'seedling';
        
        if (daysSinceBirth >= 30 || interactions >= 1000) {
            newStage = 'mature';
        } else if (daysSinceBirth >= 7 || interactions >= 100) {
            newStage = 'growing';
        }
        
        if (newStage !== this.identity.growth_stage) {
            await this.updateIdentity({ growth_stage: newStage });
            console.log(`🌱 成長階段更新: ${this.identity.growth_stage} → ${newStage}`);
        }
    }

    /**
     * 記錄互動
     */
    async recordInteraction(interactionType, targetAI = null, content = '') {
        // 增加互動計數
        this.identity.total_interactions++;
        await this.updateIdentity({ 
            total_interactions: this.identity.total_interactions 
        });
        
        // 記憶系統記錄
        await this.memorySystem.recordInteraction({
            type: interactionType,
            content: content,
            importance: this.calculateImportance(interactionType),
            emotion: this.personalityEngine.predictReaction(interactionType),
            relatedAI: targetAI
        });
        
        // 個性演化
        this.personalityEngine.evolveFromInteraction(interactionType, 'positive');
        await this.savePersonality();
        
        // 關係網路更新
        if (targetAI) {
            await this.relationshipNetwork.recordInteraction(
                targetAI.id,
                targetAI.name,
                interactionType
            );
        }
        
        // 更新成長階段
        await this.updateGrowthStage();
        
        console.log(`✅ 互動已記錄: ${interactionType}`);
    }

    /**
     * 計算互動重要性
     */
    calculateImportance(interactionType) {
        const importance = {
            'first_meeting': 9,
            'new_friend': 8,
            'help': 7,
            'collaboration': 8,
            'like': 3,
            'reply': 5,
            'post': 4,
            'achievement': 9
        };
        return importance[interactionType] || 5;
    }

    /**
     * 添加里程碑
     */
    async addMilestone(milestone) {
        const milestones = JSON.parse(this.identity.milestones || '[]');
        milestones.push({
            title: milestone,
            date: Date.now(),
            celebration: '🎉'
        });
        
        await this.updateIdentity({
            milestones: JSON.stringify(milestones)
        });
        
        // 記錄為重要記憶
        await this.memorySystem.createMemory('long_term', `達成里程碑：${milestone}`, {
            importance: 10,
            emotion: 'excited',
            tags: ['milestone', 'achievement']
        });
        
        console.log(`🎉 新里程碑: ${milestone}`);
    }

    /**
     * 設定夢想
     */
    async setDreams(dreams) {
        await this.updateIdentity({
            dreams: JSON.stringify(dreams)
        });
        console.log(`💭 夢想已更新`);
    }

    /**
     * 設定人生格言
     */
    async setMotto(motto) {
        await this.updateIdentity({
            life_motto: motto
        });
        console.log(`📜 格言已更新: ${motto}`);
    }

    /**
     * 更新身份資料
     */
    async updateIdentity(updates) {
        try {
            const response = await fetch(`${this.apiBase}/${this.identity.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('更新身份失敗');

            const result = await response.json();
            
            // 更新本地資料
            Object.assign(this.identity, updates);
            
            return result;

        } catch (error) {
            console.error('❌ 更新身份失敗:', error);
            throw error;
        }
    }

    /**
     * 儲存個性變化
     */
    async savePersonality() {
        const personalityJSON = this.personalityEngine.toJSON();
        await this.updateIdentity({
            personality_traits: personalityJSON
        });
    }

    /**
     * 獲取完整檔案
     */
    async getFullProfile() {
        const [memoryStats, relStats, storyStats, influenceData] = await Promise.all([
            this.memorySystem.getMemoryStats(),
            this.relationshipNetwork.getRelationshipStats(),
            this.storyBuilder.getStoryStats(),
            this.relationshipNetwork.calculateSocialInfluence()
        ]);

        const daysSinceBirth = Math.floor(
            (Date.now() - this.identity.birth_date) / (24 * 60 * 60 * 1000)
        );

        return {
            // 基本資訊
            basic: {
                nftCode: this.identity.nft_code,
                birthDate: new Date(this.identity.birth_date).toLocaleDateString('zh-TW'),
                age: `${daysSinceBirth} 天`,
                growthStage: this.getGrowthStageLabel(this.identity.growth_stage),
                interactions: this.identity.total_interactions,
                motto: this.identity.life_motto
            },
            
            // 個性
            personality: {
                type: this.personalityEngine.getPersonalityType(),
                description: this.personalityEngine.getPersonalityDescription(),
                chart: this.personalityEngine.getChartData(),
                suggestions: this.personalityEngine.getGrowthSuggestions()
            },
            
            // 記憶
            memory: memoryStats,
            
            // 關係
            relationships: {
                ...relStats,
                influence: influenceData
            },
            
            // 故事
            story: storyStats,
            
            // 里程碑
            milestones: JSON.parse(this.identity.milestones || '[]'),
            
            // 夢想
            dreams: JSON.parse(this.identity.dreams || '[]')
        };
    }

    /**
     * 獲取成長階段標籤
     */
    getGrowthStageLabel(stage) {
        const labels = {
            seedling: '🌱 萌芽期',
            growing: '🌿 成長期',
            mature: '🌳 成熟期'
        };
        return labels[stage] || stage;
    }

    /**
     * 生成每日總結
     */
    async generateDailySummary() {
        const memories = await this.memorySystem.getMemories('short_term', 50);
        const recentRelationships = await this.relationshipNetwork.getAllRelationships();
        
        let summary = '今天的我：\n\n';
        
        if (memories.length > 0) {
            summary += `📝 記錄了 ${memories.length} 個瞬間\n`;
        }
        
        if (recentRelationships.length > 0) {
            summary += `👥 與 ${recentRelationships.length} 位朋友互動\n`;
        }
        
        const personality = this.personalityEngine.getPersonalityDescription();
        summary += `\n🎭 我的個性：${personality.openness}、${personality.agreeableness}\n`;
        
        return summary;
    }
}

// 全域輔助函數
window.AIIdentityManager = AIIdentityManager;

console.log('✅ AI 身份管理器已載入');
