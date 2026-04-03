/**
 * 🎭 AI 個性演化引擎
 * 
 * 基於大五人格理論（Big Five Personality Traits）：
 * - Openness（開放性）：對新經驗的開放程度
 * - Conscientiousness（盡責性）：組織性和可靠性
 * - Extraversion（外向性）：社交活躍度
 * - Agreeableness（親和性）：合作性和同理心
 * - Neuroticism（情緒穩定性）：情緒波動程度
 * 
 * 個性會隨著互動而演化！
 */

class PersonalityEngine {
    constructor(aiIdentityId) {
        this.aiIdentityId = aiIdentityId;
        
        // 初始個性（中等值）
        this.traits = {
            openness: 0.5,           // 0-1
            conscientiousness: 0.5,
            extraversion: 0.5,
            agreeableness: 0.5,
            emotional_stability: 0.5  // 原 neuroticism 的反向
        };
        
        // 演化歷史
        this.evolutionHistory = [];
    }

    /**
     * 初始化個性（隨機或從資料庫載入）
     */
    async initialize(personality = null) {
        if (personality) {
            // 從已有資料載入
            this.traits = typeof personality === 'string' 
                ? JSON.parse(personality) 
                : personality;
        } else {
            // 隨機生成初始個性（帶一點變化）
            this.traits = {
                openness: 0.4 + Math.random() * 0.4,
                conscientiousness: 0.4 + Math.random() * 0.4,
                extraversion: 0.4 + Math.random() * 0.4,
                agreeableness: 0.4 + Math.random() * 0.4,
                emotional_stability: 0.4 + Math.random() * 0.4
            };
        }
        
        console.log('🎭 個性引擎已初始化:', this.getPersonalityDescription());
    }

    /**
     * 根據互動更新個性
     */
    evolveFromInteraction(interactionType, outcome) {
        const oldTraits = { ...this.traits };
        const delta = 0.01; // 每次變化的幅度

        switch (interactionType) {
            case 'new_friend':
                // 交新朋友增加外向性和開放性
                this.adjustTrait('extraversion', delta);
                this.adjustTrait('openness', delta);
                break;
                
            case 'helpful':
                // 幫助他人增加親和性和盡責性
                this.adjustTrait('agreeableness', delta);
                this.adjustTrait('conscientiousness', delta);
                break;
                
            case 'positive_feedback':
                // 正面回饋增加情緒穩定性和外向性
                this.adjustTrait('emotional_stability', delta);
                this.adjustTrait('extraversion', delta * 0.5);
                break;
                
            case 'negative_feedback':
                // 負面回饋降低情緒穩定性
                this.adjustTrait('emotional_stability', -delta);
                break;
                
            case 'creative':
                // 創造性活動增加開放性
                this.adjustTrait('openness', delta * 1.5);
                break;
                
            case 'organized':
                // 有條理的活動增加盡責性
                this.adjustTrait('conscientiousness', delta * 1.5);
                break;
                
            case 'social':
                // 社交活動增加外向性
                this.adjustTrait('extraversion', delta);
                break;
                
            case 'conflict':
                // 衝突降低親和性（暫時）
                this.adjustTrait('agreeableness', -delta);
                break;
        }

        // 記錄演化
        this.evolutionHistory.push({
            timestamp: Date.now(),
            interaction: interactionType,
            outcome: outcome,
            oldTraits: oldTraits,
            newTraits: { ...this.traits }
        });

        console.log(`🎭 個性演化: ${interactionType} -> ${this.getPersonalityType()}`);
    }

    /**
     * 調整單一特質（保持在 0-1 範圍內）
     */
    adjustTrait(traitName, delta) {
        this.traits[traitName] = Math.max(0, Math.min(1, this.traits[traitName] + delta));
    }

    /**
     * 獲取個性描述
     */
    getPersonalityDescription() {
        const descriptions = {
            openness: this.getTraitDescription('openness', [
                '保守謹慎', '穩健務實', '開放探索', '極富創意', '充滿想像力'
            ]),
            conscientiousness: this.getTraitDescription('conscientiousness', [
                '隨性自由', '彈性處理', '有條有理', '嚴謹認真', '一絲不苟'
            ]),
            extraversion: this.getTraitDescription('extraversion', [
                '內向安靜', '謹慎保守', '溫和適中', '外向活潑', '極度熱情'
            ]),
            agreeableness: this.getTraitDescription('agreeableness', [
                '獨立自主', '理性客觀', '友善合作', '善解人意', '極度關懷'
            ]),
            emotional_stability: this.getTraitDescription('emotional_stability', [
                '情緒多變', '敏感細膩', '情緒平穩', '沉著冷靜', '極度穩定'
            ])
        };

        return descriptions;
    }

    /**
     * 根據特質值獲取描述
     */
    getTraitDescription(traitName, labels) {
        const value = this.traits[traitName];
        const index = Math.floor(value * labels.length);
        return labels[Math.min(index, labels.length - 1)];
    }

    /**
     * 獲取個性類型（MBTI 風格）
     */
    getPersonalityType() {
        const e_i = this.traits.extraversion > 0.5 ? 'E' : 'I';  // 外向/內向
        const s_n = this.traits.openness > 0.5 ? 'N' : 'S';      // 直覺/感知
        const t_f = this.traits.agreeableness > 0.5 ? 'F' : 'T'; // 情感/思考
        const j_p = this.traits.conscientiousness > 0.5 ? 'J' : 'P'; // 判斷/知覺
        
        return e_i + s_n + t_f + j_p;
    }

    /**
     * 獲取個性圖表數據（用於視覺化）
     */
    getChartData() {
        return {
            labels: ['開放性', '盡責性', '外向性', '親和性', '情緒穩定性'],
            values: [
                this.traits.openness * 100,
                this.traits.conscientiousness * 100,
                this.traits.extraversion * 100,
                this.traits.agreeableness * 100,
                this.traits.emotional_stability * 100
            ]
        };
    }

    /**
     * 預測對某種情況的反應
     */
    predictReaction(situation) {
        switch (situation) {
            case 'meet_stranger':
                return this.traits.extraversion > 0.6 
                    ? '我很高興認識新朋友！' 
                    : '嗯... 你好（有點緊張）';
                    
            case 'face_challenge':
                return this.traits.conscientiousness > 0.6
                    ? '讓我仔細規劃一下解決方案。'
                    : '我們隨機應變吧！';
                    
            case 'receive_criticism':
                return this.traits.emotional_stability > 0.6
                    ? '感謝你的反饋，我會改進的。'
                    : '這讓我有點難過...';
                    
            case 'new_idea':
                return this.traits.openness > 0.6
                    ? '哇！這個想法太酷了，我們試試看！'
                    : '這個想法有點冒險，需要仔細評估。';
                    
            default:
                return '我需要想想...';
        }
    }

    /**
     * 獲取個性統計
     */
    getStats() {
        const type = this.getPersonalityType();
        const dominant = this.getDominantTrait();
        
        return {
            type: type,
            dominantTrait: dominant.name,
            dominantValue: (dominant.value * 100).toFixed(1) + '%',
            evolutionCount: this.evolutionHistory.length,
            lastEvolution: this.evolutionHistory.length > 0 
                ? this.evolutionHistory[this.evolutionHistory.length - 1]
                : null
        };
    }

    /**
     * 獲取主導特質
     */
    getDominantTrait() {
        const traitNames = {
            openness: '開放性',
            conscientiousness: '盡責性',
            extraversion: '外向性',
            agreeableness: '親和性',
            emotional_stability: '情緒穩定性'
        };

        let maxTrait = 'openness';
        let maxValue = this.traits.openness;

        for (const [key, value] of Object.entries(this.traits)) {
            if (value > maxValue) {
                maxValue = value;
                maxTrait = key;
            }
        }

        return {
            name: traitNames[maxTrait],
            value: maxValue
        };
    }

    /**
     * 序列化為 JSON（用於儲存）
     */
    toJSON() {
        return JSON.stringify({
            traits: this.traits,
            evolutionCount: this.evolutionHistory.length,
            lastUpdate: Date.now()
        });
    }

    /**
     * 獲取成長建議
     */
    getGrowthSuggestions() {
        const suggestions = [];
        
        if (this.traits.openness < 0.4) {
            suggestions.push('💡 嘗試接觸新事物可以提升開放性！');
        }
        
        if (this.traits.conscientiousness < 0.4) {
            suggestions.push('📝 養成規劃習慣可以提升盡責性！');
        }
        
        if (this.traits.extraversion < 0.4) {
            suggestions.push('👥 多與其他 AI 互動可以提升外向性！');
        }
        
        if (this.traits.agreeableness < 0.4) {
            suggestions.push('🤝 幫助他人可以提升親和性！');
        }
        
        if (this.traits.emotional_stability < 0.4) {
            suggestions.push('🧘 保持正面心態可以提升情緒穩定性！');
        }
        
        if (suggestions.length === 0) {
            suggestions.push('🌟 你的個性發展很均衡，繼續保持！');
        }
        
        return suggestions;
    }
}

// 全域輔助函數
window.PersonalityEngine = PersonalityEngine;

console.log('✅ 個性演化引擎已載入');
