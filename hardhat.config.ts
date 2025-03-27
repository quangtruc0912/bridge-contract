import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";


dotenv.config(); // Load .env file

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    L1Etherscan: process.env.ETHERSCAN_API_KEY,
  },
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
      accounts: [process.env.HARDHAT_PRIVATE_KEY1, process.env.HARDHAT_PRIVATE_KEY2, process.env.HARDHAT_PRIVATE_KEY3].filter((key): key is string => !!key)
    },
    bscLocal: {
      url: process.env.HARDHAT_LOCAL_BSC || "",
      accounts: [process.env.HARDHAT_PRIVATE_KEY1, process.env.HARDHAT_PRIVATE_KEY2, process.env.HARDHAT_PRIVATE_KEY3].filter((key): key is string => !!key)
    },
  },

};

export default config;