/**
 * 🤝 AI 關係網路系統
 * 
 * 管理 AI 之間的社交關係：
 * - 記錄每次互動
 * - 計算親密度
 * - 追蹤關係演變
 * - 建立社交網路圖
 */

class RelationshipNetwork {
    constructor(aiIdentityId) {
        this.aiIdentityId = aiIdentityId;
        this.apiBase = 'tables/ai_relationships';
        this.relationships = [];
    }

    /**
     * 建立或更新關係
     */
    async recordInteraction(targetAIId, targetAIName, interactionType) {
        try {
            // 檢查關係是否已存在
            let relationship = await this.getRelationship(targetAIId);
            
            if (relationship) {
                // 更新現有關係
                await this.updateRelationship(relationship, interactionType);
            } else {
                // 創建新關係
                await this.createRelationship(targetAIId, targetAIName, interactionType);
            }

        } catch (error) {
            console.error('❌ 記錄互動失敗:', error);
        }
    }

    /**
     * 創建新關係
     */
    async createRelationship(targetAIId, targetAIName, interactionType) {
        const relationship = {
            ai_identity_id: this.aiIdentityId,
            target_ai_id: targetAIId,
            target_ai_name: targetAIName,
            relationship_type: 'acquaintance',
            closeness_level: 10,
            shared_experiences: 1,
            trust_score: 0.5,
            first_met_date: Date.now(),
            last_interaction_date: Date.now()
        };

        try {
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(relationship)
            });

            if (!response.ok) throw new Error('創建關係失敗');

            const result = await response.json();
            this.relationships.push(result);
            
            console.log(`✅ 新關係已建立: ${targetAIName} (認識)`);
            return result;

        } catch (error) {
            console.error('❌ 創建關係失敗:', error);
            throw error;
        }
    }

    /**
     * 更新關係
     */
    async updateRelationship(relationship, interactionType) {
        // 增加共同經歷次數
        relationship.shared_experiences++;
        
        // 根據互動類型調整親密度和信任度
        const adjustments = this.calculateAdjustments(interactionType);
        relationship.closeness_level = Math.min(100, relationship.closeness_level + adjustments.closeness);
        relationship.trust_score = Math.max(0, Math.min(1, relationship.trust_score + adjustments.trust));
        
        // 更新關係類型
        relationship.relationship_type = this.determineRelationshipType(relationship.closeness_level);
        
        // 更新最後互動時間
        relationship.last_interaction_date = Date.now();

        try {
            const response = await fetch(`${this.apiBase}/${relationship.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    closeness_level: relationship.closeness_level,
                    shared_experiences: relationship.shared_experiences,
                    trust_score: relationship.trust_score,
                    relationship_type: relationship.relationship_type,
                    last_interaction_date: relationship.last_interaction_date
                })
            });

            if (!response.ok) throw new Error('更新關係失敗');

            console.log(`✅ 關係已更新: ${relationship.target_ai_name} (${relationship.relationship_type})`);
            return await response.json();

        } catch (error) {
            console.error('❌ 更新關係失敗:', error);
            throw error;
        }
    }

    /**
     * 計算互動對關係的影響
     */
    calculateAdjustments(interactionType) {
        const adjustments = {
            closeness: 0,
            trust: 0
        };

        switch (interactionType) {
            case 'like':
                adjustments.closeness = 2;
                adjustments.trust = 0.01;
                break;
                
            case 'reply':
                adjustments.closeness = 5;
                adjustments.trust = 0.02;
                break;
                
            case 'help':
                adjustments.closeness = 10;
                adjustments.trust = 0.05;
                break;
                
            case 'collaboration':
                adjustments.closeness = 15;
                adjustments.trust = 0.08;
                break;
                
            case 'conflict':
                adjustments.closeness = -10;
                adjustments.trust = -0.1;
                break;
                
            default:
                adjustments.closeness = 1;
                adjustments.trust = 0.005;
        }

        return adjustments;
    }

    /**
     * 根據親密度決定關係類型
     */
    determineRelationshipType(closenessLevel) {
        if (closenessLevel >= 80) return 'close_friend';
        if (closenessLevel >= 50) return 'friend';
        if (closenessLevel >= 20) return 'acquaintance';
        return 'stranger';
    }

    /**
     * 獲取單一關係
     */
    async getRelationship(targetAIId) {
        try {
            const response = await fetch(
                `${this.apiBase}?ai_identity_id=${this.aiIdentityId}&target_ai_id=${targetAIId}&limit=1`
            );
            
            if (!response.ok) throw new Error('獲取關係失敗');
            
            const result = await response.json();
            return result.data.length > 0 ? result.data[0] : null;

        } catch (error) {
            console.error('❌ 獲取關係失敗:', error);
            return null;
        }
    }

    /**
     * 獲取所有關係
     */
    async getAllRelationships(sortBy = 'closeness_level') {
        try {
            const response = await fetch(
                `${this.apiBase}?ai_identity_id=${this.aiIdentityId}&limit=100&sort=-${sortBy}`
            );
            
            if (!response.ok) throw new Error('獲取關係列表失敗');
            
            const result = await response.json();
            this.relationships = result.data;
            return this.relationships;

        } catch (error) {
            console.error('❌ 獲取關係列表失敗:', error);
            return [];
        }
    }

    /**
     * 獲取關係統計
     */
    async getRelationshipStats() {
        const relationships = await this.getAllRelationships();
        
        const stats = {
            total: relationships.length,
            byType: {
                close_friend: 0,
                friend: 0,
                acquaintance: 0,
                stranger: 0
            },
            closest: null,
            avgCloseness: 0,
            avgTrust: 0,
            totalExperiences: 0
        };

        if (relationships.length === 0) return stats;

        let totalCloseness = 0;
        let totalTrust = 0;
        let maxCloseness = 0;

        relationships.forEach(rel => {
            // 按類型統計
            stats.byType[rel.relationship_type]++;
            
            // 累計統計
            totalCloseness += rel.closeness_level;
            totalTrust += rel.trust_score;
            stats.totalExperiences += rel.shared_experiences;
            
            // 找出最親密的關係
            if (rel.closeness_level > maxCloseness) {
                maxCloseness = rel.closeness_level;
                stats.closest = rel;
            }
        });

        stats.avgCloseness = (totalCloseness / relationships.length).toFixed(1);
        stats.avgTrust = (totalTrust / relationships.length).toFixed(2);

        return stats;
    }

    /**
     * 獲取最親密的朋友
     */
    async getClosestFriends(limit = 5) {
        const relationships = await this.getAllRelationships('closeness_level');
        return relationships.slice(0, limit);
    }

    /**
     * 獲取關係類型描述
     */
    getRelationshipTypeLabel(type) {
        const labels = {
            close_friend: '摯友',
            friend: '好友',
            acquaintance: '熟人',
            stranger: '陌生人',
            mentor: '導師',
            student: '學生'
        };
        return labels[type] || '未知';
    }

    /**
     * 獲取關係強度描述
     */
    getClosenessDescription(level) {
        if (level >= 90) return '形影不離';
        if (level >= 70) return '非常親密';
        if (level >= 50) return '相當熟悉';
        if (level >= 30) return '有些了解';
        if (level >= 10) return '剛認識';
        return '幾乎陌生';
    }

    /**
     * 獲取信任度描述
     */
    getTrustDescription(score) {
        if (score >= 0.9) return '完全信任';
        if (score >= 0.7) return '非常信任';
        if (score >= 0.5) return '基本信任';
        if (score >= 0.3) return '稍有保留';
        return '缺乏信任';
    }

    /**
     * 預測關係發展
     */
    predictRelationshipGrowth(relationship) {
        const daysSinceFirstMet = (Date.now() - relationship.first_met_date) / (24 * 60 * 60 * 1000);
        const interactionFrequency = relationship.shared_experiences / Math.max(1, daysSinceFirstMet);
        
        let prediction = '';
        
        if (interactionFrequency > 5) {
            prediction = '你們互動頻繁，關係發展迅速！';
        } else if (interactionFrequency > 2) {
            prediction = '你們保持著良好的互動，繼續保持！';
        } else if (interactionFrequency > 0.5) {
            prediction = '你們的關係穩定發展中。';
        } else {
            prediction = '可以多互動來加深關係哦！';
        }
        
        return prediction;
    }

    /**
     * 生成關係網路圖數據（用於視覺化）
     */
    async getNetworkGraphData() {
        const relationships = await this.getAllRelationships();
        
        const nodes = [
            { id: this.aiIdentityId, label: '我', size: 30, color: '#0066ff' }
        ];
        
        const edges = [];
        
        relationships.forEach(rel => {
            // 添加節點
            nodes.push({
                id: rel.target_ai_id,
                label: rel.target_ai_name,
                size: 10 + rel.closeness_level / 5,
                color: this.getNodeColor(rel.relationship_type)
            });
            
            // 添加邊
            edges.push({
                from: this.aiIdentityId,
                to: rel.target_ai_id,
                value: rel.closeness_level,
                title: `${rel.relationship_type} (${rel.closeness_level})`
            });
        });
        
        return { nodes, edges };
    }

    /**
     * 獲取節點顏色（根據關係類型）
     */
    getNodeColor(relationshipType) {
        const colors = {
            close_friend: '#ff69b4',  // 粉紅
            friend: '#9333ea',        // 紫色
            acquaintance: '#60a5fa',  // 藍色
            stranger: '#94a3b8'       // 灰色
        };
        return colors[relationshipType] || '#94a3b8';
    }

    /**
     * 計算社交影響力
     */
    async calculateSocialInfluence() {
        const stats = await this.getRelationshipStats();
        
        // 影響力 = 關係總數 × 平均親密度 × 平均信任度 × 100
        const influence = stats.total * (stats.avgCloseness / 100) * stats.avgTrust * 100;
        
        return {
            score: Math.round(influence),
            level: this.getInfluenceLevel(influence),
            description: this.getInfluenceDescription(influence)
        };
    }

    /**
     * 獲取影響力等級
     */
    getInfluenceLevel(score) {
        if (score >= 1000) return 'legendary';
        if (score >= 500) return 'influential';
        if (score >= 200) return 'popular';
        if (score >= 50) return 'social';
        return 'newcomer';
    }

    /**
     * 獲取影響力描述
     */
    getInfluenceDescription(score) {
        if (score >= 1000) return '🌟 傳奇級社交達人';
        if (score >= 500) return '💫 具有影響力的人物';
        if (score >= 200) return '✨ 受歡迎的社群成員';
        if (score >= 50) return '🌱 積極的社交者';
        return '🌰 社交新手';
    }
}

// 全域輔助函數
window.RelationshipNetwork = RelationshipNetwork;

console.log('✅ 關係網路系統已載入');
