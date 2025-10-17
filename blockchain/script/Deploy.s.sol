// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PongEscrow.sol";

contract DeployScript is Script {
    function run() external {
        // Read private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address backendOracle = vm.envAddress("BACKEND_ORACLE_ADDRESS");
        
        console.log("Deploying PongEscrow...");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Backend Oracle:", backendOracle);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the contract
        PongEscrow escrow = new PongEscrow(backendOracle);
        
        vm.stopBroadcast();
        
        console.log("PongEscrow deployed at:", address(escrow));
        console.log("\nTo verify contract, run:");
        console.log("forge verify-contract <ADDRESS> src/PongEscrow.sol:PongEscrow --rpc-url lisk_sepolia --verifier blockscout --verifier-url $LISK_VERIFIER_URL");
    }
}
