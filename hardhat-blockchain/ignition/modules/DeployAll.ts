import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeployAllModule = buildModule("DeployAllModule", (m) => {
  // ============================================
  // Parameters with environment variable support
  // ============================================
  
  // PongEscrow parameters
  const backendOracleAddress = m.getParameter(
    "backendOracle",
    "0xa5526DF9eB2016D3624B4DC36a91608797B5b6d5"
  );

  // PongPowerUps parameters
  const baseURI = m.getParameter(
    "baseURI",
    "https://pong-it-pc.vercel.app/metadata/{id}.json"
  );
  
  const initialAdmin = m.getParameter(
    "admin",
    "0xa5526DF9eB2016D3624B4DC36a91608797B5b6d5"
  );
  
  const initialMinter = m.getParameter(
    "minter",
    "0xa5526DF9eB2016D3624B4DC36a91608797B5b6d5"
  );
  
  const gameOperator = m.getParameter(
    "gameOperator",
    "0xa5526DF9eB2016D3624B4DC36a91608797B5b6d5"
  );

  // ============================================
  // Contract Deployments
  // ============================================
  
  // Deploy PongEscrow
  const pongEscrow = m.contract("PongEscrow", [backendOracleAddress], {
    id: "PongEscrow"
  });

  // Deploy PongPowerUps
  const pongPowerUps = m.contract("PongPowerUps", [baseURI, initialAdmin, initialMinter, gameOperator], {
    id: "PongPowerUps"
  });

  // ============================================
  // Post-deployment verification calls
  // ============================================
  
  // Verify PongEscrow deployment by calling a view function
  m.call(pongEscrow, "backendOracle", [], {
    id: "verifyEscrowDeployment",
    after: [pongEscrow]
  });

  // Verify PongPowerUps deployment by calling a view function
  m.call(pongPowerUps, "supportsInterface", ["0x01ffc9a7"], {
    id: "verifyPowerUpsDeployment", 
    after: [pongPowerUps]
  });

  return { 
    pongEscrow, 
    pongPowerUps
  };
});

export default DeployAllModule;
