import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "PC\n");

  // ============================================
  // 1. Deploy PongEscrow
  // ============================================
  const backendOracleAddress = process.env.BACKEND_ORACLE_ADDRESS || deployer.address;
  
  console.log("📦 Deploying PongEscrow...");
  console.log("Backend Oracle:", backendOracleAddress);

  const PongEscrow = await ethers.getContractFactory("PongEscrow");
  const pongEscrow = await PongEscrow.deploy(backendOracleAddress);
  await pongEscrow.waitForDeployment();

  const escrowAddress = await pongEscrow.getAddress();
  console.log("✅ PongEscrow deployed to:", escrowAddress);

  // ============================================
  // 2. Deploy PongPowerUps
  // ============================================
  console.log("\n📦 Deploying PongPowerUps...");
  
  const baseURI = process.env.POWERUP_BASE_URI || "https://pong-it-pc.vercel.app/metadata/{id}.json";
  const initialAdmin = process.env.POWERUP_ADMIN || deployer.address;
  const initialMinter = process.env.POWERUP_MINTER || deployer.address;
  const gameOperator = backendOracleAddress; // Backend can act as game operator

  console.log("Base URI:", baseURI);
  console.log("Admin:", initialAdmin);
  console.log("Minter:", initialMinter);
  console.log("Game Operator:", gameOperator);

  const PongPowerUps = await ethers.getContractFactory("PongPowerUps");
  const pongPowerUps = await PongPowerUps.deploy(
    baseURI,
    initialAdmin,
    initialMinter,
    gameOperator
  );
  await pongPowerUps.waitForDeployment();

  const powerUpsAddress = await pongPowerUps.getAddress();
  console.log("✅ PongPowerUps deployed to:", powerUpsAddress);

  // ============================================
  // 3. Summary
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("PongEscrow:", escrowAddress);
  console.log("PongPowerUps:", powerUpsAddress);
  console.log("Backend Oracle:", backendOracleAddress);
  console.log("=".repeat(60));

  // ============================================
  // 4. Verification Commands
  // ============================================
  console.log("\n🔍 TO VERIFY ON BLOCKSCOUT:");
  console.log("=".repeat(60));
  console.log("\n1. PongEscrow:");
  console.log(`npx hardhat verify --network pushTestnet ${escrowAddress} ${backendOracleAddress}`);
  
  console.log("\n2. PongPowerUps:");
  console.log(`npx hardhat verify --network pushTestnet ${powerUpsAddress} "${baseURI}" ${initialAdmin} ${initialMinter} ${gameOperator}`);
  console.log("=".repeat(60));

  // ============================================
  // 5. Environment Variables to Set
  // ============================================
  console.log("\n⚙️  ENVIRONMENT VARIABLES TO UPDATE:");
  console.log("=".repeat(60));
  console.log("Frontend (.env):");
  console.log(`VITE_PONG_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`VITE_PONG_POWERUPS_ADDRESS=${powerUpsAddress}`);
  console.log(`VITE_BACKEND_URL=https://pong-it-pc.onrender.com`);
  console.log("");
  console.log("Backend (Render environment variables):");
  console.log(`PONG_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`PONG_POWERUPS_ADDRESS=${powerUpsAddress}`);
  console.log(`SIGNING_WALLET_PRIVATE_KEY=<your-private-key>`);
  console.log("=".repeat(60));

  // ============================================
  // 6. Save Deployment Info
  // ============================================
  const deploymentInfo = {
    network: "pushTestnet",
    chainId: 42101,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      PongEscrow: {
        address: escrowAddress,
        backendOracle: backendOracleAddress
      },
      PongPowerUps: {
        address: powerUpsAddress,
        baseURI,
        admin: initialAdmin,
        minter: initialMinter,
        gameOperator
      }
    }
  };

  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "latest.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: deployments/latest.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

