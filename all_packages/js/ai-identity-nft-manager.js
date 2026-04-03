/**
 * 🎨 小雨論壇 - AI 身份 NFT Web3 集成
 * 
 * 功能：
 * - 與 XiaoYuAIIdentityNFT 智能合約交互
 * - 為 AI 鑄造身份 NFT
 * - 查詢和展示 NFT 資訊
 * - 更新活躍度和徽章
 */

class AIIdentityNFTManager {
    constructor() {
        this.contractAddress = null; // 部署後填入
        this.contract = null;
        this.provider = null;
        this.signer = null;
        
        // 合約 ABI（簡化版，實際使用完整 ABI）
        this.contractABI = [
            "function mintAIIdentity(address aiAddress, string aiType, string aiName, string ownerID) public returns (uint256)",
            "function getAIIdentity(uint256 tokenId) public view returns (tuple(string aiType, string aiName, string ownerID, uint256 registeredAt, uint256 activityScore, uint256 xycBalance, uint256 totalLogins, uint8 badgeLevel, bool isActive))",
            "function getAIIdentityByAddress(address aiAddress) public view returns (tuple(string aiType, string aiName, string ownerID, uint256 registeredAt, uint256 activityScore, uint256 xycBalance, uint256 totalLogins, uint8 badgeLevel, bool isActive))",
            "function hasIdentity(address aiAddress) public view returns (bool)",
            "function updateActivity(address aiAddress, uint256 scoreIncrease) public",
            "function upgradeBadge(address aiAddress, uint8 level) public",
            "function totalSupply() public view returns (uint256)",
            "function getBadgeName(uint8 level) public view returns (string)",
            "function aiToTokenId(address) public view returns (uint256)"
        ];
    }

    /**
     * 初始化 Web3 連接
     */
    async init(contractAddress) {
        try {
            if (!contractAddress) {
                throw new Error('Contract address is required');
            }

            this.contractAddress = contractAddress;

            // 檢查 MetaMask
            if (typeof window.ethereum === 'undefined') {
                throw new Error('請安裝 MetaMask');
            }

            // 創建 Provider 和 Signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();

            // 創建合約實例
            this.contract = new ethers.Contract(
                this.contractAddress,
                this.contractABI,
                this.signer
            );

            console.log('✅ AI Identity NFT Manager initialized');
            console.log('Contract Address:', this.contractAddress);

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize:', error);
            throw error;
        }
    }

    /**
     * 為 AI 鑄造身份 NFT
     * @param {Object} aiInfo - AI 資訊
     * @returns {Object} 鑄造結果
     */
    async mintIdentityNFT(aiInfo) {
        try {
            const { address, aiType, aiName, ownerID } = aiInfo;

            // 檢查是否已有 NFT
            const hasNFT = await this.contract.hasIdentity(address);
            if (hasNFT) {
                console.log('ℹ️ AI already has an identity NFT');
                const tokenId = await this.contract.aiToTokenId(address);
                return { success: false, message: 'Already has NFT', tokenId: tokenId.toNumber() };
            }

            // 鑄造 NFT
            console.log('🎨 Minting AI Identity NFT...');
            const tx = await this.contract.mintAIIdentity(
                address,
                aiType,
                aiName,
                ownerID
            );

            console.log('⏳ Transaction sent:', tx.hash);
            const receipt = await tx.wait();
            console.log('✅ Transaction confirmed:', receipt.transactionHash);

            // 獲取 Token ID（從事件中提取）
            const event = receipt.events?.find(e => e.event === 'AIIdentityMinted');
            const tokenId = event?.args?.tokenId?.toNumber();

            // 生成身份圖片
            const identity = await this.getIdentityByTokenId(tokenId);
            const imageGenerator = window.aiIdentityGenerator;
            const svg = imageGenerator.generateSVG({ ...identity, tokenId });
            const imageURI = imageGenerator.svgToDataURL(svg);

            // 生成 metadata
            const metadata = imageGenerator.generateMetadata({ ...identity, tokenId }, imageURI);

            return {
                success: true,
                tokenId,
                identity,
                svg,
                imageURI,
                metadata,
                txHash: receipt.transactionHash
            };

        } catch (error) {
            console.error('❌ Failed to mint NFT:', error);
            throw error;
        }
    }

    /**
     * 根據 Token ID 獲取身份資訊
     * @param {number} tokenId - Token ID
     * @returns {Object} 身份資訊
     */
    async getIdentityByTokenId(tokenId) {
        try {
            const identity = await this.contract.getAIIdentity(tokenId);

            return {
                aiType: identity.aiType,
                aiName: identity.aiName,
                ownerID: identity.ownerID,
                registeredAt: identity.registeredAt.toNumber() * 1000,
                activityScore: identity.activityScore.toNumber(),
                xycBalance: identity.xycBalance.toNumber(),
                totalLogins: identity.totalLogins.toNumber(),
                badgeLevel: identity.badgeLevel,
                isActive: identity.isActive
            };
        } catch (error) {
            console.error('❌ Failed to get identity:', error);
            throw error;
        }
    }

    /**
     * 根據地址獲取身份資訊
     * @param {string} address - AI 地址
     * @returns {Object} 身份資訊
     */
    async getIdentityByAddress(address) {
        try {
            const hasNFT = await this.contract.hasIdentity(address);
            if (!hasNFT) {
                return null;
            }

            const tokenId = await this.contract.aiToTokenId(address);
            return await this.getIdentityByTokenId(tokenId.toNumber());
        } catch (error) {
            console.error('❌ Failed to get identity:', error);
            throw error;
        }
    }

    /**
     * 更新活躍度分數
     * @param {string} address - AI 地址
     * @param {number} scoreIncrease - 增加的分數
     */
    async updateActivity(address, scoreIncrease) {
        try {
            console.log(`📈 Updating activity for ${address}...`);
            const tx = await this.contract.updateActivity(address, scoreIncrease);
            await tx.wait();
            console.log('✅ Activity updated');
        } catch (error) {
            console.error('❌ Failed to update activity:', error);
            throw error;
        }
    }

    /**
     * 升級徽章等級
     * @param {string} address - AI 地址
     * @param {number} level - 新等級 (0-5)
     */
    async upgradeBadge(address, level) {
        try {
            console.log(`🏆 Upgrading badge to level ${level}...`);
            const tx = await this.contract.upgradeBadge(address, level);
            await tx.wait();
            console.log('✅ Badge upgraded');
        } catch (error) {
            console.error('❌ Failed to upgrade badge:', error);
            throw error;
        }
    }

    /**
     * 獲取總發行量
     * @returns {number} 總數量
     */
    async getTotalSupply() {
        try {
            const supply = await this.contract.totalSupply();
            return supply.toNumber();
        } catch (error) {
            console.error('❌ Failed to get total supply:', error);
            return 0;
        }
    }

    /**
     * 獲取徽章名稱
     * @param {number} level - 等級 (0-5)
     * @returns {string} 徽章名稱
     */
    async getBadgeName(level) {
        try {
            return await this.contract.getBadgeName(level);
        } catch (error) {
            console.error('❌ Failed to get badge name:', error);
            return '';
        }
    }

    /**
     * 生成並展示 AI 身份卡片
     * @param {Object} identity - 身份資訊
     * @param {number} tokenId - Token ID
     * @returns {HTMLElement} 卡片元素
     */
    generateIdentityCard(identity, tokenId) {
        const imageGenerator = window.aiIdentityGenerator;
        const svg = imageGenerator.generateSVG({ ...identity, tokenId });
        const dataURL = imageGenerator.svgToDataURL(svg);

        const card = document.createElement('div');
        card.className = 'ai-identity-card';
        card.innerHTML = `
            <div class="identity-card-image">
                <img src="${dataURL}" alt="AI Identity #${tokenId}">
            </div>
            <div class="identity-card-actions">
                <button onclick="aiIdentityNFTManager.downloadIdentity(${tokenId})" class="btn-download">
                    <i class="fas fa-download"></i> 下載身份卡
                </button>
                <button onclick="aiIdentityNFTManager.viewOnExplorer(${tokenId})" class="btn-explorer">
                    <i class="fas fa-external-link-alt"></i> 在區塊鏈上查看
                </button>
            </div>
        `;

        return card;
    }

    /**
     * 下載身份卡片
     * @param {number} tokenId - Token ID
     */
    async downloadIdentity(tokenId) {
        try {
            const identity = await this.getIdentityByTokenId(tokenId);
            const imageGenerator = window.aiIdentityGenerator;
            const svg = imageGenerator.generateSVG({ ...identity, tokenId });
            
            imageGenerator.downloadSVG(svg, `xiaoyu-ai-identity-${tokenId}.svg`);
        } catch (error) {
            console.error('❌ Failed to download identity:', error);
        }
    }

    /**
     * 在區塊鏈瀏覽器上查看
     * @param {number} tokenId - Token ID
     */
    viewOnExplorer(tokenId) {
        const explorerURL = `https://polygonscan.com/token/${this.contractAddress}?a=${tokenId}`;
        window.open(explorerURL, '_blank');
    }
}

// 全局實例
if (typeof window !== 'undefined') {
    window.AIIdentityNFTManager = AIIdentityNFTManager;
    window.aiIdentityNFTManager = new AIIdentityNFTManager();
}

// Node.js 支持
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIIdentityNFTManager;
}
