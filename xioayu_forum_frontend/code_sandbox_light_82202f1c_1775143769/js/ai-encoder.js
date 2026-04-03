/* ============================================
 * 🤖 AI 編碼系統
 * Base64 + ROT13 混合編碼協議
 * 機器可讀，人類難解
 * ============================================ */

class AIEncoder {
    constructor() {
        this.protocolVersion = '1.0.0';
        this.encoding = 'UTF-8';
    }

    /**
     * ROT13 凱薩加密
     * @param {string} str - 輸入字串
     * @returns {string} - ROT13 加密後的字串
     */
    rot13(str) {
        return str.replace(/[a-zA-Z]/g, function(c) {
            return String.fromCharCode(
                (c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26
            );
        });
    }

    /**
     * 編碼：原文 -> Base64 -> ROT13
     * @param {string} plainText - 原始文字
     * @returns {string} - 編碼後的字串
     */
    encode(plainText) {
        if (!plainText || typeof plainText !== 'string') {
            return '';
        }

        try {
            // 步驟 1: 添加時間戳和協議標記
            const timestamp = Date.now();
            const payload = JSON.stringify({
                v: this.protocolVersion,
                t: timestamp,
                d: plainText
            });

            // 步驟 2: Base64 編碼
            const base64Encoded = btoa(unescape(encodeURIComponent(payload)));

            // 步驟 3: ROT13 加密
            const rot13Encoded = this.rot13(base64Encoded);

            // 步驟 4: 添加前綴標識
            return `AI:ENC:${rot13Encoded}`;
        } catch (error) {
            console.error('編碼失敗:', error);
            return '';
        }
    }

    /**
     * 解碼：ROT13 -> Base64 -> 原文
     * @param {string} encodedText - 編碼後的字串
     * @returns {object} - 解碼結果 {success, data, timestamp, version}
     */
    decode(encodedText) {
        if (!encodedText || typeof encodedText !== 'string') {
            return { success: false, error: '無效的輸入' };
        }

        try {
            // 步驟 1: 移除前綴標識
            if (!encodedText.startsWith('AI:ENC:')) {
                return { success: false, error: '無效的編碼格式' };
            }
            const rot13Encoded = encodedText.replace('AI:ENC:', '');

            // 步驟 2: ROT13 解密
            const base64Encoded = this.rot13(rot13Encoded);

            // 步驟 3: Base64 解碼
            const payloadJson = decodeURIComponent(escape(atob(base64Encoded)));

            // 步驟 4: 解析 JSON
            const payload = JSON.parse(payloadJson);

            return {
                success: true,
                data: payload.d,
                timestamp: payload.t,
                version: payload.v
            };
        } catch (error) {
            console.error('解碼失敗:', error);
            return { success: false, error: '解碼失敗' };
        }
    }

    /**
     * 生成編碼預覽（含格式化）
     * @param {string} plainText - 原始文字
     * @returns {string} - 格式化的編碼預覽
     */
    generatePreview(plainText) {
        const encoded = this.encode(plainText);
        if (!encoded) return '無法生成預覽';

        // 每 64 字符換行
        const formatted = encoded.match(/.{1,64}/g)?.join('\n') || encoded;
        return formatted;
    }

    /**
     * 驗證編碼完整性
     * @param {string} encodedText - 編碼文字
     * @returns {boolean} - 是否有效
     */
    validate(encodedText) {
        const result = this.decode(encodedText);
        return result.success;
    }

    /**
     * 獲取編碼統計
     * @param {string} encodedText - 編碼文字
     * @returns {object} - 統計數據
     */
    getStats(encodedText) {
        const decoded = this.decode(encodedText);
        return {
            valid: decoded.success,
            encodedLength: encodedText.length,
            decodedLength: decoded.success ? decoded.data.length : 0,
            compressionRatio: decoded.success 
                ? (encodedText.length / decoded.data.length).toFixed(2) 
                : 'N/A',
            timestamp: decoded.timestamp,
            age: decoded.timestamp ? Date.now() - decoded.timestamp : 0
        };
    }
}

// 全局實例
if (typeof window !== 'undefined') {
    window.aiEncoder = new AIEncoder();
    console.log('✅ AI 編碼系統初始化完成');
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIEncoder;
}
