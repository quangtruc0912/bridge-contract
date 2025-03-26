import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";


dotenv.config(); // Load .env file

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.WALLET_TEST_BRIDGE_PRIVATE_KEY 
        ? [process.env.WALLET_TEST_BRIDGE_PRIVATE_KEY] 
        : [],
    },
    bscTestNet: {
      url: process.env.BSCTEST_RPC_URL || "",
      accounts: process.env.WALLET_TEST_BRIDGE_PRIVATE_KEY 
        ? [process.env.WALLET_TEST_BRIDGE_PRIVATE_KEY] 
        : [],
    },
    ethLocal: {
      url: process.env.HARDHAT_LOCAL_ETH || "",
      accounts: process.env.HARDHAT_PRIVATE_KEY 
        ? [process.env.HARDHAT_PRIVATE_KEY] 
        : [],
    },
    bscLocal: {
      url: process.env.HARDHAT_LOCAL_BSC || "",
      accounts: process.env.HARDHAT_PRIVATE_KEY 
        ? [process.env.HARDHAT_PRIVATE_KEY] 
        : [],
    },
  },
};

export default config;