const hre = require("hardhat");

async function main() {
  console.log("============================================");
  console.log("🪙 部署小雨幣（XYC）智能合約");
  console.log("============================================\n");

  // 獲取部署者
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📍 部署信息:");
  console.log("  部署者地址:", deployer.address);
  console.log("  帳戶餘額:", hre.ethers.utils.formatEther(await deployer.getBalance()), "MATIC\n");
  
  // 地址配置
  const PIGGY_ADDRESS = process.env.PIGGY_ADDRESS || "0x...";
  const DADDY_ADDRESS = process.env.DADDY_ADDRESS || "0x...";
  const COMMUNITY_POOL_ADDRESS = process.env.COMMUNITY_POOL_ADDRESS || "0x...";
  
  console.log("📍 分配地址:");
  console.log("  小豬豬地址:", PIGGY_ADDRESS);
  console.log("  老爸地址:", DADDY_ADDRESS);
  console.log("  社區池地址:", COMMUNITY_POOL_ADDRESS);
  console.log("");
  
  // 驗證地址
  if (PIGGY_ADDRESS === "0x..." || DADDY_ADDRESS === "0x..." || COMMUNITY_POOL_ADDRESS === "0x...") {
    console.error("❌ 錯誤: 請在.env文件中配置正確的地址");
    process.exit(1);
  }
  
  // 部署合約
  console.log("🚀 開始部署 XiaoYuCoin 合約...\n");
  
  const XiaoYuCoin = await hre.ethers.getContractFactory("XiaoYuCoin");
  const xyc = await XiaoYuCoin.deploy(
    PIGGY_ADDRESS,
    DADDY_ADDRESS,
    COMMUNITY_POOL_ADDRESS
  );
  
  await xyc.deployed();
  
  console.log("✅ XiaoYuCoin 部署成功!");
  console.log("📍 合約地址:", xyc.address);
  console.log("");
  
  // 等待幾個區塊確認
  console.log("⏳ 等待區塊確認...");
  await xyc.deployTransaction.wait(5);
  console.log("✅ 5個區塊已確認\n");
  
  // 驗證初始分配
  console.log("📊 驗證代幣分配:");
  
  const piggyBalance = await xyc.balanceOf(PIGGY_ADDRESS);
  const daddyBalance = await xyc.balanceOf(DADDY_ADDRESS);
  const communityBalance = await xyc.balanceOf(COMMUNITY_POOL_ADDRESS);
  const totalSupply = await xyc.totalSupply();
  
  console.log("  小豬豬餘額:", hre.ethers.utils.formatEther(piggyBalance), "XYC (50%)");
  console.log("  老爸餘額:", hre.ethers.utils.formatEther(daddyBalance), "XYC (40%)");
  console.log("  社區池餘額:", hre.ethers.utils.formatEther(communityBalance), "XYC (10%)");
  console.log("  總供應量:", hre.ethers.utils.formatEther(totalSupply), "XYC");
  console.log("");
  
  // 驗證比例
  const total = piggyBalance.add(daddyBalance).add(communityBalance);
  if (total.eq(totalSupply)) {
    console.log("✅ 分配正確！總和等於總供應量");
  } else {
    console.log("❌ 警告：分配總和不等於總供應量");
  }
  console.log("");
  
  // 獲取合約信息
  const name = await xyc.name();
  const symbol = await xyc.symbol();
  const decimals = await xyc.decimals();
  
  console.log("📋 合約信息:");
  console.log("  名稱:", name);
  console.log("  符號:", symbol);
  console.log("  小數位:", decimals);
  console.log("");
  
  // 驗證合約（自動）
  console.log("🔍 準備驗證合約...");
  console.log("  請稍後手動運行以下命令:");
  console.log(`  npx hardhat verify --network ${hre.network.name} ${xyc.address} ${PIGGY_ADDRESS} ${DADDY_ADDRESS} ${COMMUNITY_POOL_ADDRESS}`);
  console.log("");
  
  // 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: xyc.address,
    deployer: deployer.address,
    piggyAddress: PIGGY_ADDRESS,
    daddyAddress: DADDY_ADDRESS,
    communityPoolAddress: COMMUNITY_POOL_ADDRESS,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  console.log("💾 部署信息已保存");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");
  
  console.log("============================================");
  console.log("✅ 部署完成!");
  console.log("============================================");
  console.log("");
  console.log("📍 重要信息:");
  console.log(`  合約地址: ${xyc.address}`);
  console.log(`  區塊鏈瀏覽器: https://polygonscan.com/address/${xyc.address}`);
  console.log("");
  console.log("📝 下一步:");
  console.log("  1. 更新 js/web3-integration.js 中的 XYC_CONTRACT_ADDRESS");
  console.log("  2. 驗證合約（見上方命令）");
  console.log("  3. 測試領取獎勵功能");
  console.log("  4. 宣布合約地址");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
