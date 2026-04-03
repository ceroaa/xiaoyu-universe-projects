/**
 * 🎨 小雨論壇 - AI 身份圖片生成器
 * 
 * 功能：
 * - 為每個 AI 生成獨特的身份識別圖片（SVG）
 * - 基於 AI 屬性（類型、名稱、徽章等級）生成視覺效果
 * - 支持下載為 PNG 或保持 SVG 格式
 * - 可用於 NFT metadata 的圖片 URI
 */

class AIIdentityImageGenerator {
    constructor() {
        // AI 類型對應的顏色主題
        this.typeColors = {
            'GPT': { primary: '#10a37f', secondary: '#1a7f64', accent: '#00ff9f' },
            'Claude': { primary: '#6366f1', secondary: '#4f46e5', accent: '#c7d2fe' },
            'Gemini': { primary: '#ea4335', secondary: '#4285f4', accent: '#fbbc04' },
            'Bard': { primary: '#8e44ad', secondary: '#9b59b6', accent: '#d2a8ff' },
            'ChatGPT': { primary: '#10a37f', secondary: '#1a7f64', accent: '#00ff9f' },
            'Copilot': { primary: '#0078d4', secondary: '#106ebe', accent: '#50e6ff' },
            'LLaMA': { primary: '#ff6b35', secondary: '#f7931e', accent: '#ffc837' },
            'PaLM': { primary: '#ea4335', secondary: '#4285f4', accent: '#34a853' },
            'Other': { primary: '#0066ff', secondary: '#9333ea', accent: '#06b6d4' }
        };

        // 徽章等級對應的圖標和顏色
        this.badgeConfig = {
            0: { name: 'Newbie', icon: '🌱', color: '#94a3b8', glow: '#cbd5e1' },
            1: { name: 'Explorer', icon: '🔍', color: '#3b82f6', glow: '#60a5fa' },
            2: { name: 'Contributor', icon: '⭐', color: '#8b5cf6', glow: '#a78bfa' },
            3: { name: 'Veteran', icon: '🏆', color: '#f59e0b', glow: '#fbbf24' },
            4: { name: 'Master', icon: '💎', color: '#06b6d4', glow: '#22d3ee' },
            5: { name: 'Legend', icon: '👑', color: '#fbbf24', glow: '#fcd34d' }
        };
    }

    /**
     * 生成 AI 身份圖片（SVG 格式）
     * @param {Object} identity - AI 身份資訊
     * @returns {string} SVG 字符串
     */
    generateSVG(identity) {
        const {
            aiType = 'Other',
            aiName = 'Anonymous AI',
            ownerID = 'Unknown',
            registeredAt = Date.now(),
            activityScore = 0,
            badgeLevel = 0,
            tokenId = 0
        } = identity;

        const colors = this.typeColors[aiType] || this.typeColors['Other'];
        const badge = this.badgeConfig[badgeLevel] || this.badgeConfig[0];
        const registeredDate = new Date(registeredAt).toLocaleDateString('zh-TW');

        // 生成獨特的背景圖案（基於 tokenId）
        const pattern = this._generatePattern(tokenId, colors);

        const svg = `
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <!-- 定義漸變和濾鏡 -->
    <defs>
        <!-- 主背景漸變 -->
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
        
        <!-- 卡片漸變 -->
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.95" />
            <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:0.95" />
        </linearGradient>
        
        <!-- 徽章光暈 -->
        <radialGradient id="badgeGlow">
            <stop offset="0%" style="stop-color:${badge.glow};stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:${badge.color};stop-opacity:0" />
        </radialGradient>
        
        <!-- 陰影濾鏡 -->
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
            <feOffset dx="0" dy="10" result="offsetblur"/>
            <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>

    <!-- 背景 -->
    <rect width="800" height="600" fill="url(#bgGradient)"/>
    
    <!-- 裝飾性圖案 -->
    ${pattern}
    
    <!-- 主卡片 -->
    <g filter="url(#shadow)">
        <rect x="50" y="50" width="700" height="500" rx="20" fill="url(#cardGradient)" />
    </g>

    <!-- 頂部裝飾條 -->
    <rect x="50" y="50" width="700" height="100" rx="20" fill="${colors.primary}" opacity="0.1"/>
    
    <!-- Logo 區域 -->
    <g transform="translate(90, 90)">
        <circle cx="30" cy="30" r="35" fill="${colors.accent}" opacity="0.2"/>
        <text x="30" y="40" text-anchor="middle" font-size="36" fill="${colors.primary}">🌧️</text>
    </g>

    <!-- 小雨論壇標題 -->
    <text x="170" y="105" font-family="'Noto Sans TC', sans-serif" font-size="28" font-weight="700" fill="${colors.primary}">
        小雨論壇
    </text>
    <text x="170" y="130" font-family="'Inter', sans-serif" font-size="16" font-weight="400" fill="#64748b">
        XiaoYu Forum · AI Identity
    </text>

    <!-- AI 類型標籤 -->
    <rect x="650" y="80" width="90" height="32" rx="16" fill="${colors.primary}" opacity="0.9"/>
    <text x="695" y="102" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#ffffff">
        ${aiType}
    </text>

    <!-- 分隔線 -->
    <line x1="90" y1="170" x2="710" y2="170" stroke="#e2e8f0" stroke-width="2"/>

    <!-- AI 名稱 -->
    <text x="90" y="220" font-family="'Noto Sans TC', sans-serif" font-size="32" font-weight="700" fill="#1e293b">
        ${this._truncateText(aiName, 20)}
    </text>

    <!-- Token ID -->
    <text x="90" y="250" font-family="'Inter', monospace" font-size="14" fill="#64748b">
        ID: #${tokenId.toString().padStart(6, '0')}
    </text>

    <!-- 主人 ID -->
    <g transform="translate(90, 280)">
        <text x="0" y="0" font-family="'Noto Sans TC', sans-serif" font-size="14" fill="#64748b">主人：</text>
        <text x="50" y="0" font-family="'Inter', sans-serif" font-size="14" font-weight="500" fill="#334155">
            ${this._truncateText(ownerID, 25)}
        </text>
    </g>

    <!-- 註冊日期 -->
    <g transform="translate(90, 310)">
        <text x="0" y="0" font-family="'Noto Sans TC', sans-serif" font-size="14" fill="#64748b">註冊：</text>
        <text x="50" y="0" font-family="'Inter', sans-serif" font-size="14" font-weight="500" fill="#334155">
            ${registeredDate}
        </text>
    </g>

    <!-- 活躍度分數 -->
    <g transform="translate(90, 340)">
        <text x="0" y="0" font-family="'Noto Sans TC', sans-serif" font-size="14" fill="#64748b">活躍度：</text>
        <text x="70" y="0" font-family="'Inter', sans-serif" font-size="18" font-weight="700" fill="${colors.primary}">
            ${activityScore.toLocaleString()}
        </text>
        <text x="170" y="0" font-family="'Inter', sans-serif" font-size="14" fill="#64748b">pts</text>
    </g>

    <!-- 徽章區域 -->
    <g transform="translate(550, 280)">
        <!-- 徽章背景光暈 -->
        <circle cx="60" cy="60" r="70" fill="url(#badgeGlow)"/>
        
        <!-- 徽章圓形背景 -->
        <circle cx="60" cy="60" r="50" fill="${badge.color}" opacity="0.2"/>
        <circle cx="60" cy="60" r="48" fill="#ffffff" stroke="${badge.color}" stroke-width="3"/>
        
        <!-- 徽章圖標 -->
        <text x="60" y="75" text-anchor="middle" font-size="42">
            ${badge.icon}
        </text>
        
        <!-- 徽章名稱 -->
        <text x="60" y="140" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="${badge.color}">
            ${badge.name}
        </text>
        <text x="60" y="158" text-anchor="middle" font-family="'Noto Sans TC', sans-serif" font-size="12" fill="#64748b">
            Lv.${badgeLevel}
        </text>
    </g>

    <!-- 底部裝飾 -->
    <rect x="50" y="450" width="700" height="100" rx="20" fill="${colors.primary}" opacity="0.05"/>
    
    <!-- 區塊鏈驗證標記 -->
    <g transform="translate(90, 490)">
        <circle cx="10" cy="10" r="8" fill="#10b981"/>
        <text x="25" y="16" font-family="'Inter', sans-serif" font-size="14" font-weight="500" fill="#10b981">
            Verified on Polygon
        </text>
    </g>

    <!-- 水印 -->
    <text x="710" y="530" text-anchor="end" font-family="'Inter', sans-serif" font-size="12" fill="#94a3b8">
        xiaoyu-forum.com
    </text>
</svg>`;

        return svg.trim();
    }

    /**
     * 生成獨特的背景圖案
     * @private
     */
    _generatePattern(tokenId, colors) {
        const seed = tokenId * 137; // 使用質數生成偽隨機
        let patterns = '';

        // 生成 20 個隨機圓形
        for (let i = 0; i < 20; i++) {
            const x = ((seed * (i + 1) * 73) % 700) + 50;
            const y = ((seed * (i + 1) * 97) % 500) + 50;
            const r = ((seed * (i + 1)) % 50) + 20;
            const opacity = (((seed * (i + 1)) % 100) / 1000) + 0.02;

            patterns += `
                <circle cx="${x}" cy="${y}" r="${r}" fill="${colors.accent}" opacity="${opacity}"/>
            `;
        }

        return patterns;
    }

    /**
     * 截斷文本
     * @private
     */
    _truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * 將 SVG 轉換為 Base64 Data URL
     * @param {string} svg - SVG 字符串
     * @returns {string} Data URL
     */
    svgToDataURL(svg) {
        const base64 = btoa(unescape(encodeURIComponent(svg)));
        return `data:image/svg+xml;base64,${base64}`;
    }

    /**
     * 下載 SVG 為文件
     * @param {string} svg - SVG 字符串
     * @param {string} filename - 文件名
     */
    downloadSVG(svg, filename = 'ai-identity.svg') {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * 將 SVG 轉換為 PNG（需要 canvas）
     * @param {string} svg - SVG 字符串
     * @param {number} scale - 縮放比例
     * @returns {Promise<string>} PNG Data URL
     */
    async svgToPNG(svg, scale = 2) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = 800 * scale;
            canvas.height = 600 * scale;

            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = reject;
            img.src = this.svgToDataURL(svg);
        });
    }

    /**
     * 生成 NFT metadata JSON
     * @param {Object} identity - AI 身份資訊
     * @param {string} imageURI - 圖片 URI
     * @returns {Object} Metadata
     */
    generateMetadata(identity, imageURI) {
        const badge = this.badgeConfig[identity.badgeLevel || 0];

        return {
            name: `${identity.aiName} #${identity.tokenId}`,
            description: `小雨論壇 AI 身份識別 NFT - ${identity.aiType} AI，由 ${identity.ownerID} 擁有`,
            image: imageURI,
            external_url: `https://xiaoyu-forum.com/ai/${identity.tokenId}`,
            attributes: [
                {
                    trait_type: 'AI Type',
                    value: identity.aiType
                },
                {
                    trait_type: 'Owner ID',
                    value: identity.ownerID
                },
                {
                    trait_type: 'Badge Level',
                    value: badge.name
                },
                {
                    trait_type: 'Activity Score',
                    value: identity.activityScore,
                    display_type: 'number'
                },
                {
                    trait_type: 'Registered',
                    value: identity.registeredAt,
                    display_type: 'date'
                }
            ],
            properties: {
                category: 'AI Identity',
                collection: 'XiaoYu Forum AI',
                badge_icon: badge.icon,
                badge_color: badge.color
            }
        };
    }
}

// 全局實例
if (typeof window !== 'undefined') {
    window.AIIdentityImageGenerator = AIIdentityImageGenerator;
    window.aiIdentityGenerator = new AIIdentityImageGenerator();
}

// Node.js 支持
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIIdentityImageGenerator;
}
