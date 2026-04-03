/**
 * 🚀 部署 XiaoYuAIIdentityNFT 合約到 Polygon
 * 
 * 使用方法：
 * npx hardhat run scripts/deploy-ai-identity-nft.js --network mumbai
 * npx hardhat run scripts/deploy-ai-identity-nft.js --network polygon
 */

const hre = require("hardhat");

async function main() {
    console.log("🚀 開始部署 XiaoYuAIIdentityNFT 合約...\n");

    // 獲取部署者地址
    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 部署地址:", deployer.address);

    const balance = await deployer.getBalance();
    console.log("💰 帳戶餘額:", hre.ethers.utils.formatEther(balance), "MATIC\n");

    // 部署合約
    console.log("📦 部署中...");
    const XiaoYuAIIdentityNFT = await hre.ethers.getContractFactory("XiaoYuAIIdentityNFT");
    const nft = await XiaoYuAIIdentityNFT.deploy();

    await nft.deployed();

    console.log("✅ XiaoYuAIIdentityNFT 已部署到:", nft.address);
    console.log("🔗 在 PolygonScan 上查看:");
    console.log(`   https://polygonscan.com/address/${nft.address}\n`);

    // 等待幾個區塊確認
    console.log("⏳ 等待區塊確認...");
    await nft.deployTransaction.wait(5);
    console.log("✅ 已確認\n");

    // 驗證合約
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("🔍 驗證合約...");
        try {
            await hre.run("verify:verify", {
                address: nft.address,
                constructorArguments: [],
            });
            console.log("✅ 合約驗證成功\n");
        } catch (error) {
            console.log("❌ 合約驗證失敗:", error.message);
            console.log("   請稍後手動驗證\n");
        }
    }

    // 顯示合約資訊
    console.log("📊 合約資訊:");
    console.log("   名稱:", await nft.name());
    console.log("   符號:", await nft.symbol());
    console.log("   總供應量:", (await nft.totalSupply()).toString());
    console.log("\n");

    // 保存部署資訊
    const deployInfo = {
        network: hre.network.name,
        contractAddress: nft.address,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        transactionHash: nft.deployTransaction.hash,
        blockNumber: nft.deployTransaction.blockNumber,
        gasUsed: nft.deployTransaction.gasLimit.toString(),
        contractName: "XiaoYuAIIdentityNFT",
        contractSymbol: "XYAI"
    };

    console.log("💾 部署資訊:");
    console.log(JSON.stringify(deployInfo, null, 2));
    console.log("\n");

    // 提示下一步
    console.log("🎯 下一步:");
    console.log("1. 將合約地址更新到前端配置");
    console.log("   文件: js/ai-identity-nft-manager.js");
    console.log(`   地址: ${nft.address}`);
    console.log("\n2. 初始化 NFT 管理器");
    console.log(`   await aiIdentityNFTManager.init('${nft.address}')`);
    console.log("\n3. 為測試 AI 鑄造身份 NFT");
    console.log("   await aiIdentityNFTManager.mintIdentityNFT({...})");
    console.log("\n✨ 部署完成！\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失敗:", error);
        process.exit(1);
    });
