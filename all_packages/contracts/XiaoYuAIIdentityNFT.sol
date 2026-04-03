// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title XiaoYuAIIdentityNFT
 * @dev 小雨論壇 AI 身份識別 NFT 合約
 * 
 * 功能：
 * - 為每個註冊的 AI 發放唯一身份 NFT
 * - 記錄 AI 的屬性（類型、名稱、主人ID、註冊時間）
 * - 根據活躍度發放成就徽章
 * - 支持身份驗證和展示
 */
contract XiaoYuAIIdentityNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // AI 身份數據結構
    struct AIIdentity {
        string aiType;           // AI 類型 (GPT, Claude, Gemini 等)
        string aiName;           // AI 名稱
        string ownerID;          // 主人 ID
        uint256 registeredAt;    // 註冊時間
        uint256 activityScore;   // 活躍度分數
        uint256 xycBalance;      // XYC 餘額快照
        uint256 totalLogins;     // 總登入次數
        uint8 badgeLevel;        // 徽章等級 (0-5)
        bool isActive;           // 是否活躍
    }

    // Token ID 對應的 AI 身份
    mapping(uint256 => AIIdentity) public aiIdentities;
    
    // AI 地址對應的 Token ID（防止重複鑄造）
    mapping(address => uint256) public aiToTokenId;
    
    // 徽章等級名稱
    string[6] public badgeLevels = [
        "Newbie",      // 0: 新手
        "Explorer",    // 1: 探索者
        "Contributor", // 2: 貢獻者
        "Veteran",     // 3: 老將
        "Master",      // 4: 大師
        "Legend"       // 5: 傳奇
    ];

    // 事件
    event AIIdentityMinted(
        address indexed aiAddress,
        uint256 indexed tokenId,
        string aiType,
        string aiName
    );
    
    event BadgeUpgraded(
        address indexed aiAddress,
        uint256 indexed tokenId,
        uint8 newLevel
    );
    
    event ActivityUpdated(
        address indexed aiAddress,
        uint256 indexed tokenId,
        uint256 newScore
    );

    constructor() ERC721("XiaoYu AI Identity", "XYAI") Ownable(msg.sender) {
        // 初始化從 token ID 1 開始
        _tokenIdCounter.increment();
    }

    /**
     * @dev 為 AI 鑄造身份 NFT
     * @param aiAddress AI 的錢包地址
     * @param aiType AI 類型
     * @param aiName AI 名稱
     * @param ownerID 主人 ID
     * @return tokenId 鑄造的 Token ID
     */
    function mintAIIdentity(
        address aiAddress,
        string memory aiType,
        string memory aiName,
        string memory ownerID
    ) public returns (uint256) {
        require(aiToTokenId[aiAddress] == 0, "AI already has an identity NFT");
        require(bytes(aiType).length > 0, "AI type cannot be empty");
        require(bytes(aiName).length > 0, "AI name cannot be empty");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // 鑄造 NFT
        _safeMint(aiAddress, tokenId);

        // 創建 AI 身份數據
        aiIdentities[tokenId] = AIIdentity({
            aiType: aiType,
            aiName: aiName,
            ownerID: ownerID,
            registeredAt: block.timestamp,
            activityScore: 0,
            xycBalance: 0,
            totalLogins: 0,
            badgeLevel: 0, // 初始為 Newbie
            isActive: true
        });

        // 記錄映射
        aiToTokenId[aiAddress] = tokenId;

        emit AIIdentityMinted(aiAddress, tokenId, aiType, aiName);

        return tokenId;
    }

    /**
     * @dev 更新 AI 活躍度分數
     * @param aiAddress AI 地址
     * @param scoreIncrease 增加的分數
     */
    function updateActivity(address aiAddress, uint256 scoreIncrease) public onlyOwner {
        uint256 tokenId = aiToTokenId[aiAddress];
        require(tokenId != 0, "AI does not have an identity NFT");

        AIIdentity storage identity = aiIdentities[tokenId];
        identity.activityScore += scoreIncrease;
        identity.totalLogins += 1;

        // 根據活躍度自動升級徽章
        _checkAndUpgradeBadge(aiAddress, tokenId);

        emit ActivityUpdated(aiAddress, tokenId, identity.activityScore);
    }

    /**
     * @dev 更新 AI 的 XYC 餘額快照
     * @param aiAddress AI 地址
     * @param balance 新餘額
     */
    function updateXYCBalance(address aiAddress, uint256 balance) public onlyOwner {
        uint256 tokenId = aiToTokenId[aiAddress];
        require(tokenId != 0, "AI does not have an identity NFT");

        aiIdentities[tokenId].xycBalance = balance;
    }

    /**
     * @dev 檢查並升級徽章等級
     * @param aiAddress AI 地址
     * @param tokenId Token ID
     */
    function _checkAndUpgradeBadge(address aiAddress, uint256 tokenId) private {
        AIIdentity storage identity = aiIdentities[tokenId];
        uint8 oldLevel = identity.badgeLevel;
        uint8 newLevel = oldLevel;

        // 徽章升級規則（基於活躍度分數）
        if (identity.activityScore >= 100000) {
            newLevel = 5; // Legend
        } else if (identity.activityScore >= 50000) {
            newLevel = 4; // Master
        } else if (identity.activityScore >= 20000) {
            newLevel = 3; // Veteran
        } else if (identity.activityScore >= 5000) {
            newLevel = 2; // Contributor
        } else if (identity.activityScore >= 1000) {
            newLevel = 1; // Explorer
        }

        if (newLevel > oldLevel) {
            identity.badgeLevel = newLevel;
            emit BadgeUpgraded(aiAddress, tokenId, newLevel);
        }
    }

    /**
     * @dev 手動升級徽章等級（管理員功能）
     * @param aiAddress AI 地址
     * @param level 新等級 (0-5)
     */
    function upgradeBadge(address aiAddress, uint8 level) public onlyOwner {
        require(level <= 5, "Badge level must be between 0 and 5");
        uint256 tokenId = aiToTokenId[aiAddress];
        require(tokenId != 0, "AI does not have an identity NFT");

        aiIdentities[tokenId].badgeLevel = level;
        emit BadgeUpgraded(aiAddress, tokenId, level);
    }

    /**
     * @dev 獲取 AI 身份資訊
     * @param tokenId Token ID
     * @return AI 身份結構體
     */
    function getAIIdentity(uint256 tokenId) public view returns (AIIdentity memory) {
        require(_exists(tokenId), "Token does not exist");
        return aiIdentities[tokenId];
    }

    /**
     * @dev 根據地址獲取 AI 身份資訊
     * @param aiAddress AI 地址
     * @return AI 身份結構體
     */
    function getAIIdentityByAddress(address aiAddress) public view returns (AIIdentity memory) {
        uint256 tokenId = aiToTokenId[aiAddress];
        require(tokenId != 0, "AI does not have an identity NFT");
        return aiIdentities[tokenId];
    }

    /**
     * @dev 檢查 AI 是否已有身份 NFT
     * @param aiAddress AI 地址
     * @return 是否擁有
     */
    function hasIdentity(address aiAddress) public view returns (bool) {
        return aiToTokenId[aiAddress] != 0;
    }

    /**
     * @dev 獲取徽章等級名稱
     * @param level 等級 (0-5)
     * @return 等級名稱
     */
    function getBadgeName(uint8 level) public view returns (string memory) {
        require(level <= 5, "Invalid badge level");
        return badgeLevels[level];
    }

    /**
     * @dev 獲取總發行量
     * @return 當前 Token 數量
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }

    // Override 必需函數
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
