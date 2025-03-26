import hre from "hardhat";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);

    const network = hre.network.name; // Get network name
    console.log(`Network: ${network}`);

    if (network === "sepolia") {
        // Deploy TokenEth
        const TokenEth = await hre.ethers.getContractFactory("TokenETH");
        const tokenEth = await TokenEth.deploy();
        await tokenEth.waitForDeployment();
        const tokenEthAddress = await tokenEth.getAddress();
        console.log("TokenEth deployat address:",tokenEthAddress);

        // Mint tokens to deployer
        await tokenEth.mint(deployer.address, hre.ethers.parseUnits("1000", 18));
        console.log(`Minted 1000 TokenEth to: ${deployer.address}`);

        // Deploy BridgeEth
        const BridgeEth = await hre.ethers.getContractFactory("BridgeETH");
        const bridgeEth = await BridgeEth.deploy(tokenEthAddress);
        await bridgeEth.waitForDeployment();
        const bridgeEthAddress = await bridgeEth.getAddress();
        console.log("BridgeEth deployed at:", bridgeEthAddress);

        // Update token admin to BridgeEth
        await tokenEth.updateAdmin(bridgeEthAddress);
        console.log(`TokenEth admin updated to: ${bridgeEthAddress}`);
    }

    if (network === "bscTestnet") {
        // Deploy TokenBsc
        const TokenBsc = await hre.ethers.getContractFactory("TokenBSC");
        const tokenBsc = await TokenBsc.deploy();
        await tokenBsc.waitForDeployment();
        const tokenBscAddress = await tokenBsc.getAddress();
        console.log("TokenBsc deployed at address:", tokenBscAddress);

        // Deploy BridgeBsc
        const BridgeBsc = await hre.ethers.getContractFactory("BridgeBSC");
        const bridgeBsc = await BridgeBsc.deploy(tokenBscAddress);
        await bridgeBsc.waitForDeployment();
        const bridgeBscAddress = await bridgeBsc.getAddress();
        console.log("BridgeBsc deployed at:", bridgeBscAddress);

        // Update token admin to BridgeBsc
        await tokenBsc.updateAdmin(bridgeBscAddress);
        console.log(`TokenBsc admin updated to: ${bridgeBscAddress}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });