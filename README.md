# Simple Bridge Contract
    A simple burn-and-mint bridge with added security via multisig and send some native cryptocurrency for doing stuff onchain.
    Lesson learned : Cross-Chain Communication via On-Chain and Off-Chain Coordination, Multisig Adds Complexity but Enhances Security.
    

## Setup

### Clone the Repository
```bash
git clone https://github.com/quangtruc0912/bridge-contract.git
cd bridge-contract
```

### Install Dependencies
```bash
npm install
```

### Initialize Hardhat (if not already set up)
```bash
npx hardhat init
```

### Configure Environment Variables
```bash
cp .env.sample .env
```
For local testing:
1. Run `npx hardhat node` to start a local blockchain.
2. Use the displayed free accounts and update the `.env` file with the following minimum configuration:
    ```plaintext
    HARDHAT_PRIVATE_KEY1=0xYOURKEY1
    HARDHAT_PRIVATE_KEY2=0xYOURKEY2
    HARDHAT_PRIVATE_KEY3=0xYOURKEY3
    HARDHAT_LOCAL_ETH=http://127.0.0.1:8545
    HARDHAT_LOCAL_BSC=http://127.0.0.1:8546
    ```


## Project Structure

- **contracts/**: Contains Solidity files:
  - `BridgeBase.sol`: Core functionality for a cross-chain bridge, enabling controlled token minting, burning, ETH transfers, and multi-signature governance.
  - `BridgeBSC.sol`: Extends `BridgeBase` for Binance Smart Chain.
  - `BridgeETH.sol`: Extends `BridgeBase` for Ethereum.
  - `TokenBase.sol`: ERC-20 token contract with admin-controlled minting, burning, and updates.
  - `TokenBSC.sol`: Extends `TokenBase` for BSC-side token operations.
  - `TokenETH.sol`: Extends `TokenBase` for ETH-side token operations.

- **scripts/**:
  - `deployLocalETH.ts`: Deploys `TokenETH` and `BridgeETH` contracts, mints tokens, and transfers funds to the bridge.
  - `deployLocalBSC.ts`: Deploys `TokenBSC` and `BridgeBSC` contracts and transfers funds to the bridge.
  - `bridgeAPI.ts`: Listens for `Transfer` events from `BridgeETH` and triggers `mint`.
  - `burnLocal.ts`: Initiates token burning.
  - `checkTokenPrice.ts`: Checks token prices.

- **hardhat.config.js**: Configuration file for Hardhat.

- **.env**: Contains environment variables (excluded from version control).

## Running test
Optional: for `test` Gas tracker
add two keys and set REPORT_GAS=true
COINMARKETCAP_API_KEY=
ETHERSCAN_API_KEY=
```bash 
    npx hardhat test test/Bridge.ts
```
A table of gas comsume should display on the terminal


## Running Scripts
1. Start 2 local nodes (if testing locally, open 2 terminal 1 for ETH and 1 for BSC):

```bash 
npx hardhat node --port 8545  # Ethereum
npx hardhat node --port 8546  # BSC
```

2. Deploys `TokenETH` and `BridgeETH` contracts at ETH CHAIN 

```bash 
    npx hardhat run scripts/deploylocalETH.ts --network ethLocal
``` 
Observe: copy `bridgeEthAddress`  and replace `bridgeEthAddress` at 2 file  `burnLocal.ts` and `bridgeAPI.ts`
         copy `deployerAddress`  and replace `deployerAddress` at 1 file  `checkTokenPrice.ts`

3. Deploys `TokenBSC` and `BridgeBSC` contracts at BSC CHAIN  

```bash 
    npx hardhat run scripts/deploylocalBSC.ts --network bscLocal
``` 
Observe: copy `bridgeBSCAddress`  and replace `bridgeBSCAddress` at 2 file  `bridgeAPI.ts` and `checkTokenPrice.ts`
         copy `bridgeBSCAddress`  and replace `tokenBscAddress` at 1 file `checkTokenPrice.ts`

4. Open another terminal for Relayer (listen to burn action at ETH)

```bash 
   npx hardhat run scripts/bridgeAPI.ts
``` 

5. Burn token

```bash 
   npx hardhat run scripts/burnlocal.ts --network ethLocal
``` 

6. Come back to the terminal at step 4 to Observe

```bash 
   npx hardhat run scripts/burnlocal.ts --network ethLocal
``` 

6. Check balance of the burner on bsc 

```bash 
   npx hardhat run scripts/checkTokenPrice.ts --network bscLocal
``` 