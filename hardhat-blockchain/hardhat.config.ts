import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    pushTestnet: {
      url: "https://evm.rpc-testnet-donut-node1.push.org/",
      chainId: 42101,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      pushTestnet: "blockscout",
    },
    customChains: [
      {
        network: "pushTestnet",
        chainId: 42101,
        urls: {
          apiURL: "https://donut.push.network/api",
          browserURL: "https://donut.push.network",
        },
      },
    ],
  },
};

export default config;
